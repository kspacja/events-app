import type { ReactNode } from 'react';
import { CollapsiblePanel } from './CollapsiblePanel';
import styles from './Header.module.css';

export interface RangeNavigation {
  readonly previous: ReactNode;
  readonly next: ReactNode;
}

interface HeaderProps {
  /** Stacked layout only; the split layout's page puts its title in the top bar. */
  readonly sentence?: ReactNode;
  /** Shown under the heading, outside the <h1>, e.g. a calendar. */
  readonly controls?: ReactNode;
  readonly notice?: ReactNode;
  readonly rangeLabel: string;
  /** Arrows on both sides of the range label. */
  readonly rangeNavigation?: RangeNavigation;
  readonly timeLabel?: string;
  readonly countLabel: ReactNode;
  readonly map?: ReactNode;
  /** `split`: the heading on top, controls and map in a left column, the summary in the right one. */
  readonly layout?: 'stacked' | 'split';
  /** Split layout only: on mobile the controls sit behind a button with these labels. */
  readonly controlsLabels?: { readonly show: string; readonly hide: string };
}

export function Header({
  sentence,
  controls,
  notice,
  rangeLabel,
  rangeNavigation,
  timeLabel,
  countLabel,
  map,
  layout = 'stacked',
  controlsLabels,
}: HeaderProps) {
  if (layout === 'split') {
    return (
      <header className={`${styles.header} ${styles.split}`}>
        <div className={styles.sidebar}>
          {controls && controlsLabels ? (
            <CollapsiblePanel show={controlsLabels.show} hide={controlsLabels.hide}>
              {controls}
            </CollapsiblePanel>
          ) : (
            controls
          )}
          {map ? <div className={styles.map}>{map}</div> : null}
        </div>
        <div className={styles.main}>
          {notice ? <p className={styles.notice}>{notice}</p> : null}
        </div>
      </header>
    );
  }

  return (
    <header className={styles.header}>
      <div className={styles.main}>
        <h1 className={styles.sentence}>{sentence}</h1>
        {controls}
        {notice ? <p className={styles.notice}>{notice}</p> : null}
        <p className={styles.summary}>
          <span className={styles.rangeGroup}>
            {rangeNavigation?.previous}
            <span className={styles.range}>{rangeLabel}</span>
            {rangeNavigation?.next}
          </span>
          {timeLabel ? <span className={styles.count}>{timeLabel}</span> : null}
          <span className={styles.count}>{countLabel}</span>
        </p>
      </div>
      {map ? <div className={styles.map}>{map}</div> : null}
    </header>
  );
}
