import { THEME_CHANGE_EVENT } from './themeChange';
import { FONT_OPTIONS, fontOf, googleFontsHref, type FontOption } from './fontOptions';
import { slugify, type TokenOverrides } from './themeTokens';

export const STORAGE_KEY = 'theme-lab';

/** What the browser remembers between reloads: the picked theme and unsaved edits on top of tokens.css. */
export interface StoredState {
  readonly slug: string | null;
  readonly tokens: TokenOverrides;
}

export function readStoredState(): StoredState {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (parsed && typeof parsed === 'object' && 'tokens' in parsed) return parsed as StoredState;
  } catch {
    // Corrupted entry — fall back to the original look
  }
  return { slug: null, tokens: {} };
}

export function writeStoredState(state: StoredState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function fontLinkId(family: string): string {
  return `theme-lab-font-${slugify(family)}`;
}

function ensureFont(font: FontOption): void {
  const id = fontLinkId(font.family);
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = googleFontsHref(font);
  document.head.append(link);
}

function customPropertiesOf(style: CSSStyleDeclaration): string[] {
  return Array.from(style).filter((name) => name.startsWith('--'));
}

/** Replaces every override on <html> so tokens.css shows through wherever none is set. */
export function applyOverrides(tokens: TokenOverrides): void {
  const style = document.documentElement.style;
  for (const name of customPropertiesOf(style)) style.removeProperty(name);
  for (const [name, value] of Object.entries(tokens)) {
    style.setProperty(name, value);
    const font = fontOf(value);
    if (font) ensureFont(font);
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

/** Values from tokens.css, read with overrides briefly lifted (no paint happens in between). */
export function readOriginalValues(names: readonly string[]): Record<string, string> {
  const style = document.documentElement.style;
  const saved = customPropertiesOf(style).map((name) => [name, style.getPropertyValue(name)] as const);
  for (const [name] of saved) style.removeProperty(name);
  const computed = getComputedStyle(document.documentElement);
  const values = Object.fromEntries(names.map((name) => [name, computed.getPropertyValue(name).trim()]));
  for (const [name, value] of saved) style.setProperty(name, value);
  return values;
}

const FONT_HREFS = Object.fromEntries(FONT_OPTIONS.map((font) => [font.family, [fontLinkId(font.family), googleFontsHref(font)]]));

/** Runs inline in <head> before first paint, so a stored theme never flashes the original. */
export const BOOTSTRAP_SCRIPT = `(function(){try{
var s=JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||"null");if(!s||!s.tokens)return;
var F=${JSON.stringify(FONT_HREFS)},r=document.documentElement.style;
for(var k in s.tokens){var v=s.tokens[k];r.setProperty(k,v);var m=/^"([^"]+)"/.exec(v),f=m&&F[m[1]];
if(f){var l=document.createElement("link");l.id=f[0];l.rel="stylesheet";l.href=f[1];document.head.appendChild(l);}}
}catch(e){}})();`;
