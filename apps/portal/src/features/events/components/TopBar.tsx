import Link from 'next/link';
import { SCHOOLS_PATH } from '@/features/schools/schoolsHref';
import { SCHOOLS_LABELS } from '@/features/schools/labels';
import { UI_LABELS } from '../labels';
import styles from './TopBar.module.css';

export function TopBar() {
  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo} aria-label={UI_LABELS.logoLabel}>
          {UI_LABELS.logo}
          <span className={styles.dot} aria-hidden="true">
            .
          </span>
        </Link>
        <Link href={SCHOOLS_PATH} className={styles.link}>
          {SCHOOLS_LABELS.pageTitle}
        </Link>
      </div>
    </div>
  );
}
