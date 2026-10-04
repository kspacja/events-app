'use client';

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
    <>
      {SENTENCE_LABELS.lead}{' '}
      <SentenceChip label={SENTENCE_LABELS.category} />{' '}
      <SentenceChip label={SENTENCE_LABELS.place} />,{' '}
      <FilterChip definition={dateFilter(date)} />{' '}
      <FilterChip definition={timeFilter(time)} />.
    </>
  );
}
