import { describe, expect, it } from 'vitest';
import {
  INVALID_RANGE_NOTICE,
  INVALID_SEARCH_NOTICE,
  INVALID_TIME_NOTICE,
} from './labels';
import { hrefFor, parseSearchQuery } from './searchQuery';
import { TIME_PRESET_WINDOWS } from './timeRange';

const FRIDAY = new Date('2026-10-02T10:00:00Z');
const at = (hours: number, minutes = 0) => hours * 60 + minutes;
const WEEK = { from: '2026-09-28', to: '2026-10-04' };
const ALL_TIMES = { source: 'all', window: null, error: null };

describe('parseSearchQuery: date', () => {
  it('defaults to the current week and all times without params', () => {
    expect(parseSearchQuery({}, FRIDAY)).toEqual({
      date: { source: 'preset', preset: 'week', range: WEEK, error: null },
      time: ALL_TIMES,
      notice: null,
    });
  });

  it.each([
    ['today', { from: '2026-10-02', to: '2026-10-02' }],
    ['tomorrow', { from: '2026-10-03', to: '2026-10-03' }],
    ['week', WEEK],
    ['weekend', { from: '2026-10-03', to: '2026-10-04' }],
  ] as const)('parses the %s preset', (preset, range) => {
    expect(parseSearchQuery({ when: preset }, FRIDAY).date).toEqual({
      source: 'preset',
      preset,
      range,
      error: null,
    });
  });

  it('parses a custom range', () => {
    const { date, notice } = parseSearchQuery(
      { from: '2026-11-01', to: '2026-11-05' },
      FRIDAY,
    );
    expect(date).toEqual({
      source: 'custom',
      range: { from: '2026-11-01', to: '2026-11-05' },
      error: null,
    });
    expect(notice).toBeNull();
  });

  it.each([
    ['unknown preset', { when: 'yesterday' }, 'invalid-preset'],
    ['only from', { from: '2026-11-01' }, 'invalid-format'],
    ['only to', { to: '2026-11-01' }, 'invalid-format'],
    ['bad format', { from: '1.11.2026', to: '5.11.2026' }, 'invalid-format'],
    ['reversed order', { from: '2026-11-05', to: '2026-11-01' }, 'invalid-order'],
    ['too long', { from: '2026-11-01', to: '2026-12-31' }, 'range-too-long'],
  ])('falls back to the week with a notice on %s', (_name, params, error) => {
    expect(parseSearchQuery(params, FRIDAY)).toMatchObject({
      date: { source: 'preset', preset: 'week', range: WEEK, error },
      notice: INVALID_RANGE_NOTICE,
    });
  });

  it('prefers when over from and to', () => {
    const { date } = parseSearchQuery(
      { when: 'today', from: '2026-11-01', to: '2026-11-05' },
      FRIDAY,
    );
    expect(date).toMatchObject({ source: 'preset', preset: 'today' });
  });
});

describe('parseSearchQuery: time', () => {
  it.each(['morning', 'noon', 'afternoon', 'evening', 'night'] as const)(
    'parses the %s preset',
    (preset) => {
      expect(parseSearchQuery({ time: preset }, FRIDAY)).toMatchObject({
        time: {
          source: 'preset',
          preset,
          window: TIME_PRESET_WINDOWS[preset],
          error: null,
        },
        notice: null,
      });
    },
  );

  it('parses a custom window', () => {
    expect(
      parseSearchQuery({ timeFrom: '09:15', timeTo: '12:00' }, FRIDAY).time,
    ).toEqual({
      source: 'custom',
      window: { from: at(9, 15), to: at(12) },
      error: null,
    });
  });

  it('defaults a missing timeTo to 04:00', () => {
    expect(parseSearchQuery({ timeFrom: '17:30' }, FRIDAY).time).toEqual({
      source: 'custom',
      window: { from: at(17, 30), to: at(4) },
      error: null,
    });
  });

  it('prefers time over timeFrom', () => {
    expect(
      parseSearchQuery({ time: 'noon', timeFrom: '09:00' }, FRIDAY).time,
    ).toMatchObject({ source: 'preset', preset: 'noon' });
  });

  it.each([
    ['unknown preset', { time: 'dawn' }, 'invalid-preset'],
    ['bad format', { timeFrom: '9:15' }, 'invalid-format'],
    ['bad end format', { timeFrom: '09:15', timeTo: 'late' }, 'invalid-format'],
    ['timeTo without timeFrom', { timeTo: '10:00' }, 'invalid-format'],
    ['equal times', { timeFrom: '10:00', timeTo: '10:00' }, 'same-time'],
  ])('falls back to all times with a notice on %s', (_name, params, error) => {
    expect(parseSearchQuery(params, FRIDAY)).toMatchObject({
      time: { source: 'all', window: null, error },
      notice: INVALID_TIME_NOTICE,
    });
  });
});

describe('parseSearchQuery: combined', () => {
  it('returns the combined notice when both are invalid', () => {
    expect(
      parseSearchQuery({ when: 'nope', time: 'nope' }, FRIDAY).notice,
    ).toBe(INVALID_SEARCH_NOTICE);
  });

  it('takes the first value of repeated params', () => {
    const query = parseSearchQuery({ when: ['today', 'week'], time: ['night'] }, FRIDAY);
    expect(query.date).toMatchObject({ preset: 'today' });
    expect(query.time).toMatchObject({ preset: 'night' });
  });

  it('accepts URLSearchParams, first value wins, order is irrelevant', () => {
    const query = parseSearchQuery(
      new URLSearchParams('time=night&when=today&when=week'),
      FRIDAY,
    );
    expect(query.date).toMatchObject({ preset: 'today' });
    expect(query.time).toMatchObject({ preset: 'night' });
  });
});

describe('hrefFor', () => {
  const customDates = { from: '2026-07-01', to: '2026-07-05' } as const;

  it('keeps the time params when the date changes', () => {
    const href = hrefFor('/', new URLSearchParams('when=today&time=night'), {
      date: 'weekend',
    });
    expect(href).toBe('/?time=night&when=weekend');
  });

  it('keeps the date params when the time changes', () => {
    const href = hrefFor('/', 'from=2026-07-01&to=2026-07-05&time=noon', {
      time: { from: at(17, 30), to: at(4) },
    });
    const params = new URL(href, 'http://x').searchParams;
    expect(Object.fromEntries(params)).toEqual({
      from: '2026-07-01',
      to: '2026-07-05',
      timeFrom: '17:30',
      timeTo: '04:00',
    });
  });

  it('writes a time preset and drops a previous custom window', () => {
    expect(hrefFor('/', 'timeFrom=10%3A00&timeTo=12%3A00', { time: 'evening' })).toBe(
      '/?time=evening',
    );
  });

  it('clears all time keys when time is null', () => {
    expect(
      hrefFor('/', 'when=today&time=noon&timeFrom=10%3A00&timeTo=12%3A00', {
        time: null,
      }),
    ).toBe('/?when=today');
  });

  it('writes from/to and removes when for a custom range', () => {
    expect(hrefFor('/', 'when=today&time=noon', { date: customDates })).toBe(
      '/?time=noon&from=2026-07-01&to=2026-07-05',
    );
  });

  it('writes when and removes from/to for a preset', () => {
    expect(hrefFor('/', 'from=2026-07-01&to=2026-07-05', { date: 'today' })).toBe(
      '/?when=today',
    );
  });

  it('returns the pathname only for an empty query', () => {
    expect(hrefFor('/events', '', { time: null })).toBe('/events');
  });

  it('does not mutate the current params', () => {
    const current = new URLSearchParams('when=today');
    hrefFor('/', current, { date: 'week' });
    expect(current.toString()).toBe('when=today');
  });

  it('round-trips through parseSearchQuery', () => {
    const href = hrefFor('/', '', { time: { from: at(7, 5), to: at(4) } });
    const params = new URL(href, 'http://x').searchParams;
    expect(parseSearchQuery(params, FRIDAY).time).toMatchObject({
      source: 'custom',
      window: { from: at(7, 5), to: at(4) },
    });
  });
});

describe('parseSearchQuery: presets use the event day', () => {
  const SUNDAY_2AM = new Date('2026-10-04T02:00:00+02:00');
  const MONDAY_MIDNIGHT = new Date('2026-10-05T00:00:00+02:00');
  const MONDAY_4AM = new Date('2026-10-05T04:00:00+02:00');
  const rangeOf = (when: string, now: Date) =>
    parseSearchQuery({ when }, now).date.range;

  it('treats Sunday 02:00 as Saturday', () => {
    expect(rangeOf('today', SUNDAY_2AM)).toEqual({ from: '2026-10-03', to: '2026-10-03' });
    expect(rangeOf('tomorrow', SUNDAY_2AM)).toEqual({ from: '2026-10-04', to: '2026-10-04' });
    expect(rangeOf('week', SUNDAY_2AM)).toEqual(WEEK);
    expect(rangeOf('weekend', SUNDAY_2AM)).toEqual({ from: '2026-10-03', to: '2026-10-04' });
  });

  it('keeps Monday 00:00 in the previous week', () => {
    expect(rangeOf('week', MONDAY_MIDNIGHT)).toEqual(WEEK);
    expect(rangeOf('today', MONDAY_MIDNIGHT)).toEqual({ from: '2026-10-04', to: '2026-10-04' });
  });

  it('starts the new week at Monday 04:00', () => {
    expect(rangeOf('week', MONDAY_4AM)).toEqual({ from: '2026-10-05', to: '2026-10-11' });
  });
});
