import type { OccurrenceId } from '@events/contract/listing';
import type { CalendarDay } from '@events/time';

export const SCHEDULE_SECTION_ID = 'program';

export function dayDomId(day: CalendarDay): string {
  return `day-${day}`;
}

export function occurrenceDomId(occurrenceId: OccurrenceId): string {
  return `occurrence-${occurrenceId}`;
}
