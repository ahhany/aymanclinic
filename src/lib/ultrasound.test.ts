import { describe, expect, it } from 'vitest';
import { buildUltrasoundPayload, ULTRASOUND_FIELDS } from './ultrasound';

describe('buildUltrasoundPayload', () => {
  it('keeps only the fields of the milestone type', () => {
    const payload = buildUltrasoundPayload('first', { gs: true, ys: 'on', ntMm: 2.1, hacker: 'x' });
    expect(payload).toEqual({ gs: true, ys: true });
    expect(payload).not.toHaveProperty('ntMm');
    expect(payload).not.toHaveProperty('hacker');
  });

  it('coerces numeric strings to numbers', () => {
    expect(buildUltrasoundPayload('nt_scan', { ntMm: '1.8' })).toEqual({ ntMm: 1.8 });
  });

  it('drops empty values and non-finite numbers', () => {
    expect(buildUltrasoundPayload('gyn_first', { uterus: '', endometrialThicknessMm: 'abc' })).toEqual({});
  });

  it('every milestone type has at least one field', () => {
    for (const fields of Object.values(ULTRASOUND_FIELDS)) {
      expect(fields.length).toBeGreaterThan(0);
    }
  });
});
