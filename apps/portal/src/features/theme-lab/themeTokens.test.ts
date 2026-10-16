import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import {
  CONTROL_GROUPS,
  channelsToHex,
  familyOf,
  fontStack,
  hexToChannels,
  parseOverrides,
  parseTheme,
  slugify,
  themeCss,
} from './themeTokens';

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

describe('colour conversions', () => {
  it('round-trips shadow channels through hex', () => {
    expect(channelsToHex('28 27 25')).toBe('#1c1b19');
    expect(hexToChannels('#1c1b19')).toBe('28 27 25');
  });
});

describe('familyOf', () => {
  it('reads a family the panel offers', () => {
    expect(familyOf(fontStack('Space Grotesk'))).toBe('Space Grotesk');
  });

  it('treats the original next/font stack as no override', () => {
    expect(familyOf('var(--font-dm-sans), "Helvetica Neue", sans-serif')).toBeNull();
  });
});
