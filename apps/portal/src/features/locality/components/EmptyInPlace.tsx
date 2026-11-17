import Link from 'next/link';
import type { Locality } from '@events/contract/localities';
import { emptyInPlaceLabel, LOCALITY_LABELS, widenLabel } from '../labels';
import { widerRadius, type Place } from '../place';
import styles from './EmptyInPlace.module.css';

interface EmptyInPlaceProps {
  readonly place: Place;
  readonly locality: Locality | null;
  /** The same page with another place, or all of Poland with null. */
  readonly hrefFor: (place: Place | null) => string;
}

/** Nothing within the radius: widen it one step, or drop the Miejscowość. */
export function EmptyInPlace({ place, locality, hrefFor }: EmptyInPlaceProps) {
  const wider = widerRadius(place.radiusKm);
  return (
    <div className={styles.notice} role="status">
      <p className={styles.title}>{locality ? emptyInPlaceLabel(locality.name, place.radiusKm) : LOCALITY_LABELS.noHints}</p>
      <div className={styles.actions}>
        {wider !== null && locality ? (
          <Link className={styles.widen} href={hrefFor({ ...place, radiusKm: wider })} scroll={false}>
            {widenLabel(wider)}
          </Link>
        ) : null}
        <Link className={styles.whole} href={hrefFor(null)} scroll={false}>
          {LOCALITY_LABELS.wholeCountry}
        </Link>
      </div>
    </div>
  );
}
