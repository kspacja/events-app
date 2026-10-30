import Link from 'next/link';
import { currentEventDay, type DateRange } from '@events/time';
import type { RangeNavigation } from '@/features/events/components/Header';
import { toSearchParams, type SearchParamsInput } from '@/lib/searchParams';
import { DATE_PRESETS, resolvePreset, shiftRange, type DatePreset } from '../dateRange';
import { RANGE_NAVIGATION_LABELS } from '../labels';
import { hrefFor } from '../searchQuery';
import styles from './RangeArrows.module.css';

interface RangeLinksInput {
  readonly range: DateRange;
  readonly params: SearchParamsInput;
  readonly now: Date;
}

export interface RangeLinks {
  /** Null when the earlier range has fully passed. */
  readonly previous: string | null;
  readonly next: string;
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

/** Where the range goes a step back or forward; never back into the past. */
export function rangeLinks({ range, params, now }: RangeLinksInput): RangeLinks {
  const current = toSearchParams(params);
  const previous = shiftRange(range, -1);
  return {
    previous: previous.to >= currentEventDay(now) ? hrefFor('/', current, { date: asPreset(previous, now) }) : null,
    next: hrefFor('/', current, { date: asPreset(shiftRange(range, 1), now) }),
  };
}

/** Arrows beside the range label in the header. */
export function rangeArrows(links: RangeLinks): RangeNavigation {
  return {
    previous: links.previous ? (
      <Link href={links.previous} scroll={false} className={styles.arrow} aria-label={RANGE_NAVIGATION_LABELS.previous}>
        ‹
      </Link>
    ) : (
      <span className={`${styles.arrow} ${styles.disabled}`} aria-hidden="true">
        ‹
      </span>
    ),
    next: (
      <Link href={links.next} scroll={false} className={styles.arrow} aria-label={RANGE_NAVIGATION_LABELS.next}>
        ›
      </Link>
    ),
  };
}
