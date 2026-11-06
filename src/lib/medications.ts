// Medication catalogue helpers (D8-adjacent): brand ↔ active ingredient grouping,
// the basis of Dr. Ayman's personal library and DB4 analytics.

export interface MedicationLike {
  brandName: string;
  activeIngredient: string;
}

/**
 * Group medications by active ingredient, sorted alphabetically by ingredient
 * then brand. Powers the library view and the grouped prescriber picker.
 */
export function groupByIngredient<T extends MedicationLike>(meds: T[]): Array<[string, T[]]> {
  const groups = new Map<string, T[]>();
  for (const med of meds) {
    const key = med.activeIngredient.trim() || '—';
    const list = groups.get(key) ?? [];
    list.push(med);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ingredient, list]): [string, T[]] => [
      ingredient,
      [...list].sort((a, b) => a.brandName.localeCompare(b.brandName)),
    ]);
}
