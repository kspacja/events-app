import { z } from 'zod';

/** Miejscowość from PRNG (stage 3.8); the id is its TERYT SIMC identifier, since names repeat. */
export const localityIdSchema = z.string().regex(/^\d{7}$/);

export const localityKindSchema = z.enum(['city', 'village', 'settlement', 'colony']);

export const localitySchema = z
  .object({
    id: localityIdSchema,
    name: z.string().min(1),
    kind: localityKindSchema,
    commune: z.string(),
    county: z.string(),
    voivodeship: z.string(),
    lat: z.number(),
    lng: z.number(),
  })
  .readonly();

export type LocalityId = z.infer<typeof localityIdSchema>;
export type Locality = z.infer<typeof localitySchema>;

export const LOCALITY_QUERY_MIN_LENGTH = 2;
export const LOCALITY_HINTS_LIMIT = 8;

export const LOCALITIES_QUERY_ERRORS = {
  q: `Parameter "q" must have at least ${LOCALITY_QUERY_MIN_LENGTH} characters.`,
} as const;

export const localitiesQuerySchema = z.object({
  q: z
    .string({ error: LOCALITIES_QUERY_ERRORS.q })
    .trim()
    .min(LOCALITY_QUERY_MIN_LENGTH, { error: LOCALITIES_QUERY_ERRORS.q }),
});

/** Hints for the picker; `total` counts every match, so the picker can ask for a narrower query. */
export const localitiesResponseSchema = z.object({
  localities: z.array(localitySchema).max(LOCALITY_HINTS_LIMIT),
  total: z.number().int().nonnegative(),
});

export const localityResponseSchema = z.object({ locality: localitySchema });

/** `GET /localities/nearest?lat=&lng=`: the Miejscowość of any kind closest to a point, e.g. the browser's location. */
export const nearestLocalityQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});
