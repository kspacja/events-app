import { NextResponse, type NextRequest } from 'next/server';
import { searchQuerySchema } from '@events/contract/search';
import { suggest } from '@/features/schoolSearch/searchSource';
import { logger } from '@/lib/logger';

/** Organizer and venue hints for the search box; the browser asks here, the server asks the events API (or MSW). */
export async function GET(request: NextRequest) {
  const parsed = searchQuerySchema.safeParse({ q: request.nextUrl.searchParams.get('q') ?? undefined });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  try {
    return NextResponse.json(await suggest(parsed.data.q));
  } catch (error: unknown) {
    logger.error('Search suggestions failed', { error });
    return NextResponse.json({ error: 'Search is temporarily unavailable.' }, { status: 502 });
  }
}
