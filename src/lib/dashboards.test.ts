import { describe, expect, it } from 'vitest';
import {
  addLocalDays,
  anemiaBand,
  dayKey,
  gaBucket,
  gaWeeksFromEdd,
  lastMonthKeys,
  monthKey,
  wholeDaysOverdue,
} from './dashboards';

describe('gaWeeksFromEdd', () => {
  it('returns exactly 40 weeks at the EDD itself', () => {
    const edd = new Date(Date.UTC(2026, 11, 20));
    expect(gaWeeksFromEdd(edd, edd)).toBe(40);
  });

  it('counts weeks from conception (EDD − 280 days)', () => {
    const edd = new Date(Date.UTC(2026, 11, 20));
    const conception = new Date(Date.UTC(2026, 2, 15)); // 2026-03-15 = EDD − 280d
    expect(gaWeeksFromEdd(edd, conception)).toBe(0);
    const tenWeeks = new Date(Date.UTC(2026, 4, 24)); // conception + 70d
    expect(gaWeeksFromEdd(edd, tenWeeks)).toBe(10);
  });

  it('returns null before conception', () => {
    const edd = new Date(Date.UTC(2026, 5, 1));
    expect(gaWeeksFromEdd(edd, new Date(Date.UTC(2025, 0, 1)))).toBeNull();
  });
});

describe('gaBucket', () => {
  it('buckets by DB2 boundaries (<13, 13–27, 28–36, 37+)', () => {
    expect(gaBucket(0)).toBe('lt13');
    expect(gaBucket(12)).toBe('lt13');
    expect(gaBucket(13)).toBe('w13_27');
    expect(gaBucket(27)).toBe('w13_27');
    expect(gaBucket(28)).toBe('w28_36');
    expect(gaBucket(36)).toBe('w28_36');
    expect(gaBucket(37)).toBe('w37plus');
    expect(gaBucket(41)).toBe('w37plus');
  });
});

describe('anemiaBand', () => {
  it('follows WHO pregnancy bands', () => {
    expect(anemiaBand(6.9)).toBe('severe');
    expect(anemiaBand(7)).toBe('moderate');
    expect(anemiaBand(9.9)).toBe('moderate');
    expect(anemiaBand(10)).toBe('mild');
    expect(anemiaBand(10.9)).toBe('mild');
    expect(anemiaBand(11)).toBe('normal');
    expect(anemiaBand(14)).toBe('normal');
  });
});

describe('calendar keys', () => {
  it('formats local day and month keys with zero padding', () => {
    const d = new Date(2026, 0, 5, 15, 30); // 05 Jan 2026, local
    expect(dayKey(d)).toBe('2026-01-05');
    expect(monthKey(d)).toBe('2026-01');
  });

  it('lastMonthKeys ends at the given month and crosses year boundaries', () => {
    expect(lastMonthKeys(6, new Date(2026, 10, 6))).toEqual([
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
    expect(lastMonthKeys(3, new Date(2026, 0, 15))).toEqual(['2025-11', '2025-12', '2026-01']);
  });

  it('addLocalDays shifts whole days from local midnight', () => {
    const d = new Date(2026, 10, 6, 18, 45);
    expect(dayKey(addLocalDays(d, 1))).toBe('2026-11-07');
    expect(dayKey(addLocalDays(d, -6))).toBe('2026-10-31');
  });
});

describe('wholeDaysOverdue', () => {
  it('counts whole local days between dates, ignoring time of day', () => {
    const due = new Date(2026, 10, 1, 23, 0);
    const on = new Date(2026, 10, 6, 1, 0);
    expect(wholeDaysOverdue(due, on)).toBe(5);
  });

  it('is zero on the due day and negative before it', () => {
    const due = new Date(2026, 10, 6, 9, 0);
    expect(wholeDaysOverdue(due, new Date(2026, 10, 6, 20, 0))).toBe(0);
    expect(wholeDaysOverdue(due, new Date(2026, 10, 5, 20, 0))).toBe(-1);
  });
});
