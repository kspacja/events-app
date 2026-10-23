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
}

export function OccurrenceCard({ listing, muted = false }: OccurrenceCardProps) {
  const { occurrenceId, startsAt, event, venue } = listing;
  const { title, imageUrl } = event;
  const main = mainCategory(event);

  console.log(event);

  return (
    <article
      id={occurrenceDomId(occurrenceId)}
      tabIndex={-1}
      className={styles.card}
      data-muted={muted}
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
