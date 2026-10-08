import { getRuntimeConfig } from '@/config/runtimeConfig';
import { BackToTop } from '@/features/events/components/BackToTop';
import { EventsSection } from '@/features/events/components/EventsSection';
import { createHttpOccurrenceSource } from '@/features/events/source/httpOccurrenceSource';
import { parseSearchQuery } from '@/features/search/searchQuery';
import { SearchSentence } from '@/features/search/components/SearchSentence';
import styles from './page.module.css';

export default async function Home({ searchParams }: PageProps<'/'>) {
  const params = await searchParams;
  const now = new Date();
  const { date, time, notice } = parseSearchQuery(params, now);

  return (
    <main className={styles.page}>
      <EventsSection
        source={createHttpOccurrenceSource(getRuntimeConfig().eventsApiUrl)}
        range={date.range}
        time={time.window}
        sentence={<SearchSentence date={date} time={time} />}
        notice={notice}
      />
      <BackToTop />
    </main>
  );
}
