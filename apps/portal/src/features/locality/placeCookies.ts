import type { LocalityId } from '@events/contract/localities';
import { parsePlace, type Place } from './place';

/** The last chosen place, so the next visit starts there (stage 3.8). */
export const PLACE_COOKIE = 'miejscowosc';
export const RADIUS_COOKIE = 'zasieg';
/** Set when the place was guessed rather than chosen; the picker then asks whether it is right. */
export const GUESSED_COOKIE = 'miejscowosc-zgadnieta';
/** In the place cookie: all of Poland was chosen on purpose, so nothing is guessed. */
export const WHOLE_COUNTRY = 'cala-polska';
export const PLACE_COOKIE_MAX_AGE_S = 365 * 24 * 60 * 60;

/** On MSW (locally and on Vercel) the guess is always Wrocław. */
export const MOCK_GUESS: LocalityId = '0986283';

export type RememberedPlace = Place | typeof WHOLE_COUNTRY | null;

export function rememberedPlace(place: string | undefined, radius: string | undefined): RememberedPlace {
  if (place === WHOLE_COUNTRY) return WHOLE_COUNTRY;
  return parsePlace(place ?? '', radius ?? '');
}

function readCookie(name: string): string | undefined {
  const prefix = `${name}=`;
  return document.cookie
    .split('; ')
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
}

function writeCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

/** Browser only: the guessed Miejscowość still waiting for "Zgadza się" or a choice. */
export function guessedLocality(): string | undefined {
  return readCookie(GUESSED_COOKIE);
}

/** Browser only: keeps a choice for the next visit and ends the guess. */
export function rememberPlace(place: Place | null) {
  writeCookie(PLACE_COOKIE, place ? place.localityId : WHOLE_COUNTRY, PLACE_COOKIE_MAX_AGE_S);
  if (place) writeCookie(RADIUS_COOKIE, String(place.radiusKm), PLACE_COOKIE_MAX_AGE_S);
  writeCookie(GUESSED_COOKIE, '', 0);
}
