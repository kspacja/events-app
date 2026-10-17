import 'server-only';

import { cache } from 'react';
import { addDays, currentEventDay, type CalendarDay } from '@events/time';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import { buildSchedule, scheduleSpan, type Schedule } from '@/features/events/schedule';
import { createHttpOccurrenceSource } from '@/features/events/source/httpOccurrenceSource';
import { parseFilters } from './schoolFilters';
import { firstOpenDay } from './weekShift';

/** The school schedule of one week; the strip and the map of the same request share it. Filters come as a query string, a stable cache key. */
export const loadWeekSchedule = cache(async (week: CalendarDay, filtersQuery = ''): Promise<Schedule> => {
  const range = { from: week, to: addDays(week, 6) };
  const filters = parseFilters(new URLSearchParams(filtersQuery));
  const source = createHttpOccurrenceSource(getRuntimeConfig().eventsApiUrl, { forSchools: true, filters });
  const listings = await source.listOccurrences(scheduleSpan(range));
  // A week already under way lands on today, past its gone days
  return buildSchedule(listings, { range, time: null, landingDay: firstOpenDay(week, currentEventDay(new Date())) });
});
