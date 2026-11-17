import { NextResponse, type NextRequest } from 'next/server';
import { localitiesQuerySchema } from '@events/contract/localities';
import { searchLocalities } from '@/features/locality/localitySource';
import { logger } from '@/lib/logger';

/** Hints for the Miejscowość picker; the browser asks here, the server asks the events API (or MSW). */
export async function GET(request: NextRequest) {
  const parsed = localitiesQuerySchema.safeParse({ q: request.nextUrl.searchParams.get('q') ?? undefined });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  try {
    return NextResponse.json(await searchLocalities(parsed.data.q));
  } catch (error: unknown) {
    logger.error('Locality search failed', { error });
    return NextResponse.json({ error: 'Search is temporarily unavailable.' }, { status: 502 });
  }
}
