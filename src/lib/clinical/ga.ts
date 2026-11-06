// Gestational age & trimester — reporting conventions from the ChatGPT discussion
// (adopted in the plan §4): GA is computed AT THE SAMPLE/VISIT DATE from LMP,
// never at data-entry date. Trimesters: first < 14+0, second 14+0..27+6, third ≥ 28+0.

const DAY_MS = 86_400_000;

export interface GestationalAge {
  weeks: number;
  days: number;
  totalDays: number;
}

function startOfUtcDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Weeks+days of gestation at `on`, or null if `on` precedes the LMP. */
export function gestationalAgeAt(lmp: Date, on: Date): GestationalAge | null {
  const diffMs = startOfUtcDay(on) - startOfUtcDay(lmp);
  if (diffMs < 0) return null;
  const totalDays = Math.floor(diffMs / DAY_MS);
  return { weeks: Math.floor(totalDays / 7), days: totalDays % 7, totalDays };
}

export type Trimester = 'first' | 'second' | 'third';

export function trimesterOf(ga: GestationalAge): Trimester {
  if (ga.totalDays < 14 * 7) return 'first';
  if (ga.totalDays < 28 * 7) return 'second';
  return 'third';
}

/** Expected date of delivery: LMP + 280 days. */
export function eddFromLmp(lmp: Date): Date {
  return new Date(startOfUtcDay(lmp) + 280 * DAY_MS);
}
