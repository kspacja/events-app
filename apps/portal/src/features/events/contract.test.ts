import { describe, expect, it } from 'vitest';
import {
  EVENTS_QUERY_ERRORS,
  eventsQuerySchema,
  eventsResponseSchema,
  MAX_DAYS_PER_REQUEST,
} from './contract';
import { addDays } from '@/features/time/localTime';

const FROM = '2030-03-01';

function errorOf(query: { from?: string; to?: string }) {
  const result = eventsQuerySchema.safeParse(query);
  return result.success ? null : result.error.issues[0].message;
}

describe('eventsQuerySchema', () => {
  it('accepts a single day and exactly the maximum range', () => {
    expect(eventsQuerySchema.safeParse({ from: FROM, to: FROM }).success).toBe(true);
    const to = addDays(FROM, MAX_DAYS_PER_REQUEST - 1);
    expect(eventsQuerySchema.safeParse({ from: FROM, to }).success).toBe(true);
  });

  it.each([
    ['too long', { from: FROM, to: addDays(FROM, MAX_DAYS_PER_REQUEST) }, EVENTS_QUERY_ERRORS.tooLong],
    ['bad format', { from: '01-03-2030', to: FROM }, EVENTS_QUERY_ERRORS.format],
    ['non-existent date', { from: '2026-02-30', to: '2026-03-01' }, EVENTS_QUERY_ERRORS.format],
    ['from after to', { from: '2030-03-02', to: FROM }, EVENTS_QUERY_ERRORS.order],
    ['missing', {}, EVENTS_QUERY_ERRORS.missing],
  ])('rejects %s with its own error', (_name, query, message) => {
    expect(errorOf(query)).toBe(message);
  });
});

describe('eventsResponseSchema', () => {
  const venue = { name: 'Klub', city: 'Warszawa', lat: 52.2, lng: 21 };
  const event = {
    id: '1',
    startsAt: '2030-03-01T19:00:00+01:00',
    title: 'Koncert',
    venue,
    category: 'music',
  };

  it('accepts a valid payload', () => {
    expect(eventsResponseSchema.safeParse({ events: [event] }).success).toBe(true);
  });

  it('rejects an unknown category', () => {
    const body = { events: [{ ...event, category: 'sports' }] };
    expect(eventsResponseSchema.safeParse(body).success).toBe(false);
  });

  it('rejects a missing venue', () => {
    const { id, startsAt, title, category } = event;
    const body = { events: [{ id, startsAt, title, category }] };
    expect(eventsResponseSchema.safeParse(body).success).toBe(false);
  });
});
