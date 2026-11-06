// Dev API handlers — mounted by server/api.ts inside the Vite dev server.
// This is the seam where Supabase takes over in production (D6/D20):
// the React app only talks to these endpoints via src/db/apiClient.ts.

import type { IncomingMessage, ServerResponse } from 'node:http';
import { PrismaClient } from '@prisma/client';
import { verifyPassword } from './passwords';
import { flagFor } from '../src/lib/clinical/flags';
import { eddFromLmp } from '../src/lib/clinical/ga';
import { anonymousIdFor, nextPatientCode } from '../src/lib/sequence';

// Dev convenience: default to the local SQLite file when no env is set.
// Production always provides DATABASE_URL explicitly (Supabase Postgres, D6).
process.env.DATABASE_URL ??= 'file:./dev.db';

const prisma = new PrismaClient();

type AuthedUser = { id: string; name: string; role: string };

function json(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer) => {
      data += chunk.toString('utf8');
      if (data.length > 1_000_000) reject(new Error('body_too_large'));
    });
    req.on('end', () => {
      try {
        resolve(data ? (JSON.parse(data) as Record<string, unknown>) : {});
      } catch {
        reject(new Error('invalid_json'));
      }
    });
    req.on('error', reject);
  });
}

// Dev token format: "dev-<userId>" (localStorage client-side). Not production auth.
async function authenticate(req: IncomingMessage): Promise<AuthedUser | null> {
  const header = req.headers['x-dev-token'];
  const token = Array.isArray(header) ? header[0] : header;
  if (!token || !token.startsWith('dev-')) return null;
  const user = await prisma.user.findUnique({ where: { id: token.slice(4) } });
  return user ? { id: user.id, name: user.name, role: user.role } : null;
}

async function audit(userId: string | null, action: string, entity: string, entityId?: string, detail?: string) {
  await prisma.auditLog.create({ data: { userId, action, entity, entityId, detail } });
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = url.pathname.replace(/^\//, '');
  const method = req.method ?? 'GET';

  // --- public ---
  if (method === 'GET' && path === 'health') {
    return json(res, 200, { ok: true, service: 'aymanclinic-dev-api' });
  }

  if (method === 'POST' && path === 'auth/login') {
    const body = await readBody(req);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return json(res, 401, { error: 'invalid_credentials' });
    }
    await audit(user.id, 'login', 'user', user.id);
    return json(res, 200, {
      user: { id: user.id, name: user.name, role: user.role, email: user.email },
      token: `dev-${user.id}`,
    });
  }

  // --- everything below requires auth ---
  const user = await authenticate(req);
  if (!user) return json(res, 401, { error: 'unauthenticated' });

  if (method === 'GET' && path === 'patients') {
    const search = (url.searchParams.get('search') ?? '').trim();
    const patients = await prisma.patient.findMany({
      where: search
        ? {
            OR: [
              { patientCode: { contains: search } },
              { identity: { fullName: { contains: search } } },
              { identity: { mobile: { contains: search } } },
            ],
          }
        : undefined,
      include: {
        identity: true,
        episodes: { select: { type: true, status: true } },
      },
      orderBy: { patientCode: 'asc' },
      take: 100,
    });
    return json(
      res,
      200,
      patients.map((p) => ({
        id: p.id,
        patientCode: p.patientCode,
        fullName: p.identity?.fullName ?? '—',
        mobile: p.identity?.mobile ?? null,
        modules: [...new Set(p.episodes.map((e) => e.type))],
        openEpisodes: p.episodes.filter((e) => e.status === 'open').length,
      })),
    );
  }

  const patientMatch = /^patients\/([^/]+)$/.exec(path);
  if (method === 'GET' && patientMatch) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientMatch[1] },
      include: {
        identity: true,
        obstetricHistory: { orderBy: { sortOrder: 'asc' } },
        episodes: {
          include: {
            pregnancy: true,
            gyn: true,
            ultrasounds: { orderBy: { scanDate: 'asc' } },
            semenAnalyses: { orderBy: { analysisDate: 'asc' } },
            visits: { orderBy: { visitDate: 'asc' } },
            prescriptions: { include: { medication: true } },
            diagnoses: { orderBy: { diagnosedAt: 'asc' } },
          },
        },
        labReports: { include: { results: true }, orderBy: { reportDate: 'asc' } },
        appointments: { orderBy: { scheduledAt: 'asc' } },
      },
    });
    if (!patient) return json(res, 404, { error: 'not_found' });
    return json(res, 200, patient);
  }

  if (method === 'GET' && path === 'test-definitions') {
    const defs = await prisma.testDefinition.findMany({ orderBy: [{ panel: 'asc' }, { sortOrder: 'asc' }] });
    return json(res, 200, defs);
  }

  // ---------- mutations ----------

  // Create patient + identity + first episode (OBS or GYN) — D14 code sequencing
  if (method === 'POST' && path === 'patients') {
    const body = await readBody(req);
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const episodeType = body.episodeType === 'OBS' || body.episodeType === 'GYN' ? body.episodeType : null;
    if (!fullName || !episodeType) return json(res, 400, { error: 'fullName and episodeType (OBS|GYN) are required' });

    const codes = (await prisma.patient.findMany({ select: { patientCode: true } })).map((p) => p.patientCode);
    const patientCode = nextPatientCode(codes);
    const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
    const date = (v: unknown) => (typeof v === 'string' && v && !Number.isNaN(Date.parse(v)) ? new Date(v) : null);

    const patient = await prisma.patient.create({
      data: {
        patientCode,
        anonymousId: anonymousIdFor(patientCode),
        dateOfBirth: date(body.dateOfBirth),
        bloodGroup: str(body.bloodGroup),
        rhType: str(body.rhType),
        identity: {
          create: { fullName, mobile: str(body.mobile), address: str(body.address), husbandName: str(body.husbandName) },
        },
        episodes: {
          create: {
            type: episodeType,
            location: str(body.location),
            ...(episodeType === 'OBS'
              ? {
                  pregnancy: {
                    create: {
                      lmpDate: date(body.lmpDate),
                      eddDate: date(body.lmpDate) ? eddFromLmp(date(body.lmpDate)!) : null,
                      gravida: num(body.gravida),
                      parity: num(body.parity),
                      abortions: num(body.abortions),
                    },
                  },
                }
              : {
                  gyn: {
                    create: {
                      marriedFor: str(body.marriedFor),
                      contraception: str(body.contraception),
                      menstrualHistory: str(body.menstrualHistory),
                    },
                  },
                }),
          },
        },
      },
    });
    await audit(user.id, 'create', 'patient', patient.id, `${patientCode} (${episodeType})`);
    return json(res, 201, { id: patient.id, patientCode });
  }

  // Add a visit row to an episode
  const visitMatch = /^episodes\/([^/]+)\/visits$/.exec(path);
  if (method === 'POST' && visitMatch) {
    const body = await readBody(req);
    const visitDate = typeof body.visitDate === 'string' && !Number.isNaN(Date.parse(body.visitDate)) ? new Date(body.visitDate) : null;
    if (!visitDate) return json(res, 400, { error: 'visitDate is required' });
    const episode = await prisma.episode.findUnique({ where: { id: visitMatch[1] } });
    if (!episode) return json(res, 404, { error: 'episode_not_found' });
    const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
    const int = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : null);

    const visit = await prisma.visit.create({
      data: {
        episodeId: episode.id,
        visitDate,
        weightKg: num(body.weightKg),
        bpSystolic: int(body.bpSystolic),
        bpDiastolic: int(body.bpDiastolic),
        ultrasoundNote: str(body.ultrasoundNote),
        complaints: str(body.complaints),
        management: str(body.management),
        nextVisit: str(body.nextVisit),
        nextVisitDate:
          typeof body.nextVisitDate === 'string' && !Number.isNaN(Date.parse(body.nextVisitDate))
            ? new Date(body.nextVisitDate)
            : null,
        location: str(body.location) ?? episode.location,
      },
    });
    await audit(user.id, 'create', 'visit', visit.id, `episode ${episode.id}`);
    return json(res, 201, { id: visit.id });
  }

  // Add a manual lab report with results; names/units/refs come from the
  // test dictionary and abnormal flags are computed — never guessed (D8/D9)
  const labMatch = /^episodes\/([^/]+)\/lab-reports$/.exec(path);
  if (method === 'POST' && labMatch) {
    const body = await readBody(req);
    const reportDate = typeof body.reportDate === 'string' && !Number.isNaN(Date.parse(body.reportDate)) ? new Date(body.reportDate) : null;
    const rawResults = Array.isArray(body.results) ? body.results : [];
    if (!reportDate || rawResults.length === 0) return json(res, 400, { error: 'reportDate and at least one result are required' });
    const episode = await prisma.episode.findUnique({ where: { id: labMatch[1] } });
    if (!episode) return json(res, 404, { error: 'episode_not_found' });

    const defs = await prisma.testDefinition.findMany();
    const byCode = new Map(defs.map((d) => [d.testCode, d]));
    const results = [];
    for (const r of rawResults as Array<Record<string, unknown>>) {
      const testCode = typeof r.testCode === 'string' ? r.testCode : null;
      const def = testCode ? byCode.get(testCode) : undefined;
      if (!def) return json(res, 400, { error: `unknown testCode: ${String(testCode)}` });
      const value = typeof r.value === 'number' && Number.isFinite(r.value) ? r.value : null;
      const text = typeof r.text === 'string' && r.text.trim() ? r.text.trim() : null;
      if (value == null && text == null) continue;
      results.push({
        testCode: def.testCode,
        testName: def.testName,
        resultValue: value,
        resultText: text,
        unit: def.defaultUnit,
        refLow: def.refLow,
        refHigh: def.refHigh,
        abnormalFlag: flagFor(value, def.refLow, def.refHigh),
        verificationStatus: 'manual',
      });
    }
    if (results.length === 0) return json(res, 400, { error: 'no usable results' });

    const report = await prisma.labReport.create({
      data: {
        patientId: episode.patientId,
        episodeId: episode.id,
        reportDate,
        laboratoryName: typeof body.laboratoryName === 'string' && body.laboratoryName.trim() ? body.laboratoryName.trim() : null,
        sourceType: 'manual',
        results: { create: results },
      },
    });
    await audit(user.id, 'create', 'lab_report', report.id, `${results.length} results`);
    return json(res, 201, { id: report.id, results: results.length });
  }

  // Add a diagnosis to an episode (G3/D21)
  const diagMatch = /^episodes\/([^/]+)\/diagnoses$/.exec(path);
  if (method === 'POST' && diagMatch) {
    const body = await readBody(req);
    const label = typeof body.label === 'string' ? body.label.trim() : '';
    if (!label) return json(res, 400, { error: 'label is required' });
    const episode = await prisma.episode.findUnique({ where: { id: diagMatch[1] } });
    if (!episode) return json(res, 404, { error: 'episode_not_found' });
    const diag = await prisma.diagnosis.create({ data: { episodeId: episode.id, label } });
    await audit(user.id, 'create', 'diagnosis', diag.id, label);
    return json(res, 201, { id: diag.id });
  }

  return json(res, 404, { error: 'not_found' });
}
