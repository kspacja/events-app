import { MAP_LABELS } from '../labels';
import { SCHEDULE_DOM } from '../scheduleDom';
import styles from './SkipLink.module.css';

export function SkipLink() {
  return (
    <a href={`#${SCHEDULE_DOM.sectionId}`} className={styles.link}>
      {MAP_LABELS.skipToList}
    </a>
  );
}
