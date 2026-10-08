import { describe, expect, it } from 'vitest';
import { OccurrenceSourceError } from './source';

describe('OccurrenceSourceError', () => {
  it('carries the original failure as its cause', () => {
    const cause = new Error('boom');

    expect(new OccurrenceSourceError({ cause }).cause).toBe(cause);
  });
});
