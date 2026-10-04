import { eventIdSchema, occurrenceIdSchema, type Category, type Price } from '@events/contract/listing';
import { addDays, currentEventDay, mondayOf, warsawIsoAt } from '@events/time';
import { createCatalog, venueId, type Catalog, type Event, type Occurrence, type Venue } from './model';

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

const venue = (id: string, name: string, city: string, lat: number, lng: number): Venue => ({
  id: venueId(id),
  name,
  city,
  location: { lat, lng },
});

const OSTROW_TUMSKI = venue('ostrow-tumski', 'Ostrów Tumski', WROCLAW, 51.1142, 17.0465);
const OSTROW_TUMSKI_BRZEG = venue('ostrow-tumski-brzeg', 'Ostrów Tumski', WROCLAW, 51.1150, 17.0450);
const MUZEUM_NARODOWE = venue('muzeum-narodowe', 'Muzeum Narodowe', WROCLAW, 51.1100, 17.0480);
const SRODMIESCIE = venue('srodmiescie', 'Śródmieście', WROCLAW, 51.0980, 17.0330);
const RYNEK = venue('rynek', 'Rynek', WROCLAW, 51.1100, 17.0320);
const NADODRZE = venue('nadodrze', 'Nadodrze', WROCLAW, 51.1240, 17.0290);
const NADODRZE_PODWORKA = venue('nadodrze-podworka', 'Nadodrze', WROCLAW, 51.1250, 17.0300);
const BULWAR_DUNIKOWSKIEGO = venue('bulwar-dunikowskiego', 'Bulwar Dunikowskiego', WROCLAW, 51.1135, 17.0420);
const WYSPA_SLODOWA = venue('wyspa-slodowa', 'Wyspa Słodowa', WROCLAW, 51.1130, 17.0380);
const HALA_STULECIA = venue('hala-stulecia', 'Hala Stulecia', WROCLAW, 51.1067, 17.0770);
const OLBIN = venue('olbin', 'Ołbin', WROCLAW, 51.1190, 17.0460);
const KOSCIOL_PRZY_RYNKU = venue('kosciol-przy-rynku', 'Kościół przy Rynku', WROCLAW, 51.1095, 17.0335);
const PIWNICA_POD_BARANAMI = venue('piwnica-pod-baranami', 'Piwnica pod Baranami', 'Kraków', 50.0616, 19.9372);
const KAZIMIERZ = venue('kazimierz', 'Kazimierz', 'Kraków', 50.0515, 19.9445);
const PLAC_NOWY = venue('plac-nowy', 'Plac Nowy', 'Kraków', 50.0521, 19.9446);
const PLAZA_JELITKOWO = venue('plaza-jelitkowo', 'Plaża Jelitkowo', 'Gdańsk', 54.4217, 18.5780);
const DLUGIE_POBRZEZE = venue('dlugie-pobrzeze', 'Długie Pobrzeże', 'Gdańsk', 54.3503, 18.6580);
const STARY_RYNEK = venue('stary-rynek', 'Stary Rynek', 'Poznań', 52.4082, 16.9335);
const GALERIA_JEZYCE = venue('galeria-jezyce', 'Galeria Jeżyce', 'Poznań', 52.4170, 16.9000);
const PASAZ_NIEPOLDA = venue('pasaz-niepolda', 'Pasaż Niepolda', WROCLAW, 51.1103, 17.0222);
const OLOWIANKA = venue('olowianka', 'Ołowianka', 'Gdańsk', 54.3490, 18.6650);

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
  readonly category: Category;
  readonly venue: Venue;
  readonly price?: Price;
  /** Days since Monday: 0..6 */
  readonly dayOffset: number;
  /** Local time, `HH:mm` */
  readonly time: string;
}

// Order matters: the skip cycle below is keyed by the template index
const SAMPLE_EVENTS: readonly SampleEventTemplate[] = [
  { id: 'wro-choir', title: 'Koncert chóralny w katedrze', category: MUSIC, venue: OSTROW_TUMSKI, dayOffset: 0, time: '19:00', price: free },
  { id: 'wro-exhibition', title: 'Wystawa: miasto po zmroku', category: ART, venue: MUZEUM_NARODOWE, dayOffset: 1, time: '18:00', price: paid(15) },
  { id: 'wro-boardgames', title: 'Wieczór gier planszowych', category: MEETUPS, venue: SRODMIESCIE, dayOffset: 2, time: '18:30' },
  { id: 'wro-standup', title: 'Stand-up w piwnicy', category: COMEDY, venue: RYNEK, dayOffset: 3, time: '20:00' },
  { id: 'wro-courtyard', title: 'Koncert w podwórku', category: MUSIC, venue: NADODRZE, dayOffset: 3, time: '21:30' },
  { id: 'wro-jazz', title: 'Jazz nad Odrą', category: MUSIC, venue: BULWAR_DUNIKOWSKIEGO, dayOffset: 4, time: '19:00', price: paid(40, 80) },
  { id: 'wro-cinema', title: 'Kino plenerowe', category: FILM, venue: WYSPA_SLODOWA, dayOffset: 4, time: '20:30', price: free },
  { id: 'wro-market', title: 'Targ producentów', category: FOOD, venue: HALA_STULECIA, dayOffset: 5, time: '10:00', price: free },
  { id: 'wro-walk', title: 'Spacer po podwórkach', category: MOVEMENT, venue: NADODRZE_PODWORKA, dayOffset: 5, time: '14:00' },
  { id: 'wro-run', title: 'Nocny bieg', category: MOVEMENT, venue: OSTROW_TUMSKI_BRZEG, dayOffset: 5, time: '21:00' },
  { id: 'wro-ceramics', title: 'Warsztaty ceramiki', category: WORKSHOPS, venue: OLBIN, dayOffset: 6, time: '12:00' },
  { id: 'wro-organ', title: 'Recital organowy', category: MUSIC, venue: KOSCIOL_PRZY_RYNKU, dayOffset: 6, time: '18:00' },

  { id: 'krk-jazz', title: 'Jazz w piwnicy', category: MUSIC, venue: PIWNICA_POD_BARANAMI, dayOffset: 1, time: '20:00', price: paid(30, 60) },
  { id: 'krk-standup', title: 'Stand-up na Kazimierzu', category: COMEDY, venue: KAZIMIERZ, dayOffset: 3, time: '19:30' },
  { id: 'krk-market', title: 'Targ śniadaniowy', category: FOOD, venue: PLAC_NOWY, dayOffset: 5, time: '11:00' },
  { id: 'gdn-cinema', title: 'Kino na plaży', category: FILM, venue: PLAZA_JELITKOWO, dayOffset: 4, time: '21:00' },
  { id: 'gdn-run', title: 'Bieg nad Motławą', category: MOVEMENT, venue: DLUGIE_POBRZEZE, dayOffset: 6, time: '09:00' },
  { id: 'poz-workshop', title: 'Warsztaty fotograficzne', category: WORKSHOPS, venue: STARY_RYNEK, dayOffset: 2, time: '17:00' },
  { id: 'poz-art', title: 'Wernisaż na Jeżycach', category: ART, venue: GALERIA_JEZYCE, dayOffset: 4, time: '18:00' },

  { id: 'wro-club', title: 'Nocny set w klubie', category: MUSIC, venue: PASAZ_NIEPOLDA, dayOffset: 4, time: '23:00', price: paid(25) },
  { id: 'krk-latenight', title: 'Nocny stand-up po północy', category: COMEDY, venue: PLAC_NOWY, dayOffset: 6, time: '01:30', price: paid(20, 35) },
  { id: 'gdn-afterparty', title: 'Afterparty na Ołowiance', category: MUSIC, venue: OLOWIANKA, dayOffset: 5, time: '01:00' },
];

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
export function createSampleCatalog(now: Date): Catalog {
  const firstMonday = mondayOf(currentEventDay(now));

  const events: Event[] = SAMPLE_EVENTS.map(({ id, title, category }) => ({
    id: eventIdSchema.parse(id),
    title,
    categorySlug: category.slug,
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

  return createCatalog({ categories: SAMPLE_CATEGORIES, venues: SAMPLE_VENUES, events, occurrences });
}
