import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { currentEventDay } from '@events/time';
import { BackToTop } from '@/features/events/components/BackToTop';
import { WeekShell } from '@/features/schools/components/WeekShell';
import { schoolsHref } from '@/features/schools/schoolsHref';
import { weekFromPath } from '@/features/schools/weekParam';
import { SCHOOLS_LABELS } from '@/features/schools/labels';
import styles from '../../page.module.css';

export const metadata: Metadata = { title: SCHOOLS_LABELS.pageTitle };

interface WeekLayoutProps {
  readonly children: ReactNode;
  readonly map: ReactNode;
  readonly params: Promise<{ week: string }>;
}

export default async function WeekLayout({ children, map, params }: WeekLayoutProps) {
  const { week: raw } = await params;
  const today = currentEventDay(new Date());
  const { week, valid } = weekFromPath(raw, today);
  if (!valid || raw !== week) redirect(schoolsHref(week));

  return (
    <main className={styles.page}>
      <WeekShell week={week} today={today} map={map}>
        {children}
      </WeekShell>
      <BackToTop />
    </main>
  );
}
