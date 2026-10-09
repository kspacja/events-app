import type { Metadata } from 'next';
import { currentEventDay } from '@events/time';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import { BackToTop } from '@/features/events/components/BackToTop';
import { EventsSection } from '@/features/events/components/EventsSection';
import { createHttpOccurrenceSource } from '@/features/events/source/httpOccurrenceSource';
import { SchoolsCalendar } from '@/features/schools/components/SchoolsCalendar';
import { WeekArrow } from '@/features/schools/components/WeekArrow';
import { SCHOOLS_LABELS } from '@/features/schools/labels';
import { parseSchoolsQuery } from '@/features/schools/schoolsQuery';
import styles from '../page.module.css';

export const metadata: Metadata = { title: SCHOOLS_LABELS.pageTitle };

export default async function SchoolsPage({ searchParams }: PageProps<'/dla-szkol'>) {
  const now = new Date();
  const { week, range, month, notice } = parseSchoolsQuery(await searchParams, now);
  const source = createHttpOccurrenceSource(getRuntimeConfig().eventsApiUrl, { forSchools: true });
  const today = currentEventDay(now);

  return (
    <main className={styles.page}>
      <EventsSection
        source={source}
        range={range}
        time={null}
        sentence={SCHOOLS_LABELS.heading}
        layout="split"
        controlsLabels={{ show: SCHOOLS_LABELS.calendarShow, hide: SCHOOLS_LABELS.calendarHide }}
        controls={
          <SchoolsCalendar month={month} week={week} today={today} />
        }
        rangeNavigation={{
          previous: <WeekArrow direction={-1} week={week} />,
          next: <WeekArrow direction={1} week={week} />,
        }}
        notice={notice}
      />
      <BackToTop />
    </main>
  );
}
