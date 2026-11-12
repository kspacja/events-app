import 'server-only';

import { cache } from 'react';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import { buildSchedule, scheduleSpan, type Schedule } from '@/features/events/schedule';
import { createHttpOccurrenceSource } from '@/features/events/source/httpOccurrenceSource';
import { daysOf, type CalendarMonth } from './monthCalendar';
import { parseFilters } from './schoolFilters';

/** The school schedule of one month, in whole weeks; days outside the month are out of range. */
export const loadMonthSchedule = cache(async (month: CalendarMonth, filtersQuery = ''): Promise<Schedule> => {
  const range = daysOf(month);
  const filters = parseFilters(new URLSearchParams(filtersQuery));
  const source = createHttpOccurrenceSource(getRuntimeConfig().eventsApiUrl, { forSchools: true, filters });
  const listings = await source.listOccurrences(scheduleSpan(range));
  return buildSchedule(listings, { range, time: null });
});
