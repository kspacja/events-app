import type { ReactNode } from 'react';
import Link from 'next/link';
import { UI_LABELS } from '../labels';
import styles from './Header.module.css';

interface HeaderProps {
  readonly sentence: ReactNode;
  /** Shown under the heading, outside the <h1>, e.g. a calendar. */
  readonly controls?: ReactNode;
  readonly notice?: ReactNode;
  readonly rangeLabel: string;
  readonly timeLabel?: string;
  readonly countLabel: string;
  readonly map?: ReactNode;
}

export function Header({
  sentence,
  controls,
  notice,
  rangeLabel,
  timeLabel,
  countLabel,
  map,
}: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.main}>
        <Link href="/" className={styles.logo} aria-label={UI_LABELS.logoLabel}>
          {UI_LABELS.logo}
          <span className={styles.dot} aria-hidden="true">
            .
          </span>
        </Link>
        <h1 className={styles.sentence}>{sentence}</h1>
        {controls}
        {notice ? <p className={styles.notice}>{notice}</p> : null}
        <p className={styles.summary}>
          <span className={styles.range}>{rangeLabel}</span>
          {timeLabel ? <span className={styles.count}>{timeLabel}</span> : null}
          <span className={styles.count}>{countLabel}</span>
        </p>
      </div>
      {map ? <div className={styles.map}>{map}</div> : null}
    </header>
  );
}
