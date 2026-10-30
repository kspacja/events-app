import { currentEventDay } from '@events/time';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import { TopBar } from '@/features/events/components/TopBar';
import { BackToTop } from '@/features/events/components/BackToTop';
import { EventsSection } from '@/features/events/components/EventsSection';
import { createHttpOccurrenceSource } from '@/features/events/source/httpOccurrenceSource';
import { parseSearchQuery } from '@/features/search/searchQuery';
import { SearchSentence } from '@/features/search/components/SearchSentence';
import { rangeArrows, rangeLinks } from '@/features/search/components/RangeArrows';
import styles from './page.module.css';

export default async function Home({ searchParams }: PageProps<'/'>) {
  const params = await searchParams;
  const now = new Date();
  const { date, time, notice } = parseSearchQuery(params, now);
  const today = currentEventDay(now);
  const links = rangeLinks({ range: date.range, params, now });

  return (
    <>
      <TopBar />
      <main className={styles.page}>
        <EventsSection
          source={createHttpOccurrenceSource(getRuntimeConfig().eventsApiUrl)}
          range={date.range}
          today={today}
          rangeNavigation={rangeArrows(links)}
          rangeLinks={links}
          time={time.window}
          sentence={<SearchSentence date={date} time={time} />}
          notice={notice}
        />
        <BackToTop />
      </main>
    </>
  );
}
