// Dashboard aggregate routes — DB1 (clinic operations), DB2 (clinical picture),
// DB4 (prescribing & practice analytics, promoted to Phase 2 per D22).
// All endpoints are read-only, so no audit entries are written.
// Response shapes mirror the DTOs in src/components/dashboards/types.ts —
// the same agent owns both ends.

import type { RouteCtx } from './ctx';
import {
  addLocalDays,
  anemiaBand,
  dayKey,
  gaBucket,
  gaWeeksFromEdd,
  lastMonthKeys,
  monthKey,
  startOfLocalDay,
  wholeDaysOverdue,
  type GaBucketKey,
} from '../src/lib/dashboards';

const APPOINTMENT_STATUSES = ['scheduled', 'arrived', 'seen', 'no_show', 'cancelled'] as const;

export async function handleDashboardRoutes(ctx: RouteCtx): Promise<boolean> {
  if (ctx.method !== 'GET') return false;
  if (ctx.path === 'dashboards/admin') {
    await adminDashboard(ctx);
    return true;
  }
  if (ctx.path === 'dashboards/clinical') {
    await clinicalDashboard(ctx);
    return true;
  }
  if (ctx.path === 'dashboards/prescribing') {
    await prescribingDashboard(ctx);
    return true;
  }
  return false;
}

/** First day of the 6-month reporting window and its month keys (oldest first). */
function sixMonthWindow(now: Date): { start: Date; months: string[] } {
  return { start: new Date(now.getFullYear(), now.getMonth() - 5, 1), months: lastMonthKeys(6, now) };
}

function countBy<T>(items: T[], keyOf: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyOf(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

// --- DB1 — Clinic Operations ---

async function adminDashboard(ctx: RouteCtx): Promise<void> {
  const { prisma, json, res } = ctx;
  const now = new Date();
  const todayStart = startOfLocalDay(now);
  const tomorrowStart = addLocalDays(now, 1);
  const weekStart = addLocalDays(now, -((now.getDay() + 6) % 7)); // Monday
  const weekEnd = addLocalDays(weekStart, 7);
  const { start: sixMonthsAgo, months } = sixMonthWindow(now);

  const [todayAppointments, weekAppointments, recentPatients, allAppointments, openEpisodes] = await Promise.all([
    prisma.appointment.findMany({
      where: { scheduledAt: { gte: todayStart, lt: tomorrowStart } },
      select: { status: true },
    }),
    prisma.appointment.findMany({
      where: { scheduledAt: { gte: weekStart, lt: weekEnd } },
      select: { scheduledAt: true },
    }),
    prisma.patient.findMany({ where: { createdAt: { gte: sixMonthsAgo } }, select: { createdAt: true } }),
    prisma.appointment.findMany({ select: { location: true } }),
    prisma.episode.findMany({
      where: { status: 'open' },
      include: {
        patient: { include: { identity: true } },
        visits: { orderBy: { visitDate: 'desc' }, take: 1 },
      },
    }),
  ]);

  const byStatus: Record<string, number> = {};
  for (const s of APPOINTMENT_STATUSES) byStatus[s] = 0;
  for (const a of todayAppointments) byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;

  const weekCounts = countBy(weekAppointments, (a) => dayKey(a.scheduledAt));
  const week = Array.from({ length: 7 }, (_, i) => {
    const key = dayKey(addLocalDays(weekStart, i));
    return { date: key, count: weekCounts.get(key) ?? 0 };
  });

  const patientCounts = countBy(recentPatients, (p) => monthKey(p.createdAt));
  const newPatientsPerMonth = months.map((m) => ({ month: m, count: patientCounts.get(m) ?? 0 }));

  // Overdue follow-ups (G2/D21): open episodes whose latest visit's promised
  // next-visit date has passed.
  const overdueRows = openEpisodes
    .map((e) => {
      const latest = e.visits[0];
      if (!latest?.nextVisitDate) return null;
      const daysOverdue = wholeDaysOverdue(latest.nextVisitDate, now);
      if (daysOverdue <= 0) return null;
      return {
        patientId: e.patient.id,
        patientCode: e.patient.patientCode,
        fullName: e.patient.identity?.fullName ?? '—',
        nextVisitDate: latest.nextVisitDate.toISOString(),
        daysOverdue,
        episodeType: e.type,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  const locationCounts = new Map<string | null, number>();
  for (const a of allAppointments) locationCounts.set(a.location, (locationCounts.get(a.location) ?? 0) + 1);
  const appointmentsPerLocation = [...locationCounts.entries()]
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count);

  json(res, 200, {
    today: { date: dayKey(now), total: todayAppointments.length, byStatus },
    week,
    newPatientsPerMonth,
    overdueFollowUps: { count: overdueRows.length, rows: overdueRows.slice(0, 10) },
    appointmentsPerLocation,
  });
}

// --- DB2 — Clinical picture (high-risk pregnancy board) ---

async function clinicalDashboard(ctx: RouteCtx): Promise<void> {
  const { prisma, json, res } = ctx;
  const now = new Date();

  const [openObs, openEpisodes, diagnosesGrouped, closedObs] = await Promise.all([
    prisma.episode.findMany({
      where: { type: 'OBS', status: 'open' },
      include: { pregnancy: true },
    }),
    prisma.episode.findMany({
      where: { status: 'open' },
      include: {
        patient: { include: { identity: true } },
        visits: { orderBy: { visitDate: 'desc' }, take: 1 },
      },
    }),
    prisma.diagnosis.groupBy({
      by: ['label'],
      _count: { label: true },
      orderBy: { _count: { label: 'desc' } },
      take: 10,
    }),
    prisma.episode.findMany({
      where: { type: 'OBS', status: 'closed' },
      include: { pregnancy: true },
    }),
  ]);

  // Active pregnancies by gestational age (conception = EDD − 280d).
  const bucketCounts: Record<GaBucketKey, number> = { lt13: 0, w13_27: 0, w28_36: 0, w37plus: 0 };
  let unknown = 0;
  for (const e of openObs) {
    const edd = e.pregnancy?.eddDate ?? null;
    const weeks = edd ? gaWeeksFromEdd(edd, now) : null;
    if (weeks === null) unknown += 1;
    else bucketCounts[gaBucket(weeks)] += 1;
  }

  // Anemia snapshot: latest Hb (CBC_HB) per open-OBS patient, WHO bands (D10: g/dL).
  const obsPatientIds = [...new Set(openObs.map((e) => e.patientId))];
  const hbResults = obsPatientIds.length
    ? await prisma.labResult.findMany({
        where: {
          testCode: 'CBC_HB',
          resultValue: { not: null },
          labReport: { patientId: { in: obsPatientIds } },
        },
        include: { labReport: { select: { patientId: true, reportDate: true } } },
      })
    : [];
  const sortedHb = [...hbResults].sort((a, b) => b.labReport.reportDate.getTime() - a.labReport.reportDate.getTime());
  const latestHb = new Map<string, number>();
  for (const r of sortedHb) {
    if (!latestHb.has(r.labReport.patientId) && r.resultValue !== null) {
      latestHb.set(r.labReport.patientId, r.resultValue);
    }
  }
  const anemia = { severe: 0, moderate: 0, mild: 0, normal: 0 };
  for (const hb of latestHb.values()) anemia[anemiaBand(hb)] += 1;

  // BP watch: patients (deduplicated) whose latest visit on an open episode is ≥140/90.
  const bpByPatient = new Map<
    string,
    { patientId: string; patientCode: string; fullName: string; bpSystolic: number | null; bpDiastolic: number | null; visitDate: Date }
  >();
  for (const e of openEpisodes) {
    const v = e.visits[0];
    if (!v) continue;
    const flagged = (v.bpSystolic !== null && v.bpSystolic >= 140) || (v.bpDiastolic !== null && v.bpDiastolic >= 90);
    if (!flagged) continue;
    const existing = bpByPatient.get(e.patientId);
    if (existing && existing.visitDate >= v.visitDate) continue;
    bpByPatient.set(e.patientId, {
      patientId: e.patient.id,
      patientCode: e.patient.patientCode,
      fullName: e.patient.identity?.fullName ?? '—',
      bpSystolic: v.bpSystolic,
      bpDiastolic: v.bpDiastolic,
      visitDate: v.visitDate,
    });
  }
  const bpRows = [...bpByPatient.values()]
    .sort((a, b) => (b.bpSystolic ?? 0) - (a.bpSystolic ?? 0))
    .map((r) => ({ ...r, visitDate: r.visitDate.toISOString() }));

  // Delivery mode split from closed OBS episodes.
  const modeCounts = new Map<string, number>();
  for (const e of closedObs) {
    const raw = e.pregnancy?.deliveryMode?.trim().toLowerCase();
    if (!raw) continue;
    const mode = raw === 'cs' ? 'CS' : raw === 'vaginal' ? 'vaginal' : 'other';
    modeCounts.set(mode, (modeCounts.get(mode) ?? 0) + 1);
  }
  const deliveryModes = ['vaginal', 'CS', 'other']
    .filter((m) => modeCounts.has(m))
    .map((m) => ({ mode: m, count: modeCounts.get(m) ?? 0 }));

  json(res, 200, {
    pregnancies: {
      total: openObs.length,
      unknown,
      buckets: (Object.keys(bucketCounts) as GaBucketKey[]).map((key) => ({ key, count: bucketCounts[key] })),
    },
    anemia: { ...anemia, tested: latestHb.size, totalPatients: obsPatientIds.length },
    bpFlags: { count: bpRows.length, rows: bpRows.slice(0, 10) },
    topDiagnoses: diagnosesGrouped.map((d) => ({ label: d.label, count: d._count.label })),
    deliveryModes,
  });
}

// --- DB4 — Prescribing & practice analytics (D22) ---

async function prescribingDashboard(ctx: RouteCtx): Promise<void> {
  const { prisma, json, res } = ctx;
  const now = new Date();
  const { start: sixMonthsAgo, months } = sixMonthWindow(now);

  const [meds, recentRx, totalPrescriptions, indicationGroups] = await Promise.all([
    prisma.medication.findMany({ include: { _count: { select: { prescriptions: true } } } }),
    prisma.prescription.findMany({
      where: { prescriptionDate: { gte: sixMonthsAgo } },
      select: { prescriptionDate: true },
    }),
    prisma.prescription.count(),
    prisma.prescription.groupBy({
      by: ['indication'],
      where: { indication: { not: null } },
      _count: { indication: true },
      orderBy: { _count: { indication: 'desc' } },
      take: 10,
    }),
  ]);

  const topMedications = [...meds]
    .sort((a, b) => b._count.prescriptions - a._count.prescriptions)
    .slice(0, 15)
    .map((m) => ({
      medicationId: m.id,
      brandName: m.brandName,
      activeIngredient: m.activeIngredient,
      count: m._count.prescriptions,
    }));

  const monthCounts = countBy(recentRx, (r) => monthKey(r.prescriptionDate));
  const prescriptionsPerMonth = months.map((m) => ({ month: m, count: monthCounts.get(m) ?? 0 }));

  const everPrescribed = meds.filter((m) => m._count.prescriptions > 0).length;

  json(res, 200, {
    topMedications,
    prescriptionsPerMonth,
    // Exact-match grouping for v1; blank indications dropped.
    topIndications: indicationGroups
      .filter((g) => g.indication !== null && g.indication.trim() !== '')
      .map((g) => ({ text: g.indication ?? '', count: g._count.indication })),
    library: {
      total: meds.length,
      everPrescribed,
      percentPrescribed: meds.length ? Math.round((everPrescribed / meds.length) * 1000) / 10 : 0,
    },
    totalPrescriptions,
  });
}
