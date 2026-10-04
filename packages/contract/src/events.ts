import { z } from 'zod';
import { diffInDays, isCalendarDay } from '@events/time';
import { CATEGORY_SLUGS } from './categories';

export const MAX_DAYS_PER_REQUEST = 31;

export const eventCategorySchema = z.enum(CATEGORY_SLUGS);

export const venueSchema = z
  .object({
    name: z.string(),
    city: z.string(),
    lat: z.number(),
    lng: z.number(),
  })
  .readonly();

export const eventSchema = z
  .object({
    id: z.string(),
    startsAt: z.iso.datetime({ offset: true }),
    title: z.string(),
    venue: venueSchema,
    category: eventCategorySchema,
    imageUrl: z.string().optional(),
  })
  .readonly();

export const eventsResponseSchema = z.object({ events: z.array(eventSchema) });

export const EVENTS_QUERY_ERRORS = {
  missing: 'Query parameters "from" and "to" are required.',
  format: 'Parameters "from" and "to" must be YYYY-MM-DD dates.',
  order: '"from" must not be after "to".',
  tooLong: `The range must not exceed ${MAX_DAYS_PER_REQUEST} days.`,
} as const;

const calendarDaySchema = z
  .string({ error: EVENTS_QUERY_ERRORS.missing })
  .refine(isCalendarDay, { error: EVENTS_QUERY_ERRORS.format });

export const eventsQuerySchema = z
  .object({ from: calendarDaySchema, to: calendarDaySchema })
  .check((ctx) => {
    const { from, to } = ctx.value;
    const length = diffInDays(from, to);
    if (length < 0) {
      ctx.issues.push({
        code: 'custom',
        message: EVENTS_QUERY_ERRORS.order,
        input: ctx.value,
      });
    } else if (length + 1 > MAX_DAYS_PER_REQUEST) {
      ctx.issues.push({
        code: 'custom',
        message: EVENTS_QUERY_ERRORS.tooLong,
        input: ctx.value,
      });
    }
  });
