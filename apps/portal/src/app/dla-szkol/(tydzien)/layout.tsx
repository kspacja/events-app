import type { ReactNode } from 'react';
import { connection } from 'next/server';
import { currentEventDay } from '@events/time';
import { BackToTop } from '@/features/events/components/BackToTop';
import { SchoolsShell } from '@/features/schools/components/SchoolsShell';
import styles from '@/app/page.module.css';

/** Shared by every week, so Next keeps it mounted when the week changes; only the week page below it reloads. */
export default async function WeekLayout({ children }: { readonly children: ReactNode }) {
  await connection();
  return (
    <main className={styles.page}>
      <SchoolsShell today={currentEventDay(new Date())}>{children}</SchoolsShell>
      <BackToTop />
    </main>
  );
}
