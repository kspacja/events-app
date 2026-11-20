import Link from 'next/link';
import { SEARCH_LABELS } from '../labels';
import { SCHOOLS_PATH } from '@/features/schools/schoolsHref';
import styles from './SearchPage.module.css';

export function BackToCalendar() {
  return (
    <Link href={`${SCHOOLS_PATH}/miesiac`} className={styles.back}>
      <span aria-hidden="true">←</span> {SEARCH_LABELS.backToCalendar}
    </Link>
  );
}
