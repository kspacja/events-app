import Link from 'next/link';
import { currentEventDay, type DateRange } from '@events/time';
import type { RangeNavigation } from '@/features/events/components/Header';
import { toSearchParams, type SearchParamsInput } from '@/lib/searchParams';
import { DATE_PRESETS, resolvePreset, shiftRange, type DatePreset } from '../dateRange';
import { RANGE_NAVIGATION_LABELS } from '../labels';
import { hrefFor } from '../searchQuery';
import styles from './RangeArrows.module.css';

interface RangeArrowsProps {
  readonly range: DateRange;
  readonly params: SearchParamsInput;
  readonly now: Date;
}

/** A shifted range that matches a preset links to the preset, so the sentence reads e.g. "w przyszłym tygodniu". */
function asPreset(range: DateRange, now: Date): DatePreset | DateRange {
  return (
    DATE_PRESETS.find((preset) => {
      const resolved = resolvePreset(preset, now);
      return resolved.from === range.from && resolved.to === range.to;
    }) ?? range
  );
}

/** Arrows beside the range label that move the range a step back or forward; none back into the past. */
export function rangeArrows({ range, params, now }: RangeArrowsProps): RangeNavigation {
  const current = toSearchParams(params);
  const today = currentEventDay(now);
  const previous = shiftRange(range, -1);
  const next = shiftRange(range, 1);

  return {
    previous:
      previous.to >= today ? (
        <Link
          href={hrefFor('/', current, { date: asPreset(previous, now) })}
          scroll={false}
          className={styles.arrow}
          aria-label={RANGE_NAVIGATION_LABELS.previous}
        >
          ‹
        </Link>
      ) : (
        <span className={`${styles.arrow} ${styles.disabled}`} aria-hidden="true">
          ‹
        </span>
      ),
    next: (
      <Link
        href={hrefFor('/', current, { date: asPreset(next, now) })}
        scroll={false}
        className={styles.arrow}
        aria-label={RANGE_NAVIGATION_LABELS.next}
      >
        ›
      </Link>
    ),
  };
}
