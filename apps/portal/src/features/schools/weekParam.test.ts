import { describe, expect, it } from 'vitest';
import { weekFromPath } from './weekParam';

describe('weekFromPath', () => {
  it('takes the Monday of the week named in the path', () => {
    expect(weekFromPath('2026-10-22', '2026-10-14')).toEqual({ week: '2026-10-19', valid: true });
  });

  it('gives the current week for a date that does not exist', () => {
    expect(weekFromPath('2026-02-31', '2026-10-14')).toEqual({ week: '2026-10-12', valid: false });
  });

  it('gives the current week for a word', () => {
    expect(weekFromPath('jutro', '2026-10-14')).toEqual({ week: '2026-10-12', valid: false });
  });
});
