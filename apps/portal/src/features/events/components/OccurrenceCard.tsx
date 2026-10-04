import Image from 'next/image';
import { CATEGORY_LABELS } from '@events/contract/categories';
import { formatLocalTime } from '@/lib/format';
import { CARD_LABELS } from '../labels';
import { occurrenceDomId } from '../scheduleDom';
import type { OccurrenceListing } from '../types';
import { ShowOnMapButton } from './ShowOnMapButton';
import styles from './OccurrenceCard.module.css';

interface OccurrenceCardProps {
  readonly listing: OccurrenceListing;
  readonly muted?: boolean;
}

export function OccurrenceCard({ listing, muted = false }: OccurrenceCardProps) {
  const { occurrenceId, startsAt, event, venue } = listing;
  const { title, category, imageUrl } = event;
  const label = CATEGORY_LABELS[category];

  return (
    <article
      id={occurrenceDomId(occurrenceId)}
      className={styles.card}
      data-muted={muted}
    >
      <div
        className={styles.image}
        style={{ backgroundColor: `var(--category-${category}, var(--color-bg-subtle))` }}
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
        <ShowOnMapButton occurrenceId={occurrenceId} title={title} />
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
