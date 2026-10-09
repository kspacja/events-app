import {
  eventIdSchema,
  occurrenceIdSchema,
  type OccurrenceListing,
} from '@events/contract/listing';
import type { DateRange } from '@events/time';
import { describe, expect, it } from 'vitest';
import { TIME_PRESET_WINDOWS } from '@/features/search/timeRange';
import { buildSchedule, formatCount, scheduleSpan } from './schedule';

function makeListing(
  occurrenceId: string,
  startsAt: string,
  lat = 52,
  eventId = occurrenceId,
): OccurrenceListing {
  return {
    occurrenceId: occurrenceIdSchema.parse(occurrenceId),
    startsAt,
    price: null,
    event: { id: eventIdSchema.parse(eventId), title: `Event ${eventId}`, categories: [{ slug: 'music', label: 'Muzyka' }] },
    venue: { name: 'Venue', address: 'ul. Testowa 1', city: 'Warszawa', lat, lng: 21 },
  };
}

const WEEK: DateRange = { from: '2026-06-01', to: '2026-06-07' };
const SATURDAY: DateRange = { from: '2026-06-06', to: '2026-06-06' };

function activeIds(listings: OccurrenceListing[], query: Parameters<typeof buildSchedule>[1]) {
  return buildSchedule(listings, query)
    .weeks.flat()
    .flatMap((day) => day.entries)
    .filter(({ active }) => active)
    .map(({ listing }) => listing.occurrenceId);
}

describe('scheduleSpan', () => {
  it('expands a mid-week range to Monday through Sunday', () => {
    expect(scheduleSpan({ from: '2026-06-03', to: '2026-06-10' })).toEqual({
      from: '2026-06-01',
      to: '2026-06-14',
    });
  });
});

describe('buildSchedule active rule', () => {
  const saturdayEvening = makeListing('sat-evening', '2026-06-06T20:00:00+02:00');
  const mondayEvening = makeListing('mon-evening', '2026-06-01T20:00:00+02:00');
  const saturdayMorning = makeListing('sat-morning', '2026-06-06T08:00:00+02:00');
  const listings = [saturdayEvening, mondayEvening, saturdayMorning];

  it('uses only the date range when there is no time window', () => {
    expect(activeIds(listings, { range: SATURDAY, time: null }).sort()).toEqual([
      'sat-evening',
      'sat-morning',
    ]);
  });

  it('uses only the time window when the range covers every day', () => {
    expect(
      activeIds(listings, { range: WEEK, time: TIME_PRESET_WINDOWS.evening }).sort(),
    ).toEqual(['mon-evening', 'sat-evening']);
  });

  it('requires both date range and time window', () => {
    expect(
      activeIds(listings, { range: SATURDAY, time: TIME_PRESET_WINDOWS.evening }),
    ).toEqual(['sat-evening']);
  });

  it('treats Sunday 01:30 as Saturday for a Saturday night search', () => {
    const lateNight = makeListing('late', '2026-06-07T01:30:00+02:00');
    const schedule = buildSchedule([lateNight], {
      range: SATURDAY,
      time: TIME_PRESET_WINDOWS.night,
    });
    const saturday = schedule.weeks[0].find(({ day }) => day === '2026-06-06');
    expect(saturday?.entries).toEqual([{ listing: lateNight, active: true }]);
    expect(schedule.activeCount).toBe(1);
  });
});

describe('buildSchedule landing', () => {
  const WEEKEND: DateRange = { from: '2026-06-06', to: '2026-06-07' };
  const MID_WEEK: DateRange = { from: '2026-06-03', to: '2026-06-10' };

  it.each([
    ['a week', WEEK, '2026-06-01'],
    ['a weekend', WEEKEND, '2026-06-06'],
    ['a custom range starting mid-week', MID_WEEK, '2026-06-03'],
  ])('lands on the first in-range day of %s', (_name, range, day) => {
    expect(buildSchedule([], { range, time: null }).landing.day).toBe(day);
  });

  it('has no occurrence target without a time window', () => {
    const listing = makeListing('a', '2026-06-02T20:00:00+02:00');
    expect(buildSchedule([listing], { range: WEEK, time: null }).landing.occurrenceId).toBeNull();
  });

  it('targets the active occurrence with the lowest index in its day', () => {
    const listings = [
      makeListing('tue-morning', '2026-06-02T09:00:00+02:00'),
      makeListing('tue-evening', '2026-06-02T19:00:00+02:00'),
      makeListing('wed-evening', '2026-06-03T19:00:00+02:00'),
    ];
    const { landing } = buildSchedule(listings, {
      range: WEEK,
      time: TIME_PRESET_WINDOWS.evening,
    });
    expect(landing).toEqual({ day: '2026-06-03', occurrenceId: 'wed-evening' });
  });

  it('breaks an index tie by the earlier day', () => {
    const listings = [
      makeListing('thu-evening', '2026-06-04T19:00:00+02:00'),
      makeListing('tue-evening', '2026-06-02T19:00:00+02:00'),
    ];
    const { landing } = buildSchedule(listings, {
      range: WEEK,
      time: TIME_PRESET_WINDOWS.evening,
    });
    expect(landing).toEqual({ day: '2026-06-02', occurrenceId: 'tue-evening' });
  });

  it('targets an occurrence in the second week of a multi-week range', () => {
    const range: DateRange = { from: '2026-06-01', to: '2026-06-14' };
    const listings = [
      makeListing('week-1-morning', '2026-06-02T09:00:00+02:00'),
      makeListing('week-2-evening', '2026-06-10T19:00:00+02:00'),
    ];
    const { landing } = buildSchedule(listings, { range, time: TIME_PRESET_WINDOWS.evening });
    expect(landing).toEqual({ day: '2026-06-10', occurrenceId: 'week-2-evening' });
  });

  it('breaks a cross-week index tie by the earlier day', () => {
    const range: DateRange = { from: '2026-06-01', to: '2026-06-14' };
    const listings = [
      makeListing('week-2-evening', '2026-06-09T19:00:00+02:00'),
      makeListing('week-1-evening', '2026-06-04T19:00:00+02:00'),
    ];
    const { landing } = buildSchedule(listings, { range, time: TIME_PRESET_WINDOWS.evening });
    expect(landing).toEqual({ day: '2026-06-04', occurrenceId: 'week-1-evening' });
  });

  it('has no target when nothing matches the time window', () => {
    const listing = makeListing('morning', '2026-06-02T09:00:00+02:00');
    const { landing } = buildSchedule([listing], {
      range: WEEK,
      time: TIME_PRESET_WINDOWS.evening,
    });
    expect(landing).toEqual({ day: '2026-06-01', occurrenceId: null });
  });
});

describe('buildSchedule map points', () => {
  it('labels the popup with the event day, not the calendar date', () => {
    const lateNight = makeListing('late', '2026-10-04T01:30:00+02:00');
    const { mapPoints } = buildSchedule([lateNight], { range: WEEK, time: null });
    expect(mapPoints[0]).toMatchObject({ date: 'sobota, 3.10', time: '01:30' });
  });
});

describe('buildSchedule days and weeks', () => {
  it('keeps out-of-range days with their events inactive', () => {
    const outside = makeListing('outside', '2026-06-01T12:00:00+02:00');
    const schedule = buildSchedule([outside], { range: SATURDAY, time: null });
    const monday = schedule.weeks[0][0];
    expect(monday.inRange).toBe(false);
    expect(monday.entries).toEqual([{ listing: outside, active: false }]);
    expect(schedule.weeks[0][5].inRange).toBe(true);
  });

  it('always returns full Monday-first weeks across several weeks', () => {
    const schedule = buildSchedule([], {
      range: { from: '2026-06-03', to: '2026-06-17' },
      time: null,
    });
    expect(schedule.weeks).toHaveLength(3);
    for (const week of schedule.weeks) {
      expect(week.map(({ weekdayIndex }) => weekdayIndex)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    }
    expect(schedule.weeks[0][0].day).toBe('2026-06-01');
    expect(schedule.weeks[2][6].day).toBe('2026-06-21');
  });

  it('flags only Saturday and Sunday as weekend', () => {
    const [week] = buildSchedule([], { range: WEEK, time: null }).weeks;
    expect(week.map(({ isWeekend }) => isWeekend)).toEqual([
      false, false, false, false, false, true, true,
    ]);
  });

  it('keeps the source order within a day, with the 04:00 rule', () => {
    const listings = [
      makeListing('a', '2026-06-06T09:00:00+02:00'),
      makeListing('b', '2026-06-06T20:00:00+02:00'),
      makeListing('night', '2026-06-07T02:00:00+02:00'),
    ];
    const schedule = buildSchedule(listings, { range: SATURDAY, time: null });
    const saturday = schedule.weeks[0][5];
    expect(saturday.entries.map(({ listing }) => listing.occurrenceId)).toEqual(['a', 'b', 'night']);
  });
});

describe('buildSchedule occurrences of one event', () => {
  const first = makeListing('club-2026-06-05', '2026-06-05T20:00:00+02:00', 52, 'club');
  const second = makeListing('club-2026-06-06', '2026-06-06T20:00:00+02:00', 52, 'club');

  it('keeps distinct occurrence ids that share one event id', () => {
    const schedule = buildSchedule([first, second], { range: WEEK, time: null });
    const entries = schedule.weeks.flat().flatMap((day) => day.entries);

    expect(entries.map(({ listing }) => listing.occurrenceId)).toEqual([
      'club-2026-06-05',
      'club-2026-06-06',
    ]);
    expect(new Set(entries.map(({ listing }) => listing.event.id))).toEqual(new Set(['club']));
  });
});

describe('buildSchedule counts and map', () => {
  const inside = makeListing('in', '2026-06-06T12:00:00+02:00', 50);
  const outside = makeListing('out', '2026-06-01T12:00:00+02:00', 54);

  it('counts active occurrences', () => {
    expect(buildSchedule([outside, inside], { range: SATURDAY, time: null }).activeCount).toBe(1);
  });

  it('flags map points as active and focuses on them', () => {
    const { mapPoints, mapFocus } = buildSchedule([outside, inside], {
      range: SATURDAY,
      time: null,
    });
    expect(mapPoints.map(({ occurrenceId, active }) => [occurrenceId, active])).toEqual([
      ['out', false],
      ['in', true],
    ]);
    expect(mapFocus.map(({ occurrenceId }) => occurrenceId)).toEqual(['in']);
  });

  it('focuses on every point when none is active', () => {
    const { mapPoints, mapFocus } = buildSchedule([outside], { range: SATURDAY, time: null });
    expect(mapFocus).toEqual(mapPoints);
    expect(mapFocus).toHaveLength(1);
  });

  it('formats popup date and time in local time', () => {
    const [point] = buildSchedule([inside], { range: SATURDAY, time: null }).mapPoints;
    expect(point.time).toBe('12:00');
    expect(point.date).toContain('sobota');
  });
});

describe('formatCount', () => {
  it.each([
    [0, 'Brak wydarzeń w tym terminie'],
    [1, '1 wydarzenie'],
    [2, '2 wydarzenia'],
    [5, '5 wydarzeń'],
    [12, '12 wydarzeń'],
    [22, '22 wydarzenia'],
    [25, '25 wydarzeń'],
  ])('formats %i', (count, label) => {
    expect(formatCount(count)).toBe(label);
  });
});
