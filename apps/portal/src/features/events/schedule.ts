import { weeksCovering } from '@/features/search/dateRange';
import { matchesTimeWindow, type TimeWindow } from '@/features/search/timeRange';
import {
  addDays,
  DAYS_IN_WEEK,
  eventDayOf,
  isDayInRange,
  mondayOf,
  weekdayIndex,
  type CalendarDay,
  type DateRange,
} from '@events/time';
import type { OccurrenceId, OccurrenceListing } from '@events/contract/listing';
import { formatCalendarDay, formatLocalTime } from '@/lib/format';
import { COUNT_LABELS } from './labels';
import type { MapPoint } from './mapView';

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

export interface ScheduleLanding {
  /** The target card's day when there is one, otherwise the landing day or the first in-range day. */
  readonly day: CalendarDay;
  /** Set only when a time window is selected and something matches it. */
  readonly occurrenceId: OccurrenceId | null;
}

export interface Schedule {
  readonly landing: ScheduleLanding;
  readonly weeks: readonly (readonly ScheduleDay[])[];
  readonly activeCount: number;
  readonly mapPoints: readonly MapPoint[];
  /** Active points, or all points when none is active. */
  readonly mapFocus: readonly MapPoint[];
}

export interface ScheduleQuery {
  readonly range: DateRange;
  readonly time: TimeWindow | null;
  /** The day the week strip scrolls to; the first day of the range when not given. */
  readonly landingDay?: CalendarDay;
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

function firstActiveOccurrence(
  weeks: readonly (readonly ScheduleDay[])[],
): { day: CalendarDay; occurrenceId: OccurrenceId } | null {
  let best: { index: number; day: CalendarDay; occurrenceId: OccurrenceId } | null = null;
  for (const { day, entries } of weeks.flat()) {
    const index = entries.findIndex(({ active }) => active);
    // Strict comparison keeps the earlier day on ties
    if (index !== -1 && (best === null || index < best.index)) {
      best = { index, day, occurrenceId: entries[index].listing.occurrenceId };
    }
  }
  return best && { day: best.day, occurrenceId: best.occurrenceId };
}

/** Relies on the OccurrenceSource promise that listings arrive sorted. */
export function buildSchedule(
  listings: readonly OccurrenceListing[],
  { range, time, landingDay }: ScheduleQuery,
): Schedule {
  const entries = listings.map((listing) => ({
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

  const target = time ? firstActiveOccurrence(weeks) : null;
  const landing: ScheduleLanding = target ?? {
    day: landingDay ?? range.from,
    occurrenceId: null,
  };

  return {
    landing,
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
