import { z } from 'zod';
import { organizerSchema } from './listing';

/** Search on the schools pages (stage 3.10); only MSW answers for now. */
export const SEARCH_QUERY_MIN_LENGTH = 2;
export const SEARCH_HINTS_LIMIT = 5;

export const SEARCH_QUERY_ERRORS = {
  q: `Parameter "q" must have at least ${SEARCH_QUERY_MIN_LENGTH} characters.`,
} as const;

export const searchQuerySchema = z.object({
  q: z.string({ error: SEARCH_QUERY_ERRORS.q }).trim().min(SEARCH_QUERY_MIN_LENGTH, { error: SEARCH_QUERY_ERRORS.q }),
});

/** Prototype: the id is the name and city as one slug, until the listing's venue carries its own id. */
export const venueHintSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().min(1),
    city: z.string(),
  })
  .readonly();

/** `GET /search/suggestions?q=`: organizers and venues whose name matches, for autocompletion. */
export const suggestionsResponseSchema = z.object({
  organizers: z.array(organizerSchema).max(SEARCH_HINTS_LIMIT),
  venues: z.array(venueHintSchema).max(SEARCH_HINTS_LIMIT),
});

/** What the organizer page shows beside its events (stage 3.10); only MSW sends it for now. */
export const organizerProfileSchema = z
  .object({
    /** e.g. "Fundacja", "Muzeum", "Dom kultury". */
    kind: z.string().min(1),
    description: z.string(),
    address: z.string().min(1),
    postalCode: z.string(),
    city: z.string().min(1),
    lat: z.number(),
    lng: z.number(),
    website: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
  })
  .readonly();

/** `GET /organizers/:slug`. */
export const organizerResponseSchema = z.object({ organizer: organizerSchema, profile: organizerProfileSchema.optional() });

export type OrganizerProfile = z.infer<typeof organizerProfileSchema>;

export type VenueHint = z.infer<typeof venueHintSchema>;
export type Suggestions = z.infer<typeof suggestionsResponseSchema>;
