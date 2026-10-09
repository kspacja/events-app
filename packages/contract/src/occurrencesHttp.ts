import { z } from 'zod';
import { diffInDays, isCalendarDay } from '@events/time';
import { occurrenceListingSchema } from './listing';

/** HTTP transport of the occurrence listing; only the API route, the portal's HTTP adapter and its mock import this. */
export const MAX_DAYS_PER_REQUEST = 31;

export const occurrencesResponseSchema = z.object({
  occurrences: z.array(occurrenceListingSchema),
});

export const OCCURRENCES_QUERY_ERRORS = {
  missing: 'Query parameters "from" and "to" are required.',
  format: 'Parameters "from" and "to" must be YYYY-MM-DD dates.',
  order: '"from" must not be after "to".',
  tooLong: `The range must not exceed ${MAX_DAYS_PER_REQUEST} days.`,
} as const;

const calendarDaySchema = z
  .string({ error: OCCURRENCES_QUERY_ERRORS.missing })
  .refine(isCalendarDay, { error: OCCURRENCES_QUERY_ERRORS.format });

export const occurrencesQuerySchema = z
  .object({ from: calendarDaySchema, to: calendarDaySchema })
  .check((ctx) => {
    const { from, to } = ctx.value;
    const length = diffInDays(from, to);
    if (length < 0) {
      ctx.issues.push({
        code: 'custom',
        message: OCCURRENCES_QUERY_ERRORS.order,
        input: ctx.value,
      });
    } else if (length + 1 > MAX_DAYS_PER_REQUEST) {
      ctx.issues.push({
        code: 'custom',
        message: OCCURRENCES_QUERY_ERRORS.tooLong,
        input: ctx.value,
      });
    }
  });
