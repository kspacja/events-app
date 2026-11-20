export const EVENT_PAGE_LABELS = {
  breadcrumbs: 'Ścieżka',
  schools: 'Dla szkół',
  specialNeeds: 'Dla grup ze szczególnymi potrzebami',
  gallery: 'Zdjęcia i film',
  showPhoto: (n: number) => `Pokaż zdjęcie ${n}`,
  playVideo: (title: string) => `Odtwórz film: ${title}`,
  videoSoon: 'Film pojawi się wkrótce.',
  closeVideo: 'Zamknij film',
  about: 'O wydarzeniu',
  goals: 'Czego uczniowie się nauczą?',
  curriculum: 'Powiązanie z podstawą programową',
  materials: 'Materiały dla nauczyciela',
  practical: 'Informacje praktyczne',
  accessibility: 'Dostępność',
  faq: 'Najczęstsze pytania',
  available: 'Dostępne terminy',
  unavailable: 'Niedostępne terminy',
  past: 'To wydarzenie już się odbyło.',
  reservation: 'Wymagana wcześniejsza rezerwacja',
  contact: 'Skontaktuj się',
  save: 'Dodaj do zapisanych',
  saved: 'Zapisane',
  contactPerson: 'Osoba do kontaktu',
  location: 'Lokalizacja',
  lines: 'Koło nas zatrzymują się:',
  directions: 'Wyznacz trasę w Google Maps',
  newTab: '(otwiera się w nowej karcie)',
  similar: 'Podobne wydarzenia',
  map: (venue: string) => `Mapa: ${venue}`,
} as const;

const plural = new Intl.PluralRules('pl');

function pick(count: number, one: string, few: string, many: string): string {
  const form = plural.select(count);
  return form === 'one' ? one : form === 'few' ? few : many;
}

export function durationLabel(minutes: number): string {
  if (minutes % 60 === 0 && minutes >= 60) {
    const hours = minutes / 60;
    return `${hours} ${pick(hours, 'godzina', 'godziny', 'godzin')}`;
  }
  return `${minutes} ${pick(minutes, 'minuta', 'minuty', 'minut')}`;
}

export function participantsLabel(max: number): string {
  return `do ${max} ${pick(max, 'osoby', 'osób', 'osób')}`;
}
