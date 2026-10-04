import Image from 'next/image';
import { CATEGORIES } from '@events/contract/categories';
import { formatLocalTime } from '@/lib/format';
import { CARD_LABELS } from '../labels';
import { cardAttributes } from '../scheduleDom';
import type { OccurrenceListing } from '../types';
import { EventPinButton } from './EventPinButton';
import styles from './EventCard.module.css';

interface EventCardProps {
  readonly listing: OccurrenceListing;
  readonly muted?: boolean;
}

export function EventCard({ listing, muted = false }: EventCardProps) {
  const { occurrenceId, startsAt, event, venue } = listing;
  const { title, category, imageUrl } = event;
  const label = CATEGORIES.find((c) => c.slug === category)?.label ?? category;

  return (
    <article className={styles.card} {...cardAttributes(muted)}>
      <div
        className={styles.image}
        style={{ backgroundColor: `var(--category-${category})` }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            unoptimized
            sizes="240px"
            className={styles.photo}
          />
        ) : null}
        <EventPinButton occurrenceId={occurrenceId} title={title} />
      </div>
      <p className={styles.meta}>
        {formatLocalTime(startsAt)} · {label}
      </p>
      <h3 className={styles.title}>
        {title}
        {muted ? (
          <>
            {' '}
            <span className="visually-hidden">{CARD_LABELS.outsideRange}</span>
          </>
        ) : null}
      </h3>
      <p className={styles.place}>
        {venue.name}, {venue.city}
      </p>
    </article>
  );
}
