import { describe, expect, it } from 'vitest';
import { resolvePreset, shiftRange } from './dateRange';

// Wednesday
const NOW = new Date('2026-10-28T12:00:00+01:00');

describe('resolvePreset', () => {
  it('gives next week Monday to Sunday', () => {
    expect(resolvePreset('nextWeek', NOW)).toEqual({ from: '2026-11-02', to: '2026-11-08' });
  });
});

describe('shiftRange', () => {
  it.each([
    ['a day by a day', { from: '2026-10-28', to: '2026-10-28' }, 1, { from: '2026-10-29', to: '2026-10-29' }],
    ['a week by a week', { from: '2026-10-26', to: '2026-11-01' }, 1, { from: '2026-11-02', to: '2026-11-08' }],
    ['a weekend to the next weekend', { from: '2026-10-31', to: '2026-11-01' }, 1, { from: '2026-11-07', to: '2026-11-08' }],
    ['a week back', { from: '2026-11-02', to: '2026-11-08' }, -1, { from: '2026-10-26', to: '2026-11-01' }],
    ['ten days by two weeks', { from: '2026-11-02', to: '2026-11-11' }, 1, { from: '2026-11-16', to: '2026-11-25' }],
  ] as const)('moves %s', (_, range, direction, shifted) => {
    expect(shiftRange(range, direction)).toEqual(shifted);
  });
});
