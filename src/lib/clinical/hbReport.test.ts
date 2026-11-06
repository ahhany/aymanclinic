import { describe, expect, it } from 'vitest';
import { qualifies, summarizeHb } from './hbReport';

describe('qualifies', () => {
  it('includes values strictly below 11.0', () => {
    expect(qualifies({ pregnancyId: 'p1', valueGDl: 10.4 })).toBe(true);
    expect(qualifies({ pregnancyId: 'p1', valueGDl: 10.99 })).toBe(true);
  });
  it('excludes 11.0 itself and above', () => {
    expect(qualifies({ pregnancyId: 'p1', valueGDl: 11.0 })).toBe(false);
    expect(qualifies({ pregnancyId: 'p1', valueGDl: 12.1 })).toBe(false);
  });
  it('honours a custom threshold', () => {
    expect(qualifies({ pregnancyId: 'p1', valueGDl: 9.9 }, 10.0)).toBe(true);
    expect(qualifies({ pregnancyId: 'p1', valueGDl: 10.0 }, 10.0)).toBe(false);
  });
});

describe('summarizeHb', () => {
  it('counts pregnancies and measurements separately (denominator rule)', () => {
    const summary = summarizeHb([
      { pregnancyId: 'p1', valueGDl: 10.4 },
      { pregnancyId: 'p1', valueGDl: 10.1 },
      { pregnancyId: 'p1', valueGDl: 9.8 },
      { pregnancyId: 'p2', valueGDl: 10.9 },
      { pregnancyId: 'p3', valueGDl: 12.5 },
    ]);
    expect(summary.qualifyingMeasurements).toBe(4);
    expect(summary.affectedPregnancies).toBe(2);
  });
  it('handles the empty dataset', () => {
    expect(summarizeHb([])).toEqual({ qualifyingMeasurements: 0, affectedPregnancies: 0 });
  });
});
