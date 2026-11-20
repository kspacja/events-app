/** The visitor's last keyword searches, in this browser only; storage may be blocked, so every access is guarded. */
const KEY = 'events.recentSearches';
const LIMIT = 5;

export function readRecent(): readonly string[] {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(stored) ? stored.filter((item): item is string => typeof item === 'string').slice(0, LIMIT) : [];
  } catch {
    return [];
  }
}

/** Moves the keywords to the top and returns the new list. */
export function rememberRecent(keywords: string): readonly string[] {
  const text = keywords.trim();
  const next = [text, ...readRecent().filter((item) => item.toLowerCase() !== text.toLowerCase())].slice(0, LIMIT);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Not kept: the search itself still works
  }
  return next;
}
