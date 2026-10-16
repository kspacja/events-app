'use client';

import dynamic from 'next/dynamic';

// The static NODE_ENV check lets the production build drop the panel chunk entirely
const ThemeLab =
  process.env.NODE_ENV === 'development' ? dynamic(() => import('./ThemeLab'), { ssr: false }) : () => null;

export function ThemeLabLoader() {
  return <ThemeLab />;
}
