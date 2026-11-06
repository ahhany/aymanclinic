import { describe, expect, it } from 'vitest';
import { groupByIngredient } from './medications';

describe('groupByIngredient', () => {
  it('groups brands under their active ingredient, sorted', () => {
    const groups = groupByIngredient([
      { brandName: 'Ferose F', activeIngredient: 'Iron + folic acid' },
      { brandName: 'Feroglobin', activeIngredient: 'Iron + folic acid + B12' },
      { brandName: 'Ferrotron', activeIngredient: 'Iron + folic acid' },
      { brandName: 'Cetal', activeIngredient: 'Paracetamol' },
    ]);
    expect(groups.map(([ing]) => ing)).toEqual(['Iron + folic acid', 'Iron + folic acid + B12', 'Paracetamol']);
    expect(groups[0][1].map((m) => m.brandName)).toEqual(['Ferose F', 'Ferrotron']);
  });

  it('handles an empty catalogue', () => {
    expect(groupByIngredient([])).toEqual([]);
  });
});
