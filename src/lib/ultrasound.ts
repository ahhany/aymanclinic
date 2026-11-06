// Ultrasound milestone field definitions — single source for the dynamic form
// (UI) and payload validation (server). Field inventory per knowledge/data-dictionary.md.

export type UltrasoundType = 'first' | 'nt_scan' | 'anatomy_scan' | 'followup' | 'gyn_first';

export interface UltrasoundField {
  key: string;
  label: string;
  kind: 'text' | 'number' | 'date' | 'bool';
}

export const ULTRASOUND_TYPE_LABELS: Record<UltrasoundType, string> = {
  first: '1st U/S',
  nt_scan: '11–13 wks scan',
  anatomy_scan: '20 wks scan',
  followup: 'Follow-up scan',
  gyn_first: 'GYN 1st U/S',
};

export const ULTRASOUND_FIELDS: Record<UltrasoundType, UltrasoundField[]> = {
  first: [
    { key: 'gs', label: 'GS', kind: 'bool' },
    { key: 'ys', label: 'YS', kind: 'bool' },
    { key: 'fhp', label: 'FHP', kind: 'bool' },
    { key: 'edd', label: 'EDD', kind: 'date' },
  ],
  nt_scan: [
    { key: 'fetus', label: 'Fetus', kind: 'text' },
    { key: 'placenta', label: 'Placenta', kind: 'text' },
    { key: 'nasalBone', label: 'Nasal B', kind: 'text' },
    { key: 'ductus', label: 'Ductus', kind: 'text' },
    { key: 'ntMm', label: 'NT (mm)', kind: 'number' },
    { key: 'sex', label: 'Sex', kind: 'text' },
    { key: 'edd', label: 'EDD', kind: 'date' },
  ],
  anatomy_scan: [
    { key: 'anatomy', label: 'Anatomy', kind: 'text' },
    { key: 'placenta', label: 'Placenta', kind: 'text' },
    { key: 'uterineArteryDoppler', label: 'Doppler UT.A', kind: 'text' },
    { key: 'sex', label: 'Sex', kind: 'text' },
    { key: 'liquor', label: 'LIQ', kind: 'text' },
    { key: 'cervix', label: 'CX', kind: 'text' },
    { key: 'edd', label: 'EDD', kind: 'date' },
  ],
  followup: [
    { key: 'biometry', label: 'Biometry', kind: 'text' },
    { key: 'fetalWeightG', label: 'Fetal weight (g)', kind: 'number' },
    { key: 'placenta', label: 'Placenta', kind: 'text' },
    { key: 'liquor', label: 'Liq', kind: 'text' },
    { key: 'remarks', label: 'Remarks', kind: 'text' },
  ],
  gyn_first: [
    { key: 'uterus', label: 'Uterus', kind: 'text' },
    { key: 'endometrialThicknessMm', label: 'End. thickness (mm)', kind: 'number' },
    { key: 'rightOvary', label: 'Rt ovary', kind: 'text' },
    { key: 'leftOvary', label: 'Lt ovary', kind: 'text' },
    { key: 'others', label: 'Others', kind: 'text' },
  ],
};

/** Milestone types relevant per module. */
export const ULTRASOUND_TYPES_BY_MODULE: Record<string, UltrasoundType[]> = {
  OBS: ['first', 'nt_scan', 'anatomy_scan', 'followup'],
  GYN: ['gyn_first', 'followup'],
};

/**
 * Keep only the known keys for the milestone type, coercing numbers/bools.
 * Unknown keys are dropped — the payload can never outgrow the dictionary (D8).
 */
export function buildUltrasoundPayload(
  type: UltrasoundType,
  values: Record<string, unknown>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of ULTRASOUND_FIELDS[type]) {
    const raw = values[field.key];
    if (raw == null || raw === '') continue;
    if (field.kind === 'number') {
      const n = Number(raw);
      if (Number.isFinite(n)) payload[field.key] = n;
    } else if (field.kind === 'bool') {
      payload[field.key] = raw === true || raw === 'true' || raw === 'on';
    } else {
      payload[field.key] = String(raw);
    }
  }
  return payload;
}
