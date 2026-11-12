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
  /** `popup`: no image and no anchor id, the pin beside the time; shown over a month bar. */
  readonly variant?: 'strip' | 'popup';
}

export function OccurrenceCard({ listing, muted = false, variant = 'strip' }: OccurrenceCardProps) {
  const { occurrenceId, startsAt, event, venue } = listing;
  const { title, imageUrl } = event;
  const main = mainCategory(event);

  console.log(event);

  return (
    <article
      id={variant === 'strip' ? occurrenceDomId(occurrenceId) : undefined}
      tabIndex={-1}
      className={styles.card}
      data-muted={muted}
      data-variant={variant}
    >
      {variant === 'strip' ? (
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
      ) : null}
      <p className={styles.meta}>
        {formatLocalTime(startsAt)} · {main.label}
        {variant === 'popup' ? <ShowOnMapButton occurrenceId={occurrenceId} title={title} /> : null}
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
