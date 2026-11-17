import { localityIdSchema, type LocalityId } from '@events/contract/localities';

/** Miejscowość and Zasięg in the URL (stage 3.8): `?miejscowosc=<SIMC>&zasieg=25`. */
export const LOCALITY_PARAM = 'miejscowosc';
export const RADIUS_PARAM = 'zasieg';

/** 0 = only venues in the Miejscowość itself, not a distance from its centre. */
export const RADII_KM = [0, 5, 10, 15, 25, 50, 75, 100] as const;
export type RadiusKm = (typeof RADII_KM)[number];
export const DEFAULT_RADIUS_KM: RadiusKm = 25;

export interface Place {
  readonly localityId: LocalityId;
  readonly radiusKm: RadiusKm;
}

function isRadius(value: number): value is RadiusKm {
  return (RADII_KM as readonly number[]).includes(value);
}

/** A bad id means no Miejscowość; a bad radius falls back to the default, so a shared link still works. */
export function parsePlace(locality: string, radius: string): Place | null {
  const id = localityIdSchema.safeParse(locality);
  if (!id.success) return null;
  const km = radius === '' ? Number.NaN : Number(radius);
  return { localityId: id.data, radiusKm: isRadius(km) ? km : DEFAULT_RADIUS_KM };
}

/** The radius one step wider, for "Powiększ do …"; null at the widest. */
export function widerRadius(radiusKm: RadiusKm): RadiusKm | null {
  return RADII_KM[RADII_KM.indexOf(radiusKm) + 1] ?? null;
}
