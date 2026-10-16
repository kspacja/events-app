import { NextResponse, type NextRequest } from 'next/server';
import { deleteTheme, listThemes, saveTheme } from '@/features/theme-lab/themeFiles';
import { isSlug, parseTheme, slugify } from '@/features/theme-lab/themeTokens';

/** Theme lab storage: writes into the repo, so it only exists under `next dev`. */
const enabled = process.env.NODE_ENV === 'development';

const notFound = () => NextResponse.json({ error: 'not found' }, { status: 404 });

export async function GET() {
  if (!enabled) return notFound();
  return NextResponse.json(await listThemes());
}

export async function PUT(request: NextRequest) {
  if (!enabled) return notFound();
  const theme = parseTheme(await request.json().catch(() => null));
  const slug = theme ? slugify(theme.name) : '';
  if (!theme || !isSlug(slug)) {
    return NextResponse.json({ error: 'expected { name, tokens } with a usable name' }, { status: 400 });
  }
  await saveTheme({ slug, ...theme });
  return NextResponse.json({ slug, ...theme });
}

export async function DELETE(request: NextRequest) {
  if (!enabled) return notFound();
  const slug = request.nextUrl.searchParams.get('slug') ?? '';
  if (!isSlug(slug)) return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
  return (await deleteTheme(slug)) ? new NextResponse(null, { status: 204 }) : notFound();
}
