import { describe, expect, it } from 'vitest';
import { anonymousIdFor, formatPatientCode, nextPatientCode } from './sequence';

describe('formatPatientCode', () => {
  it('pads to six digits', () => {
    expect(formatPatientCode(1)).toBe('AYC-000001');
    expect(formatPatientCode(125)).toBe('AYC-000125');
  });
});

describe('nextPatientCode', () => {
  it('starts at 1 with no patients', () => {
    expect(nextPatientCode([])).toBe('AYC-000001');
  });
  it('increments the maximum', () => {
    expect(nextPatientCode(['AYC-000001', 'AYC-000009', 'AYC-000003'])).toBe('AYC-000010');
  });
  it('tolerates gaps and foreign codes', () => {
    expect(nextPatientCode(['AYC-000002', 'OBS-000125', 'junk'])).toBe('AYC-000003');
  });
});

describe('anonymousIdFor', () => {
  it('mirrors the sequence with the ANON prefix', () => {
    expect(anonymousIdFor('AYC-000125')).toBe('ANON-000125');
  });
});
