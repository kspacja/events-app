import type { Event, EventCategory, Venue } from '@/features/events/types';
import {
  addDays,
  localDayOf,
  mondayOf,
  toInstantIso,
} from '@events/time';

interface EventTemplate {
  readonly id: string;
  readonly title: string;
  readonly category: EventCategory;
  readonly venue: Venue;
  /** Days since Monday: 0..6 */
  readonly dayOffset: number;
  /** Local time, `HH:mm` */
  readonly time: string;
}

const WROCLAW = 'Wrocław';

const venue = (name: string, city: string, lat: number, lng: number): Venue => ({
  name,
  city,
  lat,
  lng,
});

const EVENT_TEMPLATES: readonly EventTemplate[] = [
  { id: 'wro-choir', title: 'Koncert chóralny w katedrze', category: 'music', venue: venue('Ostrów Tumski', WROCLAW, 51.1142, 17.0465), dayOffset: 0, time: '19:00' },
  { id: 'wro-exhibition', title: 'Wystawa: miasto po zmroku', category: 'art', venue: venue('Muzeum Narodowe', WROCLAW, 51.1100, 17.0480), dayOffset: 1, time: '18:00' },
  { id: 'wro-boardgames', title: 'Wieczór gier planszowych', category: 'meetups', venue: venue('Śródmieście', WROCLAW, 51.0980, 17.0330), dayOffset: 2, time: '18:30' },
  { id: 'wro-standup', title: 'Stand-up w piwnicy', category: 'comedy', venue: venue('Rynek', WROCLAW, 51.1100, 17.0320), dayOffset: 3, time: '20:00' },
  { id: 'wro-courtyard', title: 'Koncert w podwórku', category: 'music', venue: venue('Nadodrze', WROCLAW, 51.1240, 17.0290), dayOffset: 3, time: '21:30' },
  { id: 'wro-jazz', title: 'Jazz nad Odrą', category: 'music', venue: venue('Bulwar Dunikowskiego', WROCLAW, 51.1135, 17.0420), dayOffset: 4, time: '19:00' },
  { id: 'wro-cinema', title: 'Kino plenerowe', category: 'film', venue: venue('Wyspa Słodowa', WROCLAW, 51.1130, 17.0380), dayOffset: 4, time: '20:30' },
  { id: 'wro-market', title: 'Targ producentów', category: 'food', venue: venue('Hala Stulecia', WROCLAW, 51.1067, 17.0770), dayOffset: 5, time: '10:00' },
  { id: 'wro-walk', title: 'Spacer po podwórkach', category: 'movement', venue: venue('Nadodrze', WROCLAW, 51.1250, 17.0300), dayOffset: 5, time: '14:00' },
  { id: 'wro-run', title: 'Nocny bieg', category: 'movement', venue: venue('Ostrów Tumski', WROCLAW, 51.1150, 17.0450), dayOffset: 5, time: '21:00' },
  { id: 'wro-ceramics', title: 'Warsztaty ceramiki', category: 'workshops', venue: venue('Ołbin', WROCLAW, 51.1190, 17.0460), dayOffset: 6, time: '12:00' },
  { id: 'wro-organ', title: 'Recital organowy', category: 'music', venue: venue('Kościół przy Rynku', WROCLAW, 51.1095, 17.0335), dayOffset: 6, time: '18:00' },

  { id: 'krk-jazz', title: 'Jazz w piwnicy', category: 'music', venue: venue('Piwnica pod Baranami', 'Kraków', 50.0616, 19.9372), dayOffset: 1, time: '20:00' },
  { id: 'krk-standup', title: 'Stand-up na Kazimierzu', category: 'comedy', venue: venue('Kazimierz', 'Kraków', 50.0515, 19.9445), dayOffset: 3, time: '19:30' },
  { id: 'krk-market', title: 'Targ śniadaniowy', category: 'food', venue: venue('Plac Nowy', 'Kraków', 50.0521, 19.9446), dayOffset: 5, time: '11:00' },
  { id: 'gdn-cinema', title: 'Kino na plaży', category: 'film', venue: venue('Plaża Jelitkowo', 'Gdańsk', 54.4217, 18.5780), dayOffset: 4, time: '21:00' },
  { id: 'gdn-run', title: 'Bieg nad Motławą', category: 'movement', venue: venue('Długie Pobrzeże', 'Gdańsk', 54.3503, 18.6580), dayOffset: 6, time: '09:00' },
  { id: 'poz-workshop', title: 'Warsztaty fotograficzne', category: 'workshops', venue: venue('Stary Rynek', 'Poznań', 52.4082, 16.9335), dayOffset: 2, time: '17:00' },
  { id: 'poz-art', title: 'Wernisaż na Jeżycach', category: 'art', venue: venue('Galeria Jeżyce', 'Poznań', 52.4170, 16.9000), dayOffset: 4, time: '18:00' },

  { id: 'wro-club', title: 'Nocny set w klubie', category: 'music', venue: venue('Pasaż Niepolda', WROCLAW, 51.1103, 17.0222), dayOffset: 4, time: '23:00' },
  { id: 'krk-latenight', title: 'Nocny stand-up po północy', category: 'comedy', venue: venue('Plac Nowy', 'Kraków', 50.0521, 19.9446), dayOffset: 6, time: '01:30' },
  { id: 'gdn-afterparty', title: 'Afterparty na Ołowiance', category: 'music', venue: venue('Ołowianka', 'Gdańsk', 54.3490, 18.6650), dayOffset: 5, time: '01:00' },
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
  return (
    weekIndex > 0 &&
    (weekIndex + templateIndex) % SKIP_CYCLE === SKIPPED_REMAINDER
  );
}

export function generateEvents(now: Date = new Date()): Event[] {
  const firstMonday = mondayOf(localDayOf(now));

  return Array.from({ length: GENERATED_WEEKS }, (_, weekIndex) =>
    EVENT_TEMPLATES.flatMap((template, templateIndex): Event[] => {
      if (isSkipped(weekIndex, templateIndex)) return [];
      const day = addDays(
        firstMonday,
        weekIndex * DAYS_IN_WEEK + template.dayOffset,
      );
      return [
        {
          id: `${template.id}-${day}`,
          startsAt: toInstantIso(day, minutesOfClock(template.time)),
          title: template.title,
          venue: template.venue,
          category: template.category,
        },
      ];
    }),
  ).flat();
}
