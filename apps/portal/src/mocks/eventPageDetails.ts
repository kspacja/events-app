import type { EventPageDetails, VenueTransit } from '@events/contract/event-page';
import type { OccurrenceListing } from '@events/contract/listing';
import { sampleImageUrl } from '@events/repo';

/** Prototype (stage 3.11): what the event page shows beyond the listing; only MSW knows it. */

const GALLERY_SIZE = 3;

/** Other sample photos than the event's own, so every page has a few thumbnails. */
function galleryFor({ id, imageUrl }: OccurrenceListing['event']): string[] {
  const seed = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const photos = new Set<string>();
  for (let i = 1; photos.size < GALLERY_SIZE && i <= GALLERY_SIZE * 4; i++) {
    const photo = sampleImageUrl(id, seed + i);
    if (photo !== imageUrl) photos.add(photo);
  }
  return [...photos];
}

const GENERAL_FAQ = [
  {
    question: 'Czy trzeba wcześniej zgłosić grupę?',
    answer: 'Tak, najpóźniej 7 dni przed terminem. Potwierdzimy zgłoszenie mailem w ciągu dwóch dni roboczych.',
  },
  {
    question: 'Co, jeśli grupa się spóźni?',
    answer: 'Zajęcia zaczynamy o czasie; przy spóźnieniu do 15 minut skracamy je, później przepadają.',
  },
];

const GENERAL_PRACTICAL = [
  'Prosimy o przyjście 15 minut przed początkiem.',
  'Szatnia i toalety są na parterze.',
  'Zajęcia odbywają się w sali — nie potrzeba specjalnego ubioru.',
];

const GENERAL_ACCESSIBILITY = ['Wejście bez schodów.', 'Toaleta dostosowana do potrzeb osób z niepełnosprawnościami.'];

/** First name and surname of a made-up coordinator, stable per organizer. */
const COORDINATORS = ['Anna Kowalska', 'Piotr Nowak', 'Magdalena Wiśniewska', 'Tomasz Zieliński', 'Katarzyna Lewandowska'];

function contactFor(listing: OccurrenceListing): EventPageDetails['contact'] {
  const organizer = listing.event.organizer;
  if (!organizer) return undefined;
  const name = COORDINATORS[organizer.slug.length % COORDINATORS.length];
  const login = name.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replaceAll('ł', 'l').split(' ');
  return {
    name,
    role: 'koordynator zajęć dla szkół',
    email: `${login[0][0]}.${login[1]}@${organizer.slug.split('-').slice(0, 2).join('-')}.example.pl`,
    phone: '71 347 10 00',
  };
}

/** The same for every school event without its own page: enough to show the layout. */
function generalDetails(listing: OccurrenceListing): EventPageDetails {
  return {
    gallery: galleryFor(listing.event),
    learningGoals: [],
    specialNeeds: false,
    durationMinutes: 60,
    maxParticipants: 30,
    guardians: '1 opiekun na 15 uczniów · bezpłatnie',
    reservationRequired: true,
    contact: contactFor(listing),
    materials: [],
    practicalInfo: GENERAL_PRACTICAL,
    accessibility: GENERAL_ACCESSIBILITY,
    faq: GENERAL_FAQ,
  };
}

/** Full pages for a few events, so every section can be seen. */
const OWN_PAGES: Readonly<Record<string, (listing: OccurrenceListing) => EventPageDetails>> = {
  'wro-school-concert': (listing) => ({
    ...generalDetails(listing),
    video: { title: 'Jak wygląda koncert edukacyjny', posterUrl: sampleImageUrl('video', 1) },
    arrivalNote:
      'Prosimy o przyjście kwadrans przed początkiem. Szatnia i toalety są na parterze, a na widownię można wejść bez schodów. Prosimy o jednego opiekuna na mniej więcej dziesięcioro dzieci.',
    learningGoals: [
      'Rozpoznają instrumenty orkiestry po brzmieniu i wyglądzie.',
      'Poznają pojęcia tempa, dynamiki i rytmu.',
      'Spróbują poprowadzić krótki fragment jako dyrygent.',
    ],
    curriculum: {
      area: 'Muzyka',
      grades: 'Przedszkole, klasy 1–6',
      description: 'Słuchanie muzyki, rozpoznawanie instrumentów, elementy muzyki: tempo, dynamika, rytm.',
    },
    specialNeeds: true,
    durationMinutes: 60,
    maxParticipants: 120,
    guardians: '1 opiekun na 10 uczniów · bezpłatnie',
    materials: [
      { label: 'Karta pracy (PDF)', url: '#' },
      { label: 'Nagrania do posłuchania przed koncertem', url: '#' },
    ],
    accessibility: [
      ...GENERAL_ACCESSIBILITY,
      'Pętla indukcyjna na widowni.',
      'Dla uczniów nadwrażliwych na dźwięk wypożyczamy słuchawki wyciszające.',
    ],
    faq: [
      {
        question: 'Czy uczniowie mogą robić zdjęcia?',
        answer: 'Tak, bez lampy błyskowej. Muzycy chętnie pozują po koncercie.',
      },
      {
        question: 'Czy koncert jest dostosowany do przedszkolaków?',
        answer: 'Tak — dla najmłodszych skracamy część o pojęciach i dłużej gramy.',
      },
      ...GENERAL_FAQ,
    ],
  }),
  'kob-school-farm': (listing) => ({
    ...generalDetails(listing),
    arrivalNote: 'Zajęcia są na dworze — prosimy o ubrania i buty, które mogą się pobrudzić.',
    learningGoals: [
      'Zobaczą z bliska zwierzęta gospodarskie i dowiedzą się, jak się nimi opiekować.',
      'Poznają drogę od ziarna do chleba.',
    ],
    curriculum: {
      area: 'Edukacja przyrodnicza',
      grades: 'Przedszkole, klasy 1–3',
      description: 'Poznawanie zwierząt i roślin w gospodarstwie, zmiany w przyrodzie w różnych porach roku.',
    },
    specialNeeds: true,
    durationMinutes: 120,
    maxParticipants: 50,
  }),
};

/** Details for the event page: its own when written, the general ones for school events, none otherwise. */
export function sampleEventPageDetails(listing: OccurrenceListing): EventPageDetails | undefined {
  const own = OWN_PAGES[listing.event.id];
  if (own) return own(listing);
  return listing.event.forSchools ? generalDetails(listing) : undefined;
}

/** Public transport to some sample venues, keyed by `venueKey`: text only, lines only, or both. */
export const SAMPLE_VENUE_TRANSIT: Readonly<Record<string, VenueTransit>> = {
  'hala-stulecia-wroclaw': { note: 'Przystanek „Hala Stulecia” jest 200 m od wejścia.', lines: ['1', '4', '10', '16', '145', '146'] },
  'rynek-wroclaw': { lines: ['3', '7', '10', '33', 'A', 'D', 'K'] },
  'muzeum-narodowe-wroclaw': { note: 'Przystanek „Most Pokoju” tuż przy muzeum.', lines: ['2', '10', '17', 'N'] },
  'olbin-wroclaw': { lines: ['1', '6', '7', '11', '0L', '0P'] },
  'dlugie-pobrzeze-gdansk': { note: '10 minut pieszo od stacji Gdańsk Główny.', lines: ['3', '8', '106', '111'] },
  'gospodarstwo-edukacyjne-kobierzyce': { note: 'Z Wrocławia można dojechać specjalnym autobusem — zapytaj przy zgłoszeniu grupy.', lines: [] },
  'muzeum-slezanskie-sobotka': { note: '500 m od stacji PKP Sobótka.', lines: [] },
};
