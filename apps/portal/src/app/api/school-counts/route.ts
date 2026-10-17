import { NextResponse, type NextRequest } from 'next/server';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import { scheduleSpan } from '@/features/events/schedule';
import { createHttpOccurrenceSource } from '@/features/events/source/httpOccurrenceSource';
import { countByDay, daysOf, isCalendarMonth } from '@/features/schools/monthCalendar';
import { parseFilters } from '@/features/schools/schoolFilters';

/** School events per day of a month grid, for the calendar's day markers; the school filters narrow them too. */
export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get('month');
  if (month === null || !isCalendarMonth(month)) {
    return NextResponse.json({ error: 'month must be YYYY-MM' }, { status: 400 });
  }
  const source = createHttpOccurrenceSource(getRuntimeConfig().eventsApiUrl, {
    forSchools: true,
    filters: parseFilters(request.nextUrl.searchParams),
  });
  const listings = await source.listOccurrences(scheduleSpan(daysOf(month)));
  return NextResponse.json(Object.fromEntries(countByDay(listings)));
}
