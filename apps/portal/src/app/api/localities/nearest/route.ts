import { NextResponse, type NextRequest } from 'next/server';
import { nearestLocalityQuerySchema } from '@events/contract/localities';
import { nearestLocality } from '@/features/locality/localitySource';
import { logger } from '@/lib/logger';

/** "Użyj mojej lokalizacji": the browser sends its point, the answer is the closest Miejscowość of any kind. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const point = nearestLocalityQuerySchema.safeParse({ lat: params.get('lat') ?? undefined, lng: params.get('lng') ?? undefined });
  if (!point.success) return NextResponse.json({ error: 'Parameters "lat" and "lng" must be coordinates.' }, { status: 400 });
  try {
    const locality = await nearestLocality(point.data);
    if (!locality) return NextResponse.json({ error: 'Locality not found.' }, { status: 404 });
    return NextResponse.json({ locality });
  } catch (error: unknown) {
    logger.error('Nearest locality lookup failed', { error });
    return NextResponse.json({ error: 'Lookup is temporarily unavailable.' }, { status: 502 });
  }
}
