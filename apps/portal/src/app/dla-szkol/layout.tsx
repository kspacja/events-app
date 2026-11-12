import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SCHOOLS_LABELS } from '@/features/schools/labels';

export const metadata: Metadata = { title: SCHOOLS_LABELS.pageTitle };

/** Shared by the week and the month view; each brings its own top bar and page frame. */
export default function SchoolsLayout({ children }: { readonly children: ReactNode }) {
  return children;
}
