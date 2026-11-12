import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { TopBar } from '@/features/events/components/TopBar';
import { SCHOOLS_LABELS } from '@/features/schools/labels';

export const metadata: Metadata = { title: SCHOOLS_LABELS.pageTitle };

/** Shared by the week and the month view; each brings its own page frame. */
export default function SchoolsLayout({ children }: { readonly children: ReactNode }) {
  return (
    <>
      <TopBar title={SCHOOLS_LABELS.heading} />
      {children}
    </>
  );
}
