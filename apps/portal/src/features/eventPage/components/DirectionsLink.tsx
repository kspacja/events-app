import { directionsHref } from '../directions';
import { EVENT_PAGE_LABELS as LABELS } from '../labels';
import { ExternalIcon } from './icons';
import styles from './EventPage.module.css';

/** An outlined link to Google Maps directions; it opens in a new tab, which the label tells screen readers. */
export function DirectionsLink({ lat, lng }: { readonly lat: number; readonly lng: number }) {
  return (
    <a href={directionsHref({ lat, lng })} target="_blank" rel="noopener noreferrer" className={styles.directions}>
      {LABELS.directions}
      <span className="visually-hidden">{LABELS.newTab}</span>
      <ExternalIcon />
    </a>
  );
}
