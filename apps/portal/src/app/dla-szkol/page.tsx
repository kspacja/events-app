import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { currentEventDay, mondayOf } from '@events/time';
import { schoolsHref } from '@/features/schools/schoolsHref';

export default async function SchoolsIndex() {
  // The current week depends on the request's date, not the build's
  await connection();
  redirect(schoolsHref(mondayOf(currentEventDay(new Date()))));
}
