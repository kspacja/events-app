import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SchoolsTopBar } from '@/features/schoolSearch/components/SchoolsTopBar';
import { SCHOOLS_LABELS } from '@/features/schools/labels';

export const metadata: Metadata = { title: SCHOOLS_LABELS.pageTitle };

/** Search results and the pages the search leads to (stage 3.10). */
export default function SearchLayout({ children }: { readonly children: ReactNode }) {
  return (
    <>
      <SchoolsTopBar />
      {children}
    </>
  );
}
