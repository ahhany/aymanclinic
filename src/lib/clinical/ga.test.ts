import { describe, expect, it } from 'vitest';
import { eddFromLmp, gestationalAgeAt, trimesterOf } from './ga';

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe('gestationalAgeAt', () => {
  it('computes weeks and days from LMP at the given date', () => {
    const ga = gestationalAgeAt(d('2026-01-01'), d('2026-03-25')); // 83 days
    expect(ga).toEqual({ weeks: 11, days: 6, totalDays: 83 });
  });

  it('returns 0+0 on the LMP day itself', () => {
    expect(gestationalAgeAt(d('2026-01-01'), d('2026-01-01'))).toEqual({ weeks: 0, days: 0, totalDays: 0 });
  });

  it('returns null when the date precedes the LMP', () => {
    expect(gestationalAgeAt(d('2026-02-01'), d('2026-01-01'))).toBeNull();
  });
});

describe('trimesterOf', () => {
  it('first trimester ends before 14+0', () => {
    expect(trimesterOf(gestationalAgeAt(d('2026-01-01'), d('2026-04-01'))!)).toBe('first'); // 90d
    expect(trimesterOf({ weeks: 13, days: 6, totalDays: 97 })).toBe('first');
  });
  it('second trimester is 14+0 to 27+6', () => {
    expect(trimesterOf({ weeks: 14, days: 0, totalDays: 98 })).toBe('second');
    expect(trimesterOf({ weeks: 27, days: 6, totalDays: 195 })).toBe('second');
  });
  it('third trimester starts at 28+0', () => {
    expect(trimesterOf({ weeks: 28, days: 0, totalDays: 196 })).toBe('third');
  });
});

describe('eddFromLmp', () => {
  it('is LMP + 280 days', () => {
    expect(eddFromLmp(d('2026-01-01')).toISOString().slice(0, 10)).toBe('2026-10-08');
  });
});
