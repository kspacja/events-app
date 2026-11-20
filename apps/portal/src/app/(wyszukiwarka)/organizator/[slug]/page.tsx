import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { currentEventDay } from '@events/time';
import { ResultsList } from '@/features/schoolSearch/components/ResultsList';
import styles from '@/features/schoolSearch/components/SearchPage.module.css';
import { countLabel, SEARCH_LABELS } from '@/features/schoolSearch/labels';
import { findOrganizer, loadSearchResults } from '@/features/schoolSearch/searchSource';
import { BackToCalendar } from '@/features/schoolSearch/components/BackToCalendar';

export async function generateMetadata({ params }: PageProps<'/organizator/[slug]'>): Promise<Metadata> {
  const organizer = await findOrganizer((await params).slug);
  return { title: organizer?.name ?? SEARCH_LABELS.organizers };
}

/** Draft (TBD): the organizer's upcoming events on the left, room for the organizer itself on the right. */
export default async function OrganizerPage({ params }: PageProps<'/organizator/[slug]'>) {
  const { slug } = await params;
  const [organizer, listings] = await Promise.all([findOrganizer(slug), loadSearchResults({ by: 'organizer', organizer: slug })]);
  if (!organizer) notFound();
  const moment = new Date();

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <BackToCalendar />
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>{organizer.name}</h1>
            <p className={styles.lead}>{countLabel(listings.length)}</p>
          </div>
        </header>
        <div className={styles.columns}>
          <section aria-labelledby="upcoming">
            <h2 id="upcoming" className={styles.sectionTitle}>
              {SEARCH_LABELS.upcoming}
            </h2>
            {listings.length > 0 ? (
              <ResultsList listings={listings} today={currentEventDay(moment)} now={moment.getTime()} showOrganizer={false} />
            ) : (
              <p className={styles.empty}>{SEARCH_LABELS.empty}</p>
            )}
          </section>
          <aside className={styles.aside} aria-labelledby="about">
            <h2 id="about" className={styles.sectionTitle}>
              {SEARCH_LABELS.aboutOrganizer}
            </h2>
            <p>{SEARCH_LABELS.organizerSoon}</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
