export const COUNT_LABELS = {
  zero: 'Brak wydarzeń w tym terminie',
  one: 'wydarzenie',
  few: 'wydarzenia',
  many: 'wydarzeń',
} as const;

export const DAY_SHORT_NAMES = ['pon', 'wt', 'śr', 'czw', 'pt', 'sob', 'niedz'] as const;

export const STRIP_LABELS = {
  earlierDays: 'Przewiń o 3 dni wstecz',
  laterDays: 'Przewiń o 3 dni dalej',
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
  open: 'Pokaż mapę',
  close: 'Zamknij mapę',
  showInWeek: 'pokaż w programie tygodnia',
  description: 'Te same wydarzenia są dostępne na liście poniżej.',
  skipToList: 'Przejdź do listy wydarzeń',
} as const;

export const MAP_CONTROL_LOCALE = {
  'NavigationControl.ZoomIn': 'Przybliż',
  'NavigationControl.ZoomOut': 'Oddal',
  'Popup.Close': 'Zamknij',
  'Map.Title': 'Mapa wydarzeń',
} as const;
