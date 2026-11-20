'use client';

import { useRouter } from 'next/navigation';
import type { OccurrenceListing } from '@events/contract/listing';
import { OccurrenceCard } from '@/features/events/components/OccurrenceCard';
import { eventPageHref } from '@/features/schoolSearch/searchHref';
import { EVENT_PAGE_LABELS as LABELS } from '../labels';
import styles from './EventPage.module.css';

/** The month's hover tiles in a row that scrolls sideways; a tile opens that event's page. */
export function SimilarEvents({ listings }: { readonly listings: readonly OccurrenceListing[] }) {
  const router = useRouter();
  return (
    <section className={styles.similar} aria-labelledby="similar">
      <h2 id="similar" className={styles.sectionTitle}>
        {LABELS.similar}
      </h2>
      <ul className={styles.similarRow}>
        {listings.map((listing) => (
          <li key={listing.occurrenceId} className={styles.similarItem}>
            <OccurrenceCard
              listing={listing}
              variant="popup"
              showOnMap={false}
              onSelect={() => router.push(eventPageHref(listing.event.id, listing.occurrenceId))}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
