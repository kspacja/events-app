import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import {
  CONTROL_GROUPS,
  channelsToHex,
  hexToChannels,
  parseHex,
  parseOverrides,
  parseTheme,
  slugify,
  themeCss,
} from './themeTokens';
import { FONT_OPTIONS, fontOf, fontOption, fontStack } from './fontOptions';

const tokensCss = readFileSync(createRequire(import.meta.url).resolve('@events/ui/tokens.css'), 'utf8');

describe('theme lab controls', () => {
  it.each(CONTROL_GROUPS.flatMap((g) => g.controls.map((c) => c.token)))('%s exists in tokens.css', (token) => {
    expect(tokensCss).toMatch(new RegExp(`${token}\\s*:`));
  });
});

describe('parseOverrides', () => {
  it('accepts token names with string values', () => {
    expect(parseOverrides({ '--space-unit': '5px', '--font-body': '"Inter", sans-serif' })).toEqual({
      '--space-unit': '5px',
      '--font-body': '"Inter", sans-serif',
    });
  });

  it.each([
    ['a non-token key', { color: 'red' }],
    ['a value closing the declaration', { '--color-bg': 'red; } body { display: none' }],
    ['markup in a value', { '--color-bg': '</style>' }],
    ['a non-string value', { '--space-unit': 4 }],
    ['an array', ['--space-unit']],
  ])('rejects %s', (_, input) => {
    expect(parseOverrides(input)).toBeNull();
  });
});

describe('parseTheme', () => {
  it('trims the name', () => {
    expect(parseTheme({ name: '  Ciemny ', tokens: {} })).toEqual({ name: 'Ciemny', tokens: {} });
  });

  it('rejects a blank name', () => {
    expect(parseTheme({ name: '  ', tokens: {} })).toBeNull();
  });
});

describe('slugify', () => {
  it('keeps file names to ascii letters, digits and dashes', () => {
    expect(slugify('Żółty łuk — wersja 2')).toBe('zolty-luk-wersja-2');
  });

  it('cannot produce a path', () => {
    expect(slugify('../../etc/passwd')).toBe('etc-passwd');
  });
});

describe('themeCss', () => {
  it('renders a :root block to paste into tokens.css', () => {
    expect(themeCss({ '--space-unit': '5px' })).toBe(':root {\n  --space-unit: 5px;\n}\n');
  });
});

describe('parseHex', () => {
  it.each([
    ['#1D4ED8', '#1d4ed8'],
    ['1d4ed8', '#1d4ed8'],
    ['#abc', '#aabbcc'],
    [' #abc ', '#aabbcc'],
  ])('reads %s', (input, expected) => {
    expect(parseHex(input)).toBe(expected);
  });

  it.each(['', '#12', '#1234', 'red', '#ggg'])('rejects %s', (input) => {
    expect(parseHex(input)).toBeNull();
  });
});

describe('colour conversions', () => {
  it('round-trips shadow channels through hex', () => {
    expect(channelsToHex('28 27 25')).toBe('#1c1b19');
    expect(hexToChannels('#1c1b19')).toBe('28 27 25');
  });
});

describe('fontOf', () => {
  it('reads back a font the panel wrote', () => {
    const font = fontOption('Koulen');
    expect(font && fontOf(fontStack(font))).toBe(font);
  });

  it('treats the original next/font stack as no override', () => {
    expect(fontOf('var(--font-albert-sans), "Helvetica Neue", sans-serif')).toBeUndefined();
  });

  it('lists every family once', () => {
    const families = FONT_OPTIONS.map((font) => font.family);
    expect(new Set(families).size).toBe(families.length);
  });
});
