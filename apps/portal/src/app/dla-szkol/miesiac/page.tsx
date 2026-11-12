import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { currentEventDay } from '@events/time';
import { monthOf } from '@/features/schools/monthCalendar';
import { schoolsMonthHref } from '@/features/schools/schoolsHref';

export default async function MonthIndex() {
  // The current month depends on the request's date, not the build's
  await connection();
  redirect(schoolsMonthHref(monthOf(currentEventDay(new Date()))));
}
