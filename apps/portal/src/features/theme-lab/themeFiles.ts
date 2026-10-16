import 'server-only';
import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isSlug, parseTheme, type Theme } from './themeTokens';

// next dev runs from apps/portal; the endpoint is dev-only, so the repo layout is a safe assumption
const THEMES_DIR = path.resolve(process.cwd(), '../../packages/ui/src/themes');

function fileOf(slug: string): string {
  if (!isSlug(slug)) throw new Error(`Invalid theme slug: ${slug}`);
  return path.join(THEMES_DIR, `${slug}.json`);
}

export async function listThemes(): Promise<Theme[]> {
  let files: string[];
  try {
    files = await readdir(THEMES_DIR);
  } catch {
    return [];
  }
  const themes = await Promise.all(
    files
      .filter((file) => file.endsWith('.json') && isSlug(file.slice(0, -5)))
      .map(async (file): Promise<Theme | null> => {
        try {
          const theme = parseTheme(JSON.parse(await readFile(path.join(THEMES_DIR, file), 'utf8')));
          return theme && { slug: file.slice(0, -5), ...theme };
        } catch {
          return null;
        }
      }),
  );
  return themes.filter((t): t is Theme => t !== null).sort((a, b) => a.name.localeCompare(b.name, 'pl'));
}

export async function saveTheme(theme: Theme): Promise<void> {
  await mkdir(THEMES_DIR, { recursive: true });
  const body = { name: theme.name, tokens: theme.tokens };
  await writeFile(fileOf(theme.slug), `${JSON.stringify(body, null, 2)}\n`);
}

/** False when there was no such theme. */
export async function deleteTheme(slug: string): Promise<boolean> {
  try {
    await unlink(fileOf(slug));
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}
