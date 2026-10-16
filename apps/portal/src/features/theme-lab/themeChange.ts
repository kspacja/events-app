/** Fired on window after the theme lab changes token overrides. */
export const THEME_CHANGE_EVENT = 'theme-lab:change';

export function onThemeChange(listener: () => void): () => void {
  window.addEventListener(THEME_CHANGE_EVENT, listener);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, listener);
}
