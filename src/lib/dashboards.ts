// Pure aggregation/bucketing helpers shared by the dashboard API routes
// (server/dashboards.ts) and the dashboard UI. GA math follows the same UTC
// convention as src/lib/clinical/ga.ts; calendar bucketing (day/month keys)
// uses LOCAL date components because "today" means the clinic's day (Asia/Dubai).

const DAY_MS = 86_400_000;

function startOfUtcDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Start of the calendar day in local time. */
export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** `d` shifted by whole local days, at local midnight. */
export function addLocalDays(d: Date, days: number): Date {
  const out = startOfLocalDay(d);
  out.setDate(out.getDate() + days);
  return out;
}

/** Local calendar key 'YYYY-MM-DD'. */
export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Local calendar key 'YYYY-MM'. */
export function monthKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${m}`;
}

/** The `count` month keys ending at `from`'s month, oldest first. */
export function lastMonthKeys(count: number, from: Date): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    keys.push(monthKey(new Date(from.getFullYear(), from.getMonth() - i, 1)));
  }
  return keys;
}

/** Whole local days from `due` to `on` (positive when overdue). */
export function wholeDaysOverdue(due: Date, on: Date): number {
  return Math.floor((startOfLocalDay(on).getTime() - startOfLocalDay(due).getTime()) / DAY_MS);
}

// --- Gestational age (DB2) ---

export type GaBucketKey = 'lt13' | 'w13_27' | 'w28_36' | 'w37plus';

/**
 * Weeks of gestation at `on`, derived from the EDD (conception = EDD − 280 days,
 * so EDD itself is exactly 40 weeks). Null when `on` precedes conception.
 */
export function gaWeeksFromEdd(edd: Date, on: Date): number | null {
  const conception = startOfUtcDay(edd) - 280 * DAY_MS;
  const diffMs = startOfUtcDay(on) - conception;
  if (diffMs < 0) return null;
  return Math.floor(diffMs / DAY_MS / 7);
}

/** DB2 buckets: <13w, 13–27w, 28–36w, 37w+. */
export function gaBucket(weeks: number): GaBucketKey {
  if (weeks < 13) return 'lt13';
  if (weeks < 28) return 'w13_27';
  if (weeks < 37) return 'w28_36';
  return 'w37plus';
}

// --- Anemia bands (DB2, WHO classification for pregnancy, Hb in g/dL) ---

export type AnemiaBand = 'severe' | 'moderate' | 'mild' | 'normal';

/** WHO bands: <7 severe, 7–9.9 moderate, 10–10.9 mild, ≥11 normal. */
export function anemiaBand(hbGdl: number): AnemiaBand {
  if (hbGdl < 7) return 'severe';
  if (hbGdl < 10) return 'moderate';
  if (hbGdl < 11) return 'mild';
  return 'normal';
}
