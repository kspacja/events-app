import Image from 'next/image';
import { formatLocalTime } from '@/lib/format';
import { CARD_LABELS } from '../labels';
import { occurrenceDomId } from '../scheduleDom';
import { mainCategory, type OccurrenceListing } from '@events/contract/listing';
import { ShowOnMapButton } from './ShowOnMapButton';
import styles from './OccurrenceCard.module.css';

interface OccurrenceCardProps {
  readonly listing: OccurrenceListing;
  readonly muted?: boolean;
  /** `popup`: framed and without the anchor id; shown over a month bar and in the day drawer. */
  readonly variant?: 'strip' | 'popup';
  /** Makes the whole card a button that opens the event's details. */
  readonly onSelect?: () => void;
}

export function OccurrenceCard({ listing, muted = false, variant = 'strip', onSelect }: OccurrenceCardProps) {
  const { occurrenceId, startsAt, event, venue, price } = listing;
  // Schools filter by price, so their cards say when an event costs nothing
  const free = event.forSchools && price?.kind === 'free';
  const { title, imageUrl } = event;
  const main = mainCategory(event);

  return (
    <article
      id={variant === 'strip' ? occurrenceDomId(occurrenceId) : undefined}
      tabIndex={-1}
      className={styles.card}
      data-muted={muted}
      data-variant={variant}
      data-selectable={onSelect ? true : undefined}
    >
      <div className={styles.image}>
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
        {formatLocalTime(startsAt)} · {main.label}
        {free ? (
          <>
            {' · '}
            <span className={styles.free}>{CARD_LABELS.free}</span>
          </>
        ) : null}
      </p>
      <h3 className={styles.title}>
        {onSelect ? (
          <button type="button" className={styles.select} onClick={onSelect}>
            {title}
          </button>
        ) : (
          title
        )}
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
