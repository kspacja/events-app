import type { Locality } from '@events/contract/localities';
import type { RadiusKm } from './place';

export const LOCALITY_LABELS = {
  wholeCountry: 'Cała Polska',
  dialog: 'Wybierz miejscowość',
  search: 'Miejscowość',
  searchPlaceholder: 'np. Wrocław albo Nowa Wieś',
  tooShort: 'Wpisz co najmniej 2 litery.',
  noHints: 'Nie znamy takiej miejscowości.',
  searchFailed: 'Wyszukiwanie chwilowo nie działa.',
  useMyLocation: 'Użyj mojej lokalizacji',
  locating: 'Szukamy Twojej lokalizacji…',
  locationDenied: 'Bez zgody przeglądarki nie znamy Twojej lokalizacji. Wpisz miejscowość.',
  locationFailed: 'Nie udało się ustalić lokalizacji. Wpisz miejscowość.',
  guessConfirm: 'Zgadza się',
  guessChange: 'Zmień',
  radiusLegend: (name: string) => `Zasięg od: ${name}`,
  source: 'Opracowano na podstawie materiałów państwowego zasobu geodezyjnego i kartograficznego.',
} as const;

const KIND_LABELS: Readonly<Record<Locality['kind'], string>> = {
  city: 'miasto',
  village: 'wieś',
  settlement: 'osada',
  colony: 'kolonia',
};

export function kindLabel(kind: Locality['kind']): string {
  return KIND_LABELS[kind];
}

/** "gm. Tyczyn, pow. rzeszowski"; a city county ("Wrocław") is named by its voivodeship instead. */
export function whereLabel({ commune, county, voivodeship, name }: Locality): string {
  if (county === name || county === commune) return voivodeship;
  return `gm. ${commune}, pow. ${county}`;
}

/** On the picker's button: "do 25 km", or "tylko tu" for the Miejscowość alone. */
export function radiusLabel(radiusKm: RadiusKm): string {
  return radiusKm === 0 ? 'tylko tu' : `do ${radiusKm} km`;
}

/** A radius option in the filters: "tylko Wrocław", "25 km". */
export function radiusOptionLabel(radiusKm: RadiusKm, name: string): string {
  return radiusKm === 0 ? `tylko ${name}` : `${radiusKm} km`;
}

export function guessedLabel(name: string): string {
  return `Pokazujemy okolice: ${name} — tak wynika z Twojego połączenia.`;
}

export function hintsTotalLabel(more: number): string {
  return `i ${more} innych — dopisz gminę albo powiat, np. „nowa wieś tyczyn”`;
}

/** "od Sobótki" needs a genitive we do not have; "od miejscowości Sobótka" keeps the name as it is. */
export function emptyInPlaceLabel(name: string, radiusKm: RadiusKm): string {
  return radiusKm === 0
    ? `Brak wydarzeń w miejscowości ${name}`
    : `Brak wydarzeń w promieniu ${radiusKm} km od miejscowości ${name}`;
}

export function widenLabel(radiusKm: RadiusKm): string {
  return `Powiększ do ${radiusKm} km`;
}
