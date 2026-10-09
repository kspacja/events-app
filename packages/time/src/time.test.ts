import { describe, expect, it } from 'vitest';
import {
  eventDayBounds,
  eventDayOf,
  isCalendarDay,
  localDayOf,
  localMinutesOf,
  mondayOf,
  isDayInRange,
  isWarsawIso,
  warsawIsoAt,
  toWarsawIso,
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

describe('eventDayBounds', () => {
  it('runs from 04:00 on the first day to 04:00 after the last, Warsaw time', () => {
    expect(eventDayBounds({ from: '2030-01-05', to: '2030-01-06' })).toEqual({
      start: new Date('2030-01-05T03:00:00Z'),
      end: new Date('2030-01-07T03:00:00Z'),
    });
  });

  it('uses the offset of each end on DST change days', () => {
    expect(eventDayBounds({ from: '2030-03-30', to: '2030-03-30' })).toEqual({
      start: new Date('2030-03-30T03:00:00Z'),
      end: new Date('2030-03-31T02:00:00Z'),
    });
  });

  it('agrees with eventDayOf at both ends', () => {
    const { start, end } = eventDayBounds({ from: '2030-10-26', to: '2030-10-26' });

    expect(eventDayOf(start.toISOString())).toBe('2030-10-26');
    expect(eventDayOf(new Date(end.getTime() - 1000).toISOString())).toBe('2030-10-26');
    expect(eventDayOf(end.toISOString())).toBe('2030-10-27');
  });
});

describe('warsawIsoAt', () => {
  it('uses the summer offset in July', () => {
    expect(warsawIsoAt('2026-07-12', 19 * 60)).toBe('2026-07-12T19:00:00+02:00');
  });

  it('uses the winter offset in January', () => {
    expect(warsawIsoAt('2026-01-12', 19 * 60)).toBe('2026-01-12T19:00:00+01:00');
  });

  it('switches from +02:00 to +01:00 on the October clock change', () => {
    expect(warsawIsoAt('2026-10-25', 90)).toBe('2026-10-25T01:30:00+02:00');
    expect(warsawIsoAt('2026-10-25', 240)).toBe('2026-10-25T04:00:00+01:00');
  });

  it('switches from +01:00 to +02:00 on the March clock change', () => {
    expect(warsawIsoAt('2026-03-29', 90)).toBe('2026-03-29T01:30:00+01:00');
    expect(warsawIsoAt('2026-03-29', 240)).toBe('2026-03-29T04:00:00+02:00');
  });

  it('round-trips through the local clock', () => {
    const iso = warsawIsoAt('2026-10-25', 240);
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

describe('isCalendarDay', () => {
  it('accepts real dates, including a leap day', () => {
    expect(isCalendarDay('2026-07-12')).toBe(true);
    expect(isCalendarDay('2028-02-29')).toBe(true);
  });

  it('rejects dates that do not exist', () => {
    expect(isCalendarDay('2026-02-30')).toBe(false);
    expect(isCalendarDay('2026-13-01')).toBe(false);
    expect(isCalendarDay('2027-02-29')).toBe(false);
  });

  it('rejects malformed strings', () => {
    expect(isCalendarDay('2026-7-12')).toBe(false);
    expect(isCalendarDay('12.07.2026')).toBe(false);
  });
});

describe('toWarsawIso', () => {
  it('renders a UTC instant with the summer offset', () => {
    expect(toWarsawIso(new Date('2026-07-12T17:00:00Z'))).toBe('2026-07-12T19:00:00+02:00');
  });

  it('renders a UTC instant with the winter offset', () => {
    expect(toWarsawIso(new Date('2026-01-12T18:00:00Z'))).toBe('2026-01-12T19:00:00+01:00');
  });

  it('normalizes an ISO string in another offset', () => {
    expect(toWarsawIso('2026-07-12T17:00:00Z')).toBe('2026-07-12T19:00:00+02:00');
  });
});

describe('isWarsawIso', () => {
  it.each(['2026-07-12T19:00:00+02:00', '2026-01-12T19:00:00+01:00'])('accepts %s', (value) => {
    expect(isWarsawIso(value)).toBe(true);
  });

  it.each([
    '2026-07-12T17:00:00Z',
    '2026-07-12T19:00:00+01:00',
    '2026-07-12T19:00:00.500+02:00',
    'not a date',
  ])('rejects %s', (value) => {
    expect(isWarsawIso(value)).toBe(false);
  });
});

describe('isDayInRange', () => {
  const range = { from: '2026-06-01', to: '2026-06-07' } as const;

  it('includes both ends', () => {
    expect(isDayInRange('2026-06-01', range)).toBe(true);
    expect(isDayInRange('2026-06-07', range)).toBe(true);
  });

  it('excludes days outside', () => {
    expect(isDayInRange('2026-05-31', range)).toBe(false);
    expect(isDayInRange('2026-06-08', range)).toBe(false);
  });
});
