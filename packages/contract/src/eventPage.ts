import { z } from 'zod';
import { occurrenceListingSchema } from './listing';

/** The event page (stage 3.11); only MSW answers `GET /events/:id` for now. */

const texts = z.array(z.string().min(1)).readonly();

export const eventPageDetailsSchema = z
  .object({
    /** Photos beside the event's own image. */
    gallery: z.array(z.string()).readonly(),
    video: z.object({ title: z.string().min(1), posterUrl: z.string() }).readonly().optional(),
    /** Shown right under the description, e.g. when to come and where to leave coats. */
    arrivalNote: z.string().optional(),
    learningGoals: texts,
    curriculum: z
      .object({ area: z.string().min(1), grades: z.string().min(1), description: z.string() })
      .readonly()
      .optional(),
    /** Suited to groups with special needs: a label on the page. */
    specialNeeds: z.boolean(),
    durationMinutes: z.number().int().positive().optional(),
    maxParticipants: z.number().int().positive().optional(),
    guardians: z.string().optional(),
    reservationRequired: z.boolean(),
    contact: z
      .object({ name: z.string().min(1), role: z.string(), email: z.string(), phone: z.string() })
      .readonly()
      .optional(),
    materials: z.array(z.object({ label: z.string().min(1), url: z.string() }).readonly()).readonly(),
    practicalInfo: texts,
    accessibility: texts,
    faq: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) }).readonly()).readonly(),
  })
  .readonly();

export const SIMILAR_EVENTS_LIMIT = 8;

export const eventPageResponseSchema = z.object({
  /** Every known occurrence of the event, soonest first; at least one, or the API answers 404. */
  occurrences: z.array(occurrenceListingSchema).min(1),
  details: eventPageDetailsSchema.optional(),
  /** The next occurrence of each similar event, best match first. */
  similar: z.array(occurrenceListingSchema).max(SIMILAR_EVENTS_LIMIT),
});

export type EventPageDetails = z.infer<typeof eventPageDetailsSchema>;
export type EventPage = z.infer<typeof eventPageResponseSchema>;
