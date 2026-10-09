import 'server-only';

import { cache } from 'react';
import { addDays, type CalendarDay } from '@events/time';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import { buildSchedule, scheduleSpan, type Schedule } from '@/features/events/schedule';
import { createHttpOccurrenceSource } from '@/features/events/source/httpOccurrenceSource';

/** The school schedule of one week; the strip and the map of the same request share it. */
export const loadWeekSchedule = cache(async (week: CalendarDay): Promise<Schedule> => {
  const range = { from: week, to: addDays(week, 6) };
  const source = createHttpOccurrenceSource(getRuntimeConfig().eventsApiUrl, { forSchools: true });
  const listings = await source.listOccurrences(scheduleSpan(range));
  return buildSchedule(listings, { range, time: null });
});
