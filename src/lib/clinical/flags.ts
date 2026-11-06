// Abnormal-flag computation against a stored reference range (data dictionary:
// lab_results.abnormal_flag = low | normal | high | unknown). Never guess (D9):
// missing bounds or non-numeric results → 'unknown'.

export type AbnormalFlag = 'low' | 'normal' | 'high' | 'unknown';

export function flagFor(
  value: number | null | undefined,
  refLow: number | null | undefined,
  refHigh: number | null | undefined,
): AbnormalFlag {
  if (value == null || refLow == null || refHigh == null) return 'unknown';
  if (value < refLow) return 'low';
  if (value > refHigh) return 'high';
  return 'normal';
}
