// "Pregnant patients with Hb < 11" research logic — from the export design
// in the ChatGPT discussion, adopted in plan §4. Key methodological rule:
// pregnancies with ≥1 qualifying result ≠ number of qualifying measurements.
// Always report both; prevalence denominators use pregnancies.

export const DEFAULT_HB_THRESHOLD_GDL = 11.0;

export interface HbMeasurement {
  pregnancyId: string;
  /** Hb already normalized to g/dL (see units.ts). */
  valueGDl: number;
}

/** Strictly below threshold — 11.0 itself does NOT qualify. */
export function qualifies(m: HbMeasurement, threshold = DEFAULT_HB_THRESHOLD_GDL): boolean {
  return m.valueGDl < threshold;
}

export interface HbSummary {
  qualifyingMeasurements: number;
  affectedPregnancies: number;
}

export function summarizeHb(measurements: HbMeasurement[], threshold = DEFAULT_HB_THRESHOLD_GDL): HbSummary {
  const qualifying = measurements.filter((m) => qualifies(m, threshold));
  return {
    qualifyingMeasurements: qualifying.length,
    affectedPregnancies: new Set(qualifying.map((m) => m.pregnancyId)).size,
  };
}
