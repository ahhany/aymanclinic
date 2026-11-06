// Dev API handlers — mounted by server/api.ts inside the Vite dev server.
// This is the seam where Supabase takes over in production (D6/D20):
// the React app only talks to these endpoints via src/db/apiClient.ts.

import type { IncomingMessage, ServerResponse } from 'node:http';
import { PrismaClient } from '@prisma/client';
import { verifyPassword } from './passwords';

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
          },
        },
        labReports: { include: { results: true }, orderBy: { reportDate: 'asc' } },
      },
    });
    if (!patient) return json(res, 404, { error: 'not_found' });
    return json(res, 200, patient);
  }

  if (method === 'GET' && path === 'test-definitions') {
    const defs = await prisma.testDefinition.findMany({ orderBy: [{ panel: 'asc' }, { sortOrder: 'asc' }] });
    return json(res, 200, defs);
  }

  return json(res, 404, { error: 'not_found' });
}
