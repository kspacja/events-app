import { occurrenceIdSchema } from '@events/contract/listing';
import { describe, expect, it } from 'vitest';
import { dayDomId, occurrenceDomId } from './scheduleDom';

describe('DOM id builders', () => {
  it('never collide between a day and an occurrence', () => {
    const occurrenceId = occurrenceIdSchema.parse('2026-06-01');
    expect(dayDomId('2026-06-01')).not.toBe(occurrenceDomId(occurrenceId));
  });
});
