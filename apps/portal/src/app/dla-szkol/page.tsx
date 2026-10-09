import { redirect } from 'next/navigation';
import { currentEventDay, mondayOf } from '@events/time';
import { schoolsHref } from '@/features/schools/schoolsHref';

export default function SchoolsIndex() {
  redirect(schoolsHref(mondayOf(currentEventDay(new Date()))));
}
