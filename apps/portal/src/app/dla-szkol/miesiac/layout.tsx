import type { ReactNode } from 'react';
import { connection } from 'next/server';
import { currentEventDay } from '@events/time';
import { TopBar } from '@/features/events/components/TopBar';
import { SCHOOLS_LABELS } from '@/features/schools/labels';
import { MonthShell } from '@/features/schools/components/MonthShell';

/** Outlives month changes, so the filters and dialogs keep their state. */
export default async function MonthLayout({ children }: { readonly children: ReactNode }) {
  await connection();
  return (
    <>
      <TopBar title={SCHOOLS_LABELS.heading} wide />
      <MonthShell today={currentEventDay(new Date())}>{children}</MonthShell>
    </>
  );
}
