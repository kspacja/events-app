import { getOccurrenceSource } from '@/composition/occurrenceSource';
import { BackToTop } from '@/features/events/components/BackToTop';
import { EventsSection } from '@/features/events/components/EventsSection';
import { parseSearchQuery } from '@/features/search/searchQuery';
import { SearchSentence } from '@/features/search/components/SearchSentence';
import styles from './page.module.css';

export default async function Home({ searchParams }: PageProps<'/'>) {
  const params = await searchParams;
  const { date, time, notice } = parseSearchQuery(params, new Date());

  return (
    <main className={styles.page}>
      <EventsSection
        source={getOccurrenceSource()}
        range={date.range}
        time={time.window}
        sentence={<SearchSentence date={date} time={time} />}
        notice={notice}
      />
      <BackToTop />
    </main>
  );
}
