import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { connection } from 'next/server';
import { currentEventDay } from '@events/time';
import { BackToTop } from '@/features/events/components/BackToTop';
import { SchoolsShell } from '@/features/schools/components/SchoolsShell';
import { SCHOOLS_LABELS } from '@/features/schools/labels';
import styles from '../page.module.css';

export const metadata: Metadata = { title: SCHOOLS_LABELS.pageTitle };

/** Shared by every week, so Next keeps it mounted when the week changes; only the week page below it reloads. */
export default async function SchoolsLayout({ children }: { readonly children: ReactNode }) {
  await connection();
  return (
    <main className={styles.page}>
      <SchoolsShell today={currentEventDay(new Date())}>{children}</SchoolsShell>
      <BackToTop />
    </main>
  );
}
