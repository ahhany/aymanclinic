// Clinic-wide sequential patient codes (D14): AYC-000125 etc.

const PREFIX = 'AYC';
const WIDTH = 6;

export function formatPatientCode(n: number): string {
  return `${PREFIX}-${String(n).padStart(WIDTH, '0')}`;
}

/** Next code given the codes already in use. Tolerates gaps and foreign formats. */
export function nextPatientCode(existing: string[]): string {
  let max = 0;
  for (const code of existing) {
    const m = new RegExp(`^${PREFIX}-(\\d+)$`).exec(code);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return formatPatientCode(max + 1);
}

/** Anonymous research id mirrors the sequence (D11/D14). */
export function anonymousIdFor(patientCode: string): string {
  return patientCode.replace(`${PREFIX}-`, 'ANON-');
}
