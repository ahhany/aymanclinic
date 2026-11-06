import { describe, expect, it } from 'vitest';
import { normalizeHbToGdl } from './units';

describe('normalizeHbToGdl', () => {
  it('passes g/dL through unchanged', () => {
    expect(normalizeHbToGdl(10.4, 'g/dL')).toBe(10.4);
  });
  it('converts g/L to g/dL (÷10)', () => {
    expect(normalizeHbToGdl(105, 'g/L')).toBe(10.5);
  });
  it('is case-insensitive', () => {
    expect(normalizeHbToGdl(11.2, 'G/DL')).toBe(11.2);
  });
  it('returns null for unknown units — flag, never guess', () => {
    expect(normalizeHbToGdl(7.1, 'mmol/L')).toBeNull();
    expect(normalizeHbToGdl(10.4, null)).toBeNull();
    expect(normalizeHbToGdl(10.4, '')).toBeNull();
  });
});
