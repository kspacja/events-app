export type FontKind = 'sans' | 'serif' | 'display';

export interface FontOption {
  readonly family: string;
  readonly kind: FontKind;
  /** Google Fonts `wght` list — asking for a weight the font lacks fails the whole request. */
  readonly weights: string;
  /** Set when the font has no latin-ext subset, so ą, ę, ł… fall back to another font. */
  readonly noPolish?: true;
}

export const FONT_KIND_LABELS: Readonly<Record<FontKind, string>> = {
  sans: 'Bezszeryfowe',
  serif: 'Szeryfowe',
  display: 'Ozdobne (nagłówki)',
};

/** Google Fonts offered in the theme lab; loaded on demand, dev only. */
export const FONT_OPTIONS: readonly FontOption[] = [
  { family: 'Inter', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Manrope', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Space Grotesk', kind: 'sans', weights: '400;500;600;700' },
  { family: 'Work Sans', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Outfit', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'IBM Plex Sans', kind: 'sans', weights: '400;500;600;700' },
  { family: 'Plus Jakarta Sans', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Poppins', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Montserrat', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Nunito Sans', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Rubik', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Karla', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Figtree', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Lexend', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Sora', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Urbanist', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Archivo', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Barlow', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Public Sans', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Source Sans 3', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Open Sans', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Lato', kind: 'sans', weights: '400;700' },
  { family: 'Roboto', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Noto Sans', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Red Hat Display', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Schibsted Grotesk', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Instrument Sans', kind: 'sans', weights: '400;500;600;700' },
  { family: 'Hanken Grotesk', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Albert Sans', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Onest', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Geist', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'DM Sans', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Bricolage Grotesque', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Familjen Grotesk', kind: 'sans', weights: '400;500;600;700' },
  { family: 'Atkinson Hyperlegible', kind: 'sans', weights: '400;700' },
  { family: 'Mulish', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'League Spartan', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Libre Franklin', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Josefin Sans', kind: 'sans', weights: '400;500;600;700' },
  { family: 'Quicksand', kind: 'sans', weights: '400;500;600;700' },
  { family: 'Fraunces', kind: 'serif', weights: '400;500;600;700;800' },
  { family: 'Playfair Display', kind: 'serif', weights: '400;500;600;700;800' },
  { family: 'Lora', kind: 'serif', weights: '400;500;600;700' },
  { family: 'Merriweather', kind: 'serif', weights: '400;500;600;700;800' },
  { family: 'DM Serif Display', kind: 'serif', weights: '400' },
  { family: 'Instrument Serif', kind: 'serif', weights: '400' },
  { family: 'Libre Baskerville', kind: 'serif', weights: '400;700' },
  { family: 'Cormorant Garamond', kind: 'serif', weights: '400;500;600;700' },
  { family: 'EB Garamond', kind: 'serif', weights: '400;500;600;700;800' },
  { family: 'Source Serif 4', kind: 'serif', weights: '400;500;600;700;800' },
  { family: 'Newsreader', kind: 'serif', weights: '400;500;600;700;800' },
  { family: 'Young Serif', kind: 'serif', weights: '400' },
  { family: 'Bitter', kind: 'serif', weights: '400;500;600;700;800' },
  { family: 'Crimson Pro', kind: 'serif', weights: '400;500;600;700;800' },
  { family: 'Koulen', kind: 'display', weights: '400', noPolish: true },
  { family: 'Bebas Neue', kind: 'display', weights: '400' },
  { family: 'Anton', kind: 'display', weights: '400' },
  { family: 'Oswald', kind: 'display', weights: '400;500;600;700' },
  { family: 'Archivo Black', kind: 'display', weights: '400' },
  { family: 'Syne', kind: 'display', weights: '400;500;600;700;800' },
  { family: 'Unbounded', kind: 'display', weights: '400;500;600;700;800' },
  { family: 'Righteous', kind: 'display', weights: '400' },
  { family: 'Abril Fatface', kind: 'display', weights: '400' },
  { family: 'Big Shoulders Display', kind: 'display', weights: '400;500;600;700;800' },
  { family: 'Dela Gothic One', kind: 'display', weights: '400' },
  { family: 'Bowlby One', kind: 'display', weights: '400', noPolish: true },
  { family: 'Alfa Slab One', kind: 'display', weights: '400' },
  { family: 'Rubik Mono One', kind: 'display', weights: '400' },
];

const GENERIC: Readonly<Record<FontKind, string>> = { sans: 'sans-serif', serif: 'serif', display: 'sans-serif' };

export function fontOption(family: string): FontOption | undefined {
  return FONT_OPTIONS.find((font) => font.family === family);
}

export function fontStack(font: FontOption): string {
  return `"${font.family}", ${GENERIC[font.kind]}`;
}

/** Font from a stack written by `fontStack`, or undefined for the original next/font stack. */
export function fontOf(stack: string): FontOption | undefined {
  const match = /^"([^"]+)"/.exec(stack.trim());
  return match ? fontOption(match[1]) : undefined;
}

export function googleFontsHref(font: FontOption): string {
  return `https://fonts.googleapis.com/css2?family=${font.family.replace(/ /g, '+')}:wght@${font.weights}&display=swap`;
}
