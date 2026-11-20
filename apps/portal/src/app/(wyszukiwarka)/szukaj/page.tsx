import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SEARCH_QUERY_MIN_LENGTH } from '@events/contract/search';
import { currentEventDay } from '@events/time';
import { EmptyInPlace } from '@/features/locality/components/EmptyInPlace';
import { LocalityProvider } from '@/features/locality/LocalityContext';
import { findLocality } from '@/features/locality/localitySource';
import { KeywordsPlacePicker } from '@/features/schoolSearch/components/KeywordsPlacePicker';
import { ResultsList } from '@/features/schoolSearch/components/ResultsList';
import styles from '@/features/schoolSearch/components/SearchPage.module.css';
import { countLabel, resultsForLabel, SEARCH_LABELS } from '@/features/schoolSearch/labels';
import { keywordsHref, KEYWORDS_PARAM, VENUE_PARAM } from '@/features/schoolSearch/searchHref';
import { loadSearchResults } from '@/features/schoolSearch/searchSource';
import { SCHOOLS_PATH } from '@/features/schools/schoolsHref';
import { parseFilters, placeOf } from '@/features/schools/schoolFilters';
import { toSearchParams } from '@/lib/searchParams';
import { BackToCalendar } from '@/features/schoolSearch/components/BackToCalendar';

export const metadata: Metadata = { title: SEARCH_LABELS.resultsTitle };

/** `?miejsce=<id>`: upcoming events in one venue; `?q=…` with an optional place: upcoming events matching the keywords. */
export default async function SearchPage({ searchParams }: PageProps<'/szukaj'>) {
  const params = toSearchParams(await searchParams);
  const moment = new Date();
  const today = currentEventDay(moment);
  const now = moment.getTime();
  const venue = params.get(VENUE_PARAM);

  if (venue) {
    const listings = await loadSearchResults({ by: 'venue', venue });
    const first = listings[0]?.venue;
    return (
      <main className={styles.page}>
        <div className={styles.inner}>
          <BackToCalendar />
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>{first?.name ?? SEARCH_LABELS.venueFallback}</h1>
              <p className={styles.lead}>{[first ? `${first.address}, ${first.city}` : null, countLabel(listings.length)].filter(Boolean).join(' · ')}</p>
            </div>
          </header>
          {listings.length > 0 ? <ResultsList listings={listings} today={today} now={now} /> : <p className={styles.empty}>{SEARCH_LABELS.empty}</p>}
        </div>
      </main>
    );
  }

  const keywords = params.get(KEYWORDS_PARAM)?.trim() ?? '';
  if (keywords.length < SEARCH_QUERY_MIN_LENGTH) redirect(`${SCHOOLS_PATH}/miesiac`);

  const place = placeOf(parseFilters(params));
  const [listings, locality] = await Promise.all([
    loadSearchResults({ by: 'keywords', keywords, place }),
    place ? findLocality(place.localityId) : null,
  ]);

  return (
    <LocalityProvider locality={locality}>
      <main className={styles.page}>
        <div className={styles.inner}>
          <BackToCalendar />
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>{resultsForLabel(keywords)}</h1>
              <p className={styles.lead}>{countLabel(listings.length)}</p>
            </div>
            <KeywordsPlacePicker keywords={keywords} />
          </header>
          {listings.length > 0 ? (
            <ResultsList listings={listings} today={today} now={now} />
          ) : place ? (
            <EmptyInPlace place={place} locality={locality} hrefFor={(next) => keywordsHref(keywords, next)} />
          ) : (
            <p className={styles.empty}>{SEARCH_LABELS.empty}</p>
          )}
        </div>
      </main>
    </LocalityProvider>
  );
}
