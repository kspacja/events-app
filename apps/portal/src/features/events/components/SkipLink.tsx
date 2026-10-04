import { MAP_LABELS } from '../labels';
import { SCHEDULE_SECTION_ID } from '../scheduleDom';
import styles from './SkipLink.module.css';

export function SkipLink() {
  return (
    <a href={`#${SCHEDULE_SECTION_ID}`} className={styles.link}>
      {MAP_LABELS.skipToList}
    </a>
  );
}
