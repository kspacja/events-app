import type { FontKind } from './fontOptions';

/** Token overrides on top of tokens.css — the original itself is never stored. */
export type TokenOverrides = Readonly<Record<string, string>>;

export interface Theme {
  readonly slug: string;
  readonly name: string;
  readonly tokens: TokenOverrides;
}

export interface RangeControl {
  readonly kind: 'range';
  readonly token: string;
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly unit: 'px' | '';
}

export interface ColorControl {
  readonly kind: 'color';
  readonly token: string;
  readonly label: string;
  /** Stored as space-separated RGB channels, e.g. `28 27 25`. */
  readonly channels?: true;
}

export interface FontControl {
  readonly kind: 'font';
  readonly token: string;
  readonly label: string;
  readonly kinds: readonly FontKind[];
}

export type Control = RangeControl | ColorControl | FontControl;

export interface ControlGroup {
  readonly title: string;
  readonly controls: readonly Control[];
}

const color = (token: string, label: string): ColorControl => ({ kind: 'color', token, label });

export const CONTROL_GROUPS: readonly ControlGroup[] = [
  {
    title: 'Spacing',
    controls: [{ kind: 'range', token: '--space-unit', label: 'Baza', min: 2, max: 8, step: 0.25, unit: 'px' }],
  },
  {
    title: 'Typografia',
    controls: [
      { kind: 'range', token: '--text-base', label: 'Rozmiar bazowy', min: 11, max: 20, step: 0.25, unit: 'px' },
      { kind: 'range', token: '--text-ratio', label: 'Skala (ratio)', min: 1.05, max: 1.4, step: 0.005, unit: '' },
      { kind: 'font', token: '--font-heading', label: 'Krój nagłówków', kinds: ['sans', 'serif', 'display'] },
      { kind: 'font', token: '--font-body', label: 'Krój tekstu', kinds: ['sans'] },
    ],
  },
  {
    title: 'Cienie',
    controls: [
      { kind: 'range', token: '--shadow-strength', label: 'Siła', min: 0, max: 3, step: 0.05, unit: '' },
      { kind: 'range', token: '--shadow-scale', label: 'Zasięg', min: 0, max: 3, step: 0.05, unit: '' },
      { kind: 'color', token: '--shadow-color', label: 'Kolor', channels: true },
    ],
  },
  {
    title: 'Promienie',
    controls: [{ kind: 'range', token: '--radius-unit', label: 'Baza', min: 0, max: 10, step: 0.25, unit: 'px' }],
  },
  {
    title: 'Kolory',
    controls: [
      color('--color-text', 'Tekst'),
      color('--color-text-secondary', 'Tekst 2'),
      color('--color-text-tertiary', 'Tekst 3'),
      color('--color-text-muted', 'Tekst wyciszony'),
      color('--color-text-disabled', 'Tekst wyłączony'),
      color('--color-accent', 'Akcent'),
      color('--color-accent-strong', 'Akcent mocny'),
      color('--color-accent-soft', 'Akcent miękki'),
      color('--color-accent-soft-hover', 'Akcent miękki (hover)'),
      color('--color-on-accent', 'Na akcencie'),
      color('--color-bg', 'Tło'),
      color('--color-bg-subtle', 'Tło subtelne'),
      color('--color-surface', 'Powierzchnia'),
      color('--color-bg-weekday', 'Dzień roboczy'),
      color('--color-bg-weekend', 'Weekend'),
      color('--color-border', 'Obramowanie'),
      color('--color-map-water', 'Woda na mapie'),
    ],
  },
  {
    title: 'Kategorie',
    controls: ['music', 'film', 'food', 'movement', 'workshops', 'art', 'meetups', 'comedy'].map((slug) =>
      color(`--category-${slug}`, slug),
    ),
  },
];

export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

const TOKEN_NAME = /^--[a-z0-9-]+$/;
// Values land in a style attribute and a CSS export, so nothing that could close a declaration
const UNSAFE_VALUE = /[;{}<>\\]/;

export function isSlug(value: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value) && value.length <= 60;
}

/** Valid overrides from untrusted input, or null. */
export function parseOverrides(input: unknown): TokenOverrides | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return null;
  const entries = Object.entries(input);
  if (entries.length > 200) return null;
  for (const [key, value] of entries) {
    if (!TOKEN_NAME.test(key) || typeof value !== 'string' || value.length > 200 || UNSAFE_VALUE.test(value)) {
      return null;
    }
  }
  return Object.fromEntries(entries) as TokenOverrides;
}

export function parseTheme(input: unknown): Omit<Theme, 'slug'> | null {
  if (typeof input !== 'object' || input === null) return null;
  const { name, tokens } = input as Record<string, unknown>;
  if (typeof name !== 'string' || name.trim() === '' || name.length > 60) return null;
  const overrides = parseOverrides(tokens);
  return overrides && { name: name.trim(), tokens: overrides };
}

/** `:root` block ready to paste into tokens.css. */
export function themeCss(tokens: TokenOverrides): string {
  const lines = Object.entries(tokens).map(([key, value]) => `  ${key}: ${value};`);
  return `:root {\n${lines.join('\n')}\n}\n`;
}

export function channelsToHex(channels: string): string {
  const parts = channels.trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return '#000000';
  return `#${parts.map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

export function hexToChannels(hex: string): string {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)).join(' ');
}

export function asHexColor(value: string): string {
  const v = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(v)) return v;
  if (/^#[0-9a-f]{3}$/.test(v)) return `#${[...v.slice(1)].map((c) => c + c).join('')}`;
  return '#000000';
}
