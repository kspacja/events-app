import {
  isDayInRange,
  weeksCovering,
  type DateRange,
} from '@/features/search/dateRange';
import { matchesTimeWindow, type TimeWindow } from '@/features/search/timeRange';
import {
  addDays,
  DAYS_IN_WEEK,
  eventDayOf,
  mondayOf,
  weekdayIndex,
  type CalendarDay,
} from '@events/time';
import { formatCalendarDay, formatLocalTime } from '@/lib/format';
import { COUNT_LABELS } from './labels';
import type { MapPoint } from './mapView';
import type { OccurrenceListing } from './types';

export interface ScheduleEntry {
  readonly listing: OccurrenceListing;
  readonly active: boolean;
}

export interface ScheduleDay {
  readonly day: CalendarDay;
  readonly weekdayIndex: number;
  readonly inRange: boolean;
  readonly isWeekend: boolean;
  readonly entries: readonly ScheduleEntry[];
}

export interface Schedule {
  readonly weeks: readonly (readonly ScheduleDay[])[];
  readonly activeCount: number;
  readonly mapPoints: readonly MapPoint[];
  /** Active points, or all points when none is active. */
  readonly mapFocus: readonly MapPoint[];
}

export interface ScheduleQuery {
  readonly range: DateRange;
  readonly time: TimeWindow | null;
}

const WEEKEND_START_INDEX = 5;

const pluralRules = new Intl.PluralRules('pl');

/** The Monday-Sunday span covering the range; fetch occurrences for exactly this. */
export function scheduleSpan(range: DateRange): DateRange {
  return {
    from: mondayOf(range.from),
    to: addDays(mondayOf(range.to), DAYS_IN_WEEK - 1),
  };
}

function compareListings(a: OccurrenceListing, b: OccurrenceListing): number {
  const byTime = Date.parse(a.startsAt) - Date.parse(b.startsAt);
  if (byTime !== 0) return byTime;
  return a.occurrenceId < b.occurrenceId ? -1 : a.occurrenceId > b.occurrenceId ? 1 : 0;
}

function toMapPoint(
  { occurrenceId, event, venue, startsAt }: OccurrenceListing,
  active: boolean,
): MapPoint {
  return {
    occurrenceId,
    title: event.title,
    lat: venue.lat,
    lng: venue.lng,
    date: formatCalendarDay(eventDayOf(startsAt)),
    time: formatLocalTime(startsAt),
    active,
  };
}

export function buildSchedule(
  listings: readonly OccurrenceListing[],
  { range, time }: ScheduleQuery,
): Schedule {
  const entries = [...listings].sort(compareListings).map((listing) => ({
    listing,
    active:
      isDayInRange(eventDayOf(listing.startsAt), range) &&
      matchesTimeWindow(listing.startsAt, time),
  }));

  const byDay = new Map<CalendarDay, ScheduleEntry[]>();
  for (const entry of entries) {
    const day = eventDayOf(entry.listing.startsAt);
    byDay.set(day, [...(byDay.get(day) ?? []), entry]);
  }

  const weeks = weeksCovering(range).map((week) =>
    week.map((day): ScheduleDay => {
      const index = weekdayIndex(day);
      return {
        day,
        weekdayIndex: index,
        inRange: isDayInRange(day, range),
        isWeekend: index >= WEEKEND_START_INDEX,
        entries: byDay.get(day) ?? [],
      };
    }),
  );

  const mapPoints = entries.map(({ listing, active }) => toMapPoint(listing, active));
  const activePoints = mapPoints.filter((point) => point.active);

  return {
    weeks,
    activeCount: entries.filter(({ active }) => active).length,
    mapPoints,
    mapFocus: activePoints.length > 0 ? activePoints : mapPoints,
  };
}

export function formatCount(count: number): string {
  if (count === 0) return COUNT_LABELS.zero;
  if (count === 1) return `1 ${COUNT_LABELS.one}`;
  const form = pluralRules.select(count) === 'few' ? 'few' : 'many';
  return `${count} ${COUNT_LABELS[form]}`;
}
