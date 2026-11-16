'use client';

import styles from './SearchSentence.module.css';

import type { DateSearchResult } from '../dateRange';
import { dateFilter, timeFilter } from '../filters';
import { SENTENCE_LABELS } from '../labels';
import type { TimeSearchResult } from '../timeRange';
import { FilterChip } from './FilterChip';
import { SentenceChip } from './SentenceChip';


interface SearchSentenceProps {
  readonly date: DateSearchResult;
  readonly time: TimeSearchResult;
}

export function SearchSentence({ date, time }: SearchSentenceProps) {
  return (
    <div className={styles.container}>
      {SENTENCE_LABELS.lead}{' '}
      <SentenceChip label={SENTENCE_LABELS.category} />{' '}
      {/* Each punctuation mark stays on the line of the chip before it */}
      <span className={styles.joined}>
        <SentenceChip label={SENTENCE_LABELS.place} />,
      </span>{' '}
      <FilterChip definition={dateFilter(date)} />{' '}
      <span className={styles.joined}>
        <FilterChip definition={timeFilter(time)} />.
      </span>
    </div>
  );
}
