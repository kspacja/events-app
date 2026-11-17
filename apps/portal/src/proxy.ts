import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_RADIUS_KM, LOCALITY_PARAM, RADIUS_PARAM, type Place } from '@/features/locality/place';
import {
  GUESSED_COOKIE,
  MOCK_GUESS,
  PLACE_COOKIE,
  RADIUS_COOKIE,
  rememberedPlace,
  WHOLE_COUNTRY,
} from '@/features/locality/placeCookies';

/** Real IP guessing comes with the API's nearest-city lookup (step F); until then only MSW guesses. */
function guess(): Place | null {
  return process.env.API_MOCKING === 'enabled' ? { localityId: MOCK_GUESS, radiusKm: DEFAULT_RADIUS_KM } : null;
}

function withPlace(request: NextRequest, place: Place): URL {
  const url = request.nextUrl.clone();
  url.searchParams.set(LOCALITY_PARAM, place.localityId);
  url.searchParams.set(RADIUS_PARAM, String(place.radiusKm));
  return url;
}

/**
 * The schools month without a Miejscowość in the URL starts where the visitor left off, or at a guess.
 * Redirecting keeps the place in the URL, which every part of the page reads.
 */
export function proxy(request: NextRequest) {
  if (request.nextUrl.searchParams.has(LOCALITY_PARAM)) return NextResponse.next();

  const remembered = rememberedPlace(request.cookies.get(PLACE_COOKIE)?.value, request.cookies.get(RADIUS_COOKIE)?.value);
  if (remembered === WHOLE_COUNTRY) return NextResponse.next();
  if (remembered) return NextResponse.redirect(withPlace(request, remembered));

  const guessed = guess();
  if (!guessed) return NextResponse.next();
  const response = NextResponse.redirect(withPlace(request, guessed));
  // A session cookie: the "is this right?" note shows until a choice or the browser closes
  response.cookies.set(GUESSED_COOKIE, guessed.localityId, { path: '/', sameSite: 'lax' });
  return response;
}

export const config = {
  matcher: '/dla-szkol/miesiac/:path*',
};
