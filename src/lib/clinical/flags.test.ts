import { describe, expect, it } from 'vitest';
import { flagFor } from './flags';

describe('flagFor', () => {
  it('flags below range as low', () => {
    expect(flagFor(10.4, 12, 15.5)).toBe('low');
  });
  it('flags above range as high', () => {
    expect(flagFor(16.1, 12, 15.5)).toBe('high');
  });
  it('flags in-range as normal, bounds inclusive', () => {
    expect(flagFor(12, 12, 15.5)).toBe('normal');
    expect(flagFor(15.5, 12, 15.5)).toBe('normal');
  });
  it('never guesses when data is missing', () => {
    expect(flagFor(null, 12, 15.5)).toBe('unknown');
    expect(flagFor(11, null, 15.5)).toBe('unknown');
    expect(flagFor(11, 12, null)).toBe('unknown');
  });
});
