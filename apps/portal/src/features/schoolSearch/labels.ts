export const SEARCH_LABELS = {
  trigger: 'Szukaj wydarzeń, organizatorów, miejsc',
  dialog: 'Wyszukiwarka',
  input: 'Czego szukasz?',
  placeholder: 'np. film, muzeum, Hala Stulecia',
  close: 'Zamknij wyszukiwarkę',
  intro: 'Wpisz słowo kluczowe, nazwę organizatora albo miejsca.',
  recent: 'Ostatnio szukane',
  keywordsGroup: 'Słowa kluczowe',
  organizers: 'Organizatorzy',
  venues: 'Miejsca',
  nearby: 'w Twojej okolicy',
  wholeCountry: 'w całej Polsce',
  noHints: 'Brak organizatorów i miejsc o tej nazwie — poszukaj w wydarzeniach.',
  hintsFailed: 'Podpowiedzi chwilowo nie działają.',
  resultsTitle: 'Wyniki wyszukiwania',
  venueFallback: 'Miejsce',
  empty: 'Nic nie znaleźliśmy w najbliższych 60 dniach.',
  upcoming: 'Najbliższe wydarzenia',
  aboutOrganizer: 'O organizatorze',
  organizerSoon: 'Opis organizatora i kontakt pojawią się tutaj wkrótce.',
  forSchools: 'Dla szkół',
  location: 'Lokalizacja',
  website: 'Strona internetowa',
  map: (name: string) => `Mapa: ${name}`,
  backToCalendar: 'Wróć do kalendarza',
} as const;

/** „Szukaj „film”” — the keywords quoted the Polish way. */
export function searchForLabel(keywords: string): string {
  return `Szukaj „${keywords.trim()}”`;
}

export function resultsForLabel(keywords: string): string {
  return `Wyniki dla „${keywords.trim()}”`;
}

const plural = new Intl.PluralRules('pl');

/** „1 wydarzenie”, „3 wydarzenia”, „12 wydarzeń”. */
export function countLabel(count: number): string {
  const form = plural.select(count);
  const word = form === 'one' ? 'wydarzenie' : form === 'few' ? 'wydarzenia' : 'wydarzeń';
  return `${count} ${word}`;
}
