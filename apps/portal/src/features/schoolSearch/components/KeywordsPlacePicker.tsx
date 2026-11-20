'use client';

import { LocalityPicker } from '@/features/locality/components/LocalityPicker';
import { keywordsHref } from '../searchHref';

/** The calendar's Miejscowość picker; a choice keeps the keywords and searches in the new place. */
export function KeywordsPlacePicker({ keywords }: { readonly keywords: string }) {
  return <LocalityPicker hrefFor={(place) => keywordsHref(keywords, place)} align="end" />;
}
