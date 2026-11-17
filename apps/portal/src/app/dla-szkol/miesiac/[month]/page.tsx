import { redirect } from 'next/navigation';
import { currentEventDay } from '@events/time';
import { EmptyInPlace } from '@/features/locality/components/EmptyInPlace';
import { LocalityProvider } from '@/features/locality/LocalityContext';
import { findLocality } from '@/features/locality/localitySource';
import { MapPoints } from '@/features/schools/components/MapDialog';
import { MonthGrid } from '@/features/schools/components/MonthGrid';
import { MonthDock } from '@/features/schools/components/MonthDock';
import { monthFromPath } from '@/features/schools/monthParam';
import { pointsInWeeks, splitPassedWeeks, weekJumpsOf } from '@/features/schools/monthWeeks';
import { loadMonthSchedule } from '@/features/schools/monthSchedule';
import { schoolsMonthHref } from '@/features/schools/schoolsHref';
import { filtersQuery, parseFilters, placeOf, withPlace } from '@/features/schools/schoolFilters';

export default async function MonthPage({ params, searchParams }: PageProps<'/dla-szkol/miesiac/[month]'>) {
  const { month: raw } = await params;
  const filters = parseFilters(await searchParams);
  const query = filtersQuery(filters);
  const today = currentEventDay(new Date());
  const month = monthFromPath(raw, today);
  if (raw !== month) redirect(schoolsMonthHref(month, query));

  const place = placeOf(filters);
  const [schedule, locality] = await Promise.all([loadMonthSchedule(month, query), place ? findLocality(place.localityId) : null]);
  const { shown, passed } = splitPassedWeeks(schedule.weeks, today);
  const points = pointsInWeeks(schedule.mapPoints, shown);
  const focus = pointsInWeeks(schedule.mapFocus, shown);

  return (
    <LocalityProvider locality={locality}>
      <MapPoints
        points={points}
        focus={focus.length > 0 ? focus : points}
        area={place && locality ? { lat: locality.lat, lng: locality.lng, radiusKm: place.radiusKm } : null}
      />
      {/* First in the page, so the month heading comes before its days; the dock itself floats at the bottom */}
      <MonthDock month={month} today={today} filtersQuery={query} total={schedule.activeCount} jumps={weekJumpsOf(shown, today)} />
      <MonthGrid
        month={month}
        weeks={shown}
        passed={passed}
        today={today}
        notice={
          place && schedule.activeCount === 0 ? (
            <EmptyInPlace
              place={place}
              locality={locality}
              hrefFor={(next) => schoolsMonthHref(month, filtersQuery(withPlace(filters, next)))}
            />
          ) : null
        }
      />
    </LocalityProvider>
  );
}
