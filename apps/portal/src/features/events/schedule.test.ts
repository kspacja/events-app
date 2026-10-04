import { describe, expect, it } from 'vitest';
import type { DateRange } from '@/features/search/dateRange';
import { TIME_PRESET_WINDOWS } from '@/features/search/timeRange';
import type { OccurrenceListing } from './types';
import { buildSchedule, formatCount, scheduleSpan } from './schedule';

function makeListing(
  occurrenceId: string,
  startsAt: string,
  lat = 52,
  eventId = occurrenceId,
): OccurrenceListing {
  return {
    occurrenceId,
    startsAt,
    price: null,
    event: { id: eventId, title: `Event ${eventId}`, category: 'music' },
    venue: { name: 'Venue', city: 'Warszawa', lat, lng: 21 },
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
  const events = [saturdayEvening, mondayEvening, saturdayMorning];

  it('uses only the date range when there is no time window', () => {
    expect(activeIds(events, { range: SATURDAY, time: null }).sort()).toEqual([
      'sat-evening',
      'sat-morning',
    ]);
  });

  it('uses only the time window when the range covers every day', () => {
    expect(
      activeIds(events, { range: WEEK, time: TIME_PRESET_WINDOWS.evening }).sort(),
    ).toEqual(['mon-evening', 'sat-evening']);
  });

  it('requires both date range and time window', () => {
    expect(
      activeIds(events, { range: SATURDAY, time: TIME_PRESET_WINDOWS.evening }),
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

  it('orders events chronologically within a day, with the 04:00 rule', () => {
    const events = [
      makeListing('b', '2026-06-06T20:00:00+02:00'),
      makeListing('night', '2026-06-07T02:00:00+02:00'),
      makeListing('a', '2026-06-06T09:00:00+02:00'),
    ];
    const schedule = buildSchedule(events, { range: SATURDAY, time: null });
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

  it('gives each map point its own occurrence id and the shared event id', () => {
    const { mapPoints } = buildSchedule([first, second], { range: WEEK, time: null });

    expect(mapPoints.map(({ occurrenceId, eventId }) => [occurrenceId, eventId])).toEqual([
      ['club-2026-06-05', 'club'],
      ['club-2026-06-06', 'club'],
    ]);
  });
});

describe('buildSchedule counts and map', () => {
  const inside = makeListing('in', '2026-06-06T12:00:00+02:00', 50);
  const outside = makeListing('out', '2026-06-01T12:00:00+02:00', 54);

  it('counts active events', () => {
    expect(buildSchedule([inside, outside], { range: SATURDAY, time: null }).activeCount).toBe(1);
  });

  it('flags map points as active and focuses on them', () => {
    const { mapPoints, mapFocus } = buildSchedule([inside, outside], {
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
