'use client';

import type { OccurrenceListing } from '@events/contract/listing';
import type { CalendarDay } from '@events/time';
import { OccurrenceCard } from '@/features/events/components/OccurrenceCard';
import { EventDetailsDialog } from '@/features/schools/eventDetails/EventDetailsDialog';
import { openEventDetails } from '@/features/schools/eventDetails/eventParam';
import { EVENT_PAGE_LABELS as LABELS } from '../labels';
import styles from './EventPage.module.css';

interface SimilarEventsProps {
  readonly listings: readonly OccurrenceListing[];
  readonly today: CalendarDay;
}

/** The month's hover tiles in a row that scrolls sideways; a tile opens the details dialog first, as in the month. */
export function SimilarEvents({ listings, today }: SimilarEventsProps) {
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
              onSelect={() => openEventDetails(listing.occurrenceId)}
            />
          </li>
        ))}
      </ul>
      <EventDetailsDialog listings={listings} today={today} />
    </section>
  );
}
