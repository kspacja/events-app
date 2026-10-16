import { eventIdSchema, occurrenceIdSchema, type Category, type Price } from '@events/contract/listing';
import { addDays, currentEventDay, mondayOf, warsawIsoAt } from '@events/time';
import { createEventsData, venueId, type EventsData, type Event, type Occurrence, type Venue } from './model';

const WROCLAW = 'Wrocław';

const MUSIC: Category = { slug: 'music', label: 'Muzyka' };
const FILM: Category = { slug: 'film', label: 'Film' };
const FOOD: Category = { slug: 'food', label: 'Jedzenie' };
const MOVEMENT: Category = { slug: 'movement', label: 'Ruch' };
const WORKSHOPS: Category = { slug: 'workshops', label: 'Warsztaty' };
const ART: Category = { slug: 'art', label: 'Sztuka' };
const MEETUPS: Category = { slug: 'meetups', label: 'Spotkania' };
const COMEDY: Category = { slug: 'comedy', label: 'Komedia' };

const SAMPLE_CATEGORIES: readonly Category[] = [MUSIC, FILM, FOOD, MOVEMENT, WORKSHOPS, ART, MEETUPS, COMEDY];

const venue = (id: string, name: string, address: string, city: string, lat: number, lng: number): Venue => ({
  id: venueId(id),
  name,
  address,
  city,
  location: { lat, lng },
});

const OSTROW_TUMSKI = venue('ostrow-tumski', 'Ostrów Tumski', 'pl. Katedralny 18', WROCLAW, 51.1142, 17.0465);
const OSTROW_TUMSKI_BRZEG = venue('ostrow-tumski-brzeg', 'Ostrów Tumski', 'ul. św. Idziego 2', WROCLAW, 51.1150, 17.0450);
const MUZEUM_NARODOWE = venue('muzeum-narodowe', 'Muzeum Narodowe', 'pl. Powstańców Warszawy 5', WROCLAW, 51.1100, 17.0480);
const SRODMIESCIE = venue('srodmiescie', 'Śródmieście', 'ul. Świdnicka 20', WROCLAW, 51.0980, 17.0330);
const RYNEK = venue('rynek', 'Rynek', 'Rynek 1', WROCLAW, 51.1100, 17.0320);
const NADODRZE = venue('nadodrze', 'Nadodrze', 'ul. Jedności Narodowej 59', WROCLAW, 51.1240, 17.0290);
const NADODRZE_PODWORKA = venue('nadodrze-podworka', 'Nadodrze', 'ul. Roosevelta 5', WROCLAW, 51.1250, 17.0300);
const BULWAR_DUNIKOWSKIEGO = venue('bulwar-dunikowskiego', 'Bulwar Dunikowskiego', 'Bulwar Xawerego Dunikowskiego', WROCLAW, 51.1135, 17.0420);
const WYSPA_SLODOWA = venue('wyspa-slodowa', 'Wyspa Słodowa', 'Wyspa Słodowa', WROCLAW, 51.1130, 17.0380);
const HALA_STULECIA = venue('hala-stulecia', 'Hala Stulecia', 'ul. Wystawowa 1', WROCLAW, 51.1067, 17.0770);
const OLBIN = venue('olbin', 'Ołbin', 'ul. Nowowiejska 51', WROCLAW, 51.1190, 17.0460);
const KOSCIOL_PRZY_RYNKU = venue('kosciol-przy-rynku', 'Kościół przy Rynku', 'ul. św. Elżbiety 1', WROCLAW, 51.1095, 17.0335);
const PIWNICA_POD_BARANAMI = venue('piwnica-pod-baranami', 'Piwnica pod Baranami', 'Rynek Główny 27', 'Kraków', 50.0616, 19.9372);
const KAZIMIERZ = venue('kazimierz', 'Kazimierz', 'ul. Szeroka 6', 'Kraków', 50.0515, 19.9445);
const PLAC_NOWY = venue('plac-nowy', 'Plac Nowy', 'pl. Nowy 4', 'Kraków', 50.0521, 19.9446);
const PLAZA_JELITKOWO = venue('plaza-jelitkowo', 'Plaża Jelitkowo', 'ul. Kąpielowa 1', 'Gdańsk', 54.4217, 18.5780);
const DLUGIE_POBRZEZE = venue('dlugie-pobrzeze', 'Długie Pobrzeże', 'Długie Pobrzeże 14', 'Gdańsk', 54.3503, 18.6580);
const STARY_RYNEK = venue('stary-rynek', 'Stary Rynek', 'Stary Rynek 1', 'Poznań', 52.4082, 16.9335);
const GALERIA_JEZYCE = venue('galeria-jezyce', 'Galeria Jeżyce', 'ul. Kraszewskiego 10', 'Poznań', 52.4170, 16.9000);
const PASAZ_NIEPOLDA = venue('pasaz-niepolda', 'Pasaż Niepolda', 'ul. Ruska 51', WROCLAW, 51.1103, 17.0222);
const OLOWIANKA = venue('olowianka', 'Ołowianka', 'ul. Ołowianka 1', 'Gdańsk', 54.3490, 18.6650);

const SAMPLE_VENUES: readonly Venue[] = [
  OSTROW_TUMSKI,
  OSTROW_TUMSKI_BRZEG,
  MUZEUM_NARODOWE,
  SRODMIESCIE,
  RYNEK,
  NADODRZE,
  NADODRZE_PODWORKA,
  BULWAR_DUNIKOWSKIEGO,
  WYSPA_SLODOWA,
  HALA_STULECIA,
  OLBIN,
  KOSCIOL_PRZY_RYNKU,
  PIWNICA_POD_BARANAMI,
  KAZIMIERZ,
  PLAC_NOWY,
  PLAZA_JELITKOWO,
  DLUGIE_POBRZEZE,
  STARY_RYNEK,
  GALERIA_JEZYCE,
  PASAZ_NIEPOLDA,
  OLOWIANKA,
];

const free: Price = { kind: 'free' };

const paid = (from: number, to: number | null = null): Price => ({
  kind: 'paid',
  from,
  to,
  currency: 'PLN',
});

interface SampleEventTemplate {
  readonly id: string;
  readonly title: string;
  /** The first is the main category. */
  readonly categories: readonly [Category, ...Category[]];
  readonly venue: Venue;
  readonly price?: Price;
  /** Days since Monday: 0..6 */
  readonly dayOffset: number;
  /** Local time, `HH:mm` */
  readonly time: string;
  readonly forSchools?: true;
}

// Placeholder photos for testing: seeded by event id, so each event keeps its own picture; 2× the card size
const sampleImageUrl = (eventId: string) => `https://picsum.photos/seed/${eventId}/480/208`;

// Order matters: the skip cycle below is keyed by the template index
const SAMPLE_EVENTS: readonly SampleEventTemplate[] = [
  { id: 'wro-choir', title: 'Koncert chóralny w katedrze', categories: [MUSIC], venue: OSTROW_TUMSKI, dayOffset: 0, time: '19:00', price: free },
  { id: 'wro-exhibition', title: 'Wystawa: miasto po zmroku', categories: [ART], venue: MUZEUM_NARODOWE, dayOffset: 1, time: '18:00', price: paid(15) },
  { id: 'wro-boardgames', title: 'Wieczór gier planszowych', categories: [MEETUPS], venue: SRODMIESCIE, dayOffset: 2, time: '18:30' },
  { id: 'wro-standup', title: 'Stand-up w piwnicy', categories: [COMEDY], venue: RYNEK, dayOffset: 3, time: '20:00' },
  { id: 'wro-courtyard', title: 'Koncert w podwórku', categories: [MUSIC], venue: NADODRZE, dayOffset: 3, time: '21:30' },
  { id: 'wro-jazz', title: 'Jazz nad Odrą', categories: [MUSIC], venue: BULWAR_DUNIKOWSKIEGO, dayOffset: 4, time: '19:00', price: paid(40, 80) },
  { id: 'wro-cinema', title: 'Kino plenerowe', categories: [FILM], venue: WYSPA_SLODOWA, dayOffset: 4, time: '20:30', price: free },
  { id: 'wro-market', title: 'Targ producentów', categories: [FOOD, MEETUPS], venue: HALA_STULECIA, dayOffset: 5, time: '10:00', price: free },
  { id: 'wro-walk', title: 'Spacer po podwórkach', categories: [MOVEMENT, ART], venue: NADODRZE_PODWORKA, dayOffset: 5, time: '14:00' },
  { id: 'wro-run', title: 'Nocny bieg', categories: [MOVEMENT], venue: OSTROW_TUMSKI_BRZEG, dayOffset: 5, time: '21:00' },
  { id: 'wro-ceramics', title: 'Warsztaty ceramiki', categories: [WORKSHOPS], venue: OLBIN, dayOffset: 6, time: '12:00' },
  { id: 'wro-organ', title: 'Recital organowy', categories: [MUSIC], venue: KOSCIOL_PRZY_RYNKU, dayOffset: 6, time: '18:00' },

  { id: 'krk-jazz', title: 'Jazz w piwnicy', categories: [MUSIC, MEETUPS], venue: PIWNICA_POD_BARANAMI, dayOffset: 1, time: '20:00', price: paid(30, 60) },
  { id: 'krk-standup', title: 'Stand-up na Kazimierzu', categories: [COMEDY], venue: KAZIMIERZ, dayOffset: 3, time: '19:30' },
  { id: 'krk-market', title: 'Targ śniadaniowy', categories: [FOOD], venue: PLAC_NOWY, dayOffset: 5, time: '11:00' },
  { id: 'gdn-cinema', title: 'Kino na plaży', categories: [FILM], venue: PLAZA_JELITKOWO, dayOffset: 4, time: '21:00' },
  { id: 'gdn-run', title: 'Bieg nad Motławą', categories: [MOVEMENT], venue: DLUGIE_POBRZEZE, dayOffset: 6, time: '09:00' },
  { id: 'poz-workshop', title: 'Warsztaty fotograficzne', categories: [WORKSHOPS, ART], venue: STARY_RYNEK, dayOffset: 2, time: '17:00' },
  { id: 'poz-art', title: 'Wernisaż na Jeżycach', categories: [ART], venue: GALERIA_JEZYCE, dayOffset: 4, time: '18:00' },

  { id: 'wro-club', title: 'Nocny set w klubie', categories: [MUSIC], venue: PASAZ_NIEPOLDA, dayOffset: 4, time: '23:00', price: paid(25) },
  { id: 'krk-latenight', title: 'Nocny stand-up po północy', categories: [COMEDY], venue: PLAC_NOWY, dayOffset: 6, time: '01:30', price: paid(20, 35) },
  { id: 'gdn-afterparty', title: 'Afterparty na Ołowiance', categories: [MUSIC], venue: OLOWIANKA, dayOffset: 5, time: '01:00' },

  // Events for schools; Wednesday has 5 in the first week (later weeks skip one), enough for the "+n" day marker
  { id: 'wro-school-concert', title: 'Koncert edukacyjny', categories: [MUSIC], venue: HALA_STULECIA, dayOffset: 0, time: '10:00', price: free, forSchools: true },
  { id: 'krk-school-history', title: 'Lekcja historii na Kazimierzu', categories: [MEETUPS], venue: KAZIMIERZ, dayOffset: 1, time: '10:00', price: free, forSchools: true },
  { id: 'wro-school-museum', title: 'Lekcja muzealna: sztuka średniowiecza', categories: [ART], venue: MUZEUM_NARODOWE, dayOffset: 2, time: '09:00', price: free, forSchools: true },
  { id: 'wro-school-science', title: 'Pokaz naukowy dla klas 4–6', categories: [WORKSHOPS], venue: HALA_STULECIA, dayOffset: 2, time: '10:00', price: paid(12), forSchools: true },
  { id: 'wro-school-ceramics', title: 'Warsztaty ceramiki dla szkół', categories: [WORKSHOPS, ART], venue: OLBIN, dayOffset: 2, time: '11:00', price: paid(15), forSchools: true },
  { id: 'wro-school-organ', title: 'Lekcja o organach', categories: [MUSIC], venue: KOSCIOL_PRZY_RYNKU, dayOffset: 2, time: '12:00', price: free, forSchools: true },
  { id: 'wro-school-walk', title: 'Spacer historyczny po Rynku', categories: [MOVEMENT], venue: RYNEK, dayOffset: 2, time: '12:30', price: free, forSchools: true },
  { id: 'gdn-school-port', title: 'Lekcja w porcie', categories: [MOVEMENT], venue: DLUGIE_POBRZEZE, dayOffset: 3, time: '09:30', forSchools: true },
  { id: 'poz-school-photo', title: 'Fotografia dla klas 7–8', categories: [WORKSHOPS, ART], venue: GALERIA_JEZYCE, dayOffset: 4, time: '11:00', price: paid(10), forSchools: true },
];

// Every template occurs in the first week, so these are the first week's sizes
export const SAMPLE_GENERAL_OCCURRENCES_IN_FIRST_WEEK = SAMPLE_EVENTS.filter(({ forSchools }) => !forSchools).length;
export const SAMPLE_SCHOOL_OCCURRENCES_IN_FIRST_WEEK = SAMPLE_EVENTS.filter(({ forSchools }) => forSchools).length;

const GENERATED_WEEKS = 5;
const DAYS_IN_WEEK = 7;
const MINUTES_PER_HOUR = 60;
const SKIP_CYCLE = 4;
const SKIPPED_REMAINDER = 3;

function minutesOfClock(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * MINUTES_PER_HOUR + minutes;
}

function isSkipped(weekIndex: number, templateIndex: number): boolean {
  return weekIndex > 0 && (weekIndex + templateIndex) % SKIP_CYCLE === SKIPPED_REMAINDER;
}

/** Sample data for the current event-day week and the 4 after it, so it never goes stale. */
export function createSampleEvents(now: Date): EventsData {
  const firstMonday = mondayOf(currentEventDay(now));

  const events: Event[] = SAMPLE_EVENTS.map(({ id, title, categories, forSchools = false }) => ({
    id: eventIdSchema.parse(id),
    title,
    categorySlugs: categories.map(({ slug }) => slug),
    imageUrl: sampleImageUrl(id),
    forSchools,
  }));

  const occurrences = Array.from({ length: GENERATED_WEEKS }, (_, weekIndex) =>
    SAMPLE_EVENTS.flatMap((template, templateIndex): Occurrence[] => {
      if (isSkipped(weekIndex, templateIndex)) return [];
      const day = addDays(firstMonday, weekIndex * DAYS_IN_WEEK + template.dayOffset);
      return [
        {
          id: occurrenceIdSchema.parse(`${template.id}-${day}`),
          eventId: eventIdSchema.parse(template.id),
          venueId: template.venue.id,
          startsAt: warsawIsoAt(day, minutesOfClock(template.time)),
          price: template.price ?? null,
        },
      ];
    }),
  ).flat();

  return createEventsData({ categories: SAMPLE_CATEGORIES, venues: SAMPLE_VENUES, events, occurrences });
}
