import type { Organizer } from '@events/contract/listing';

/** Prototype (stage 3.10): Organizatorzy of the sample school events; only MSW knows them. */
const ORGANIZERS = {
  wcek: { slug: 'wroclawskie-centrum-edukacji-kulturalnej', name: 'Wrocławskie Centrum Edukacji Kulturalnej' },
  muzeum: { slug: 'muzeum-sztuki-dawnej', name: 'Muzeum Sztuki Dawnej' },
  odkrywcy: { slug: 'fundacja-mlodzi-odkrywcy', name: 'Fundacja Młodzi Odkrywcy' },
  krakow: { slug: 'krakowski-dom-kultury', name: 'Krakowski Dom Kultury' },
  pomorze: { slug: 'pomorskie-centrum-nauki', name: 'Pomorskie Centrum Nauki' },
  poznan: { slug: 'poznanska-akademia-tworcza', name: 'Poznańska Akademia Twórcza' },
  sciezki: { slug: 'stowarzyszenie-dolnoslaskie-sciezki', name: 'Stowarzyszenie Dolnośląskie Ścieżki' },
} as const satisfies Record<string, Organizer>;

export const SAMPLE_ORGANIZERS: readonly Organizer[] = Object.values(ORGANIZERS);

/** Keyed by event id. */
export const SAMPLE_EVENT_ORGANIZERS: Readonly<Record<string, Organizer>> = {
  'wro-school-concert': ORGANIZERS.wcek,
  'krk-school-history': ORGANIZERS.krakow,
  'wro-school-museum': ORGANIZERS.muzeum,
  'wro-school-science': ORGANIZERS.odkrywcy,
  'wro-school-ceramics': ORGANIZERS.wcek,
  'wro-school-organ': ORGANIZERS.muzeum,
  'wro-school-walk': ORGANIZERS.wcek,
  'gdn-school-port': ORGANIZERS.pomorze,
  'poz-school-photo': ORGANIZERS.poznan,
  'wro-school-theatre': ORGANIZERS.wcek,
  'wro-school-botany': ORGANIZERS.odkrywcy,
  'krk-school-maths': ORGANIZERS.krakow,
  'gdn-school-physics': ORGANIZERS.pomorze,
  'gdn-school-film': ORGANIZERS.pomorze,
  'wro-school-sports': ORGANIZERS.wcek,
  'wro-school-coding': ORGANIZERS.odkrywcy,
  'poz-school-writing': ORGANIZERS.poznan,
  'wro-school-chemistry': ORGANIZERS.odkrywcy,
  'krk-school-english': ORGANIZERS.krakow,
  'wro-school-astronomy': ORGANIZERS.odkrywcy,
  'krk-school-legends': ORGANIZERS.krakow,
  'wro-school-choir': ORGANIZERS.wcek,
  'gdn-school-amber': ORGANIZERS.pomorze,
  'wro-school-bridges': ORGANIZERS.wcek,
  'poz-school-comics': ORGANIZERS.poznan,
  'krk-school-debate': ORGANIZERS.krakow,
  'wro-school-recycling': ORGANIZERS.odkrywcy,
  'gdn-school-sea': ORGANIZERS.pomorze,
  'poz-school-poetry': ORGANIZERS.poznan,
  'wro-school-zoo': ORGANIZERS.odkrywcy,
  'krk-school-concert': ORGANIZERS.krakow,
  'kob-school-farm': ORGANIZERS.sciezki,
  'dlu-school-forest': ORGANIZERS.sciezki,
  'sob-school-sleza': ORGANIZERS.sciezki,
  'sie-school-energy': ORGANIZERS.odkrywcy,
};
