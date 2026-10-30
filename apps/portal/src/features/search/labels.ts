import { MAX_CUSTOM_RANGE_DAYS, type DatePreset } from './dateRange';
import type { TimePreset } from './timeRange';

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: 'dziś',
  tomorrow: 'jutro',
  week: 'w tym tygodniu',
  weekend: 'w weekend',
  nextWeek: 'w przyszłym tygodniu',
};

export const RANGE_NAVIGATION_LABELS = {
  previous: 'Wcześniejszy termin',
  next: 'Późniejszy termin',
} as const;

export const CUSTOM_RANGE_LABEL = 'własny przedział';

export const SENTENCE_LABELS = {
  lead: 'Pokaż mi',
  category: 'wszystko',
  place: 'wszędzie',
  time: 'o każdej porze',
} as const;

export const DATE_PICKER_LABELS = {
  dialog: 'Wybierz termin',
  presets: 'Gotowe terminy',
  from: 'od',
  to: 'do',
  submit: 'Pokaż',
} as const;

export const DATE_ERROR_MESSAGES = {
  'invalid-preset': 'Wybierz termin z listy.',
  'invalid-format': 'Wybierz obie daty.',
  'invalid-order': 'Data „od” nie może być późniejsza niż „do”.',
  'range-too-long': `Przedział może mieć najwyżej ${MAX_CUSTOM_RANGE_DAYS} dni.`,
} as const;

export const INVALID_RANGE_NOTICE =
  'Nieprawidłowy zakres dat — pokazujemy bieżący tydzień.';

export const TIME_PRESET_LABELS: Record<TimePreset, string> = {
  morning: 'rano',
  noon: 'w południe',
  afternoon: 'po południu',
  evening: 'wieczorem',
  night: 'w nocy',
};

export const TIME_PICKER_LABELS = {
  dialog: 'Wybierz porę dnia',
  presets: 'Pory dnia',
  all: SENTENCE_LABELS.time,
  from: 'od',
  to: 'do',
  submit: 'Pokaż',
} as const;

export const TIME_ERROR_MESSAGES = {
  'invalid-preset': 'Wybierz porę dnia z listy.',
  'invalid-format': 'Wybierz godzinę „od”.',
  'same-time': 'Godziny „od” i „do” nie mogą być takie same.',
} as const;

export const INVALID_TIME_NOTICE =
  'Nieprawidłowa pora dnia — pokazujemy wszystkie godziny.';

export const INVALID_SEARCH_NOTICE =
  'Nieprawidłowe parametry wyszukiwania — pokazujemy bieżący tydzień i wszystkie godziny.';
