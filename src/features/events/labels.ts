import type { EventCategory } from './types';

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  music: 'Muzyka',
  film: 'Film',
  food: 'Jedzenie',
  movement: 'Ruch',
  workshops: 'Warsztaty',
  art: 'Sztuka',
  meetups: 'Spotkania',
  comedy: 'Komedia',
};

export const COUNT_LABELS = {
  zero: 'Brak wydarzeń w tym terminie',
  one: 'wydarzenie',
  few: 'wydarzenia',
  many: 'wydarzeń',
} as const;

export const DAY_NAMES = [
  'Poniedziałek',
  'Wtorek',
  'Środa',
  'Czwartek',
  'Piątek',
  'Sobota',
  'Niedziela',
] as const;

export const UI_LABELS = {
  logo: 'wydarzenia',
  logoLabel: 'Wydarzenia, strona główna',
  schedule: 'Program',
  emptyDay: 'Tego dnia nic pasującego.',
  outOfRange: 'Poza wybranym zakresem.',
  backToTop: 'Na górę',
} as const;

export const CARD_LABELS = {
  showOnMap: 'Pokaż na mapie',
  outsideRange: '(poza wybranym terminem)',
} as const;

export const STATE_LABELS = {
  loading: 'Wczytujemy wydarzenia…',
  error: 'Nie udało się wczytać wydarzeń. Spróbuj ponownie.',
  retry: 'Spróbuj ponownie',
} as const;

export const MAP_LABELS = {
  region: 'Mapa wydarzeń',
  show: 'Mapa',
  hide: 'Ukryj mapę',
  description: 'Te same wydarzenia są dostępne na liście poniżej.',
  skipToList: 'Przejdź do listy wydarzeń',
} as const;

export const MAP_CONTROL_LOCALE = {
  'NavigationControl.ZoomIn': 'Przybliż',
  'NavigationControl.ZoomOut': 'Oddal',
  'Popup.Close': 'Zamknij',
  'Map.Title': 'Mapa wydarzeń',
} as const;
