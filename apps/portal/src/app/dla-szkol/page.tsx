import type { Metadata } from 'next';
import { currentEventDay } from '@events/time';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import { BackToTop } from '@/features/events/components/BackToTop';
import { EventsSection } from '@/features/events/components/EventsSection';
import { createHttpOccurrenceSource } from '@/features/events/source/httpOccurrenceSource';
import { SchoolsCalendar } from '@/features/schools/components/SchoolsCalendar';
import { SCHOOLS_LABELS } from '@/features/schools/labels';
import { parseSchoolsQuery } from '@/features/schools/schoolsQuery';
import styles from '../page.module.css';

export const metadata: Metadata = { title: SCHOOLS_LABELS.pageTitle };

export default async function SchoolsPage({ searchParams }: PageProps<'/dla-szkol'>) {
  const now = new Date();
  const { day, week, month, notice } = parseSchoolsQuery(await searchParams, now);
  const source = createHttpOccurrenceSource(getRuntimeConfig().eventsApiUrl, { forSchools: true });

  return (
    <main className={styles.page}>
      <EventsSection
        source={source}
        range={week}
        time={null}
        sentence={SCHOOLS_LABELS.heading}
        controls={<SchoolsCalendar source={source} month={month} selectedDay={day} today={currentEventDay(now)} />}
        notice={notice}
        landingDay={day}
      />
      <BackToTop />
    </main>
  );
}
