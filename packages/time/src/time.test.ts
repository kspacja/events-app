import { describe, expect, it } from 'vitest';
import {
  eventDayOf,
  localDayOf,
  localMinutesOf,
  mondayOf,
  toInstantIso,
} from './time';

describe('eventDayOf', () => {
  it('puts 03:59 local time on the previous day', () => {
    expect(eventDayOf('2026-07-12T03:59:00+02:00')).toBe('2026-07-11');
  });

  it('keeps 04:00 local time on the same day', () => {
    expect(eventDayOf('2026-07-12T04:00:00+02:00')).toBe('2026-07-12');
  });

  it('keeps late evening events on their own day', () => {
    expect(eventDayOf('2026-07-11T23:30:00+02:00')).toBe('2026-07-11');
  });

  it('keeps the 04:00 boundary on the clock change in October', () => {
    expect(eventDayOf('2026-10-25T03:59:00+01:00')).toBe('2026-10-24');
    expect(eventDayOf('2026-10-25T04:00:00+01:00')).toBe('2026-10-25');
    expect(eventDayOf('2026-10-25T01:30:00+02:00')).toBe('2026-10-24');
  });
});

describe('toInstantIso', () => {
  it('uses the summer offset in July', () => {
    expect(toInstantIso('2026-07-12', 19 * 60)).toBe('2026-07-12T19:00:00+02:00');
  });

  it('uses the winter offset in January', () => {
    expect(toInstantIso('2026-01-12', 19 * 60)).toBe('2026-01-12T19:00:00+01:00');
  });

  it('switches from +02:00 to +01:00 on the October clock change', () => {
    expect(toInstantIso('2026-10-25', 90)).toBe('2026-10-25T01:30:00+02:00');
    expect(toInstantIso('2026-10-25', 240)).toBe('2026-10-25T04:00:00+01:00');
  });

  it('switches from +01:00 to +02:00 on the March clock change', () => {
    expect(toInstantIso('2026-03-29', 90)).toBe('2026-03-29T01:30:00+01:00');
    expect(toInstantIso('2026-03-29', 240)).toBe('2026-03-29T04:00:00+02:00');
  });

  it('round-trips through the local clock', () => {
    const iso = toInstantIso('2026-10-25', 240);
    expect(eventDayOf(iso)).toBe('2026-10-25');
    expect(localMinutesOf(iso)).toBe(240);
  });
});

describe('localDayOf', () => {
  it('moves to the next local day shortly before UTC midnight', () => {
    expect(localDayOf('2026-07-11T22:30:00Z')).toBe('2026-07-12');
    expect(localDayOf('2026-01-11T23:30:00Z')).toBe('2026-01-12');
  });

  it('stays on the same local day shortly after UTC midnight', () => {
    expect(localDayOf(new Date('2026-07-12T00:30:00Z'))).toBe('2026-07-12');
  });
});

describe('mondayOf', () => {
  it('returns the Monday of the same week for a Sunday', () => {
    expect(mondayOf('2026-10-04')).toBe('2026-09-28');
  });

  it('returns a Monday unchanged', () => {
    expect(mondayOf('2026-09-28')).toBe('2026-09-28');
  });
});
