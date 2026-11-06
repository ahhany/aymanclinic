// Unit normalization (decision D10): never assume a unit; unknown → null (flag for review).

/**
 * Normalize a hemoglobin result to g/dL.
 * Accepts g/dL and g/L (÷10). Returns null for unknown/missing units —
 * the caller must flag the result for review rather than guess.
 */
export function normalizeHbToGdl(value: number, unit: string | null | undefined): number | null {
  if (unit == null) return null;
  const u = unit.trim().toLowerCase();
  if (u === 'g/dl') return value;
  if (u === 'g/l') return Math.round((value / 10) * 100) / 100;
  return null;
}
