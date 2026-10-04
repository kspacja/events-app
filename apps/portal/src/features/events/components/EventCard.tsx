import Image from 'next/image';
import { CATEGORY_TINTS } from '../categoryStyle';
import { CARD_LABELS, CATEGORY_LABELS } from '../labels';
import { formatLocalTime } from '@events/contract/time';
import { cardAttributes } from '../scheduleDom';
import type { Event } from '../types';
import { EventPinButton } from './EventPinButton';
import styles from './EventCard.module.css';

interface EventCardProps {
  readonly event: Event;
  readonly muted?: boolean;
}

export function EventCard({ event, muted = false }: EventCardProps) {
  const { title, venue, category, imageUrl, startsAt } = event;

  return (
    <article className={styles.card} {...cardAttributes(muted)}>
      <div
        className={styles.image}
        style={{ backgroundColor: CATEGORY_TINTS[category] }}
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
        <EventPinButton eventId={event.id} title={title} />
      </div>
      <p className={styles.meta}>
        {formatLocalTime(startsAt)} · {CATEGORY_LABELS[category]}
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
