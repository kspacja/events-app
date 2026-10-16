import Link from 'next/link';
import { SCHOOLS_PATH } from '@/features/schools/schoolsHref';
import { SCHOOLS_LABELS } from '@/features/schools/labels';
import { UI_LABELS } from '../labels';
import styles from './TopBar.module.css';

interface TopBarProps {
  /** The page's <h1>, beside the logo. */
  readonly title?: string;
}

export function TopBar({ title }: TopBarProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo} aria-label={UI_LABELS.logoLabel}>
          {UI_LABELS.logo}
          <span className={styles.dot} aria-hidden="true">
            .
          </span>
        </Link>
        {/* Only the schools page has a title, and its link would point to itself */}
        {title ? (
          <h1 className={styles.title}>{title}</h1>
        ) : (
          <Link href={SCHOOLS_PATH} className={styles.link}>
            {SCHOOLS_LABELS.pageTitle}
          </Link>
        )}
      </div>
    </div>
  );
}
