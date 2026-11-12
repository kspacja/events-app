import type { ReactNode } from 'react';
import { connection } from 'next/server';
import { currentEventDay } from '@events/time';
import { MonthShell } from '@/features/schools/components/MonthShell';

/** Outlives month changes, so the filters and dialogs keep their state. */
export default async function MonthLayout({ children }: { readonly children: ReactNode }) {
  await connection();
  return <MonthShell today={currentEventDay(new Date())}>{children}</MonthShell>;
}
