/**
 * Google Maps directions to a point, by public transport; the start is left to Google (the visitor's location).
 * Later, a signed-in teacher's school address becomes the origin.
 */
export function directionsHref({ lat, lng }: { readonly lat: number; readonly lng: number }): string {
  const params = new URLSearchParams({ api: '1', destination: `${lat},${lng}`, travelmode: 'transit' });
  return `https://www.google.com/maps/dir/?${params}`;
}
