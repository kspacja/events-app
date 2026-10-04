import { beforeEach, describe, expect, it } from 'vitest';
import { addDays, eventDayOf, toInstantIso, type CalendarDay } from '@events/time';
import {
  eventIdSchema,
  occurrenceIdSchema,
  occurrenceListingSchema,
  type OccurrenceListing,
} from './listing';
import { compareListings, OccurrenceSourceError, type OccurrenceSource } from './source';

/** What an adapter test provides; the suite builds a fresh one for every test. */
export interface OccurrenceSourceFixture {
  readonly source: OccurrenceSource;
  /** Makes the backing store contain exactly these listings. */
  seed(listings: readonly OccurrenceListing[]): void | Promise<void>;
  /** Makes the next `listOccurrences` call fail inside the adapter. */
  breakBackend(): void | Promise<void>;
}

// Saturday before the 2030 spring clock change (Sunday 2030-03-31), so offsets differ in the set
const SATURDAY: CalendarDay = '2030-03-30';
const SUNDAY = addDays(SATURDAY, 1);
const SUMMER_DAY: CalendarDay = '2030-07-13';
const MINUTES = { oneThirty: 90, threeFiftyNine: 239, four: 240, evening: 19 * 60 };
const WIDE_RANGE_DAYS = 45;

function listing(id: string, day: CalendarDay, minutes: number): OccurrenceListing {
  return occurrenceListingSchema.parse({
    occurrenceId: occurrenceIdSchema.parse(id),
    startsAt: toInstantIso(day, minutes),
    price: null,
    event: {
      id: eventIdSchema.parse(`event-${id}`),
      title: `Event ${id}`,
      category: { slug: 'music', label: 'Muzyka' },
    },
    venue: { name: 'Venue', city: 'Warszawa', lat: 52.2, lng: 21 },
  });
}

const ids = (listings: readonly OccurrenceListing[]) =>
  listings.map(({ occurrenceId }) => occurrenceId);

/** Registers the shared behavioural tests every OccurrenceSource adapter must pass. */
export function describeOccurrenceSourceConformance(
  name: string,
  setup: () => OccurrenceSourceFixture | Promise<OccurrenceSourceFixture>,
): void {
  describe(`${name} conforms to OccurrenceSource`, () => {
    let fixture: OccurrenceSourceFixture;

    beforeEach(async () => {
      fixture = await setup();
    });

    const list = (from: CalendarDay, to: CalendarDay) =>
      fixture.source.listOccurrences({ from, to });

    describe('(a) event days in the inclusive range', () => {
      it('returns occurrences on both ends and between, nothing outside', async () => {
        const before = listing('before', addDays(SATURDAY, -1), MINUTES.evening);
        const first = listing('first', SATURDAY, MINUTES.evening);
        const last = listing('last', addDays(SATURDAY, 2), MINUTES.evening);
        const after = listing('after', addDays(SATURDAY, 3), MINUTES.evening);
        await fixture.seed([before, first, last, after]);

        const result = await list(SATURDAY, addDays(SATURDAY, 2));

        expect(ids(result)).toEqual(['first', 'last']);
      });

      it('returns an empty list when nothing is in range', async () => {
        await fixture.seed([listing('far', SUMMER_DAY, MINUTES.evening)]);

        expect(await list(SATURDAY, SUNDAY)).toEqual([]);
      });

      it('counts 01:30 on Sunday as Saturday', async () => {
        const lateNight = listing('late-night', SUNDAY, MINUTES.oneThirty);
        expect(eventDayOf(lateNight.startsAt)).toBe(SATURDAY);
        await fixture.seed([lateNight]);

        expect(ids(await list(SATURDAY, SATURDAY))).toEqual(['late-night']);
        expect(await list(SUNDAY, SUNDAY)).toEqual([]);
      });

      it('keeps 03:59 on the previous day and 04:00 on its own day', async () => {
        await fixture.seed([
          listing('last-minute', SUNDAY, MINUTES.threeFiftyNine),
          listing('new-day', SUNDAY, MINUTES.four),
        ]);

        expect(ids(await list(SATURDAY, SATURDAY))).toEqual(['last-minute']);
        expect(ids(await list(SUNDAY, SUNDAY))).toEqual(['new-day']);
      });
    });

    describe('(b) order', () => {
      it('sorts by startsAt, then occurrenceId', async () => {
        await fixture.seed([
          listing('b-evening', SATURDAY, MINUTES.evening),
          listing('c-morning', SATURDAY, 9 * 60),
          listing('a-evening', SATURDAY, MINUTES.evening),
          listing('d-next-day', SUNDAY, MINUTES.evening),
        ]);

        const result = await list(SATURDAY, SUNDAY);

        expect(ids(result)).toEqual(['c-morning', 'a-evening', 'b-evening', 'd-next-day']);
        expect(result).toEqual([...result].sort(compareListings));
      });

      it('orders by instant across the clock change, not by text', async () => {
        // 01:30 +01:00 is earlier than 03:30 +02:00 on 2030-03-31 though 03:30 is later wall-clock
        await fixture.seed([
          listing('after-change', SUNDAY, 3 * 60 + 30),
          listing('before-change', SUNDAY, MINUTES.oneThirty),
        ]);

        expect(ids(await list(SATURDAY, SUNDAY))).toEqual(['before-change', 'after-change']);
      });
    });

    describe('(c) no duplicates', () => {
      it('returns each occurrence once over a range wider than a month', async () => {
        const seeded = Array.from({ length: WIDE_RANGE_DAYS }, (_, offset) =>
          listing(`day-${offset}`, addDays(SATURDAY, offset), MINUTES.evening),
        );
        await fixture.seed(seeded);

        const result = await list(SATURDAY, addDays(SATURDAY, WIDE_RANGE_DAYS - 1));

        expect(new Set(ids(result)).size).toBe(result.length);
        expect(result).toHaveLength(WIDE_RANGE_DAYS);
      });
    });

    describe('startsAt format', () => {
      it('emits a Europe/Warsaw ISO string with its own offset, winter and summer', async () => {
        await fixture.seed([
          listing('winter', SATURDAY, MINUTES.evening),
          listing('summer', SUMMER_DAY, MINUTES.evening),
        ]);

        const result = await list(SATURDAY, SUMMER_DAY);

        expect(result.map(({ startsAt }) => startsAt)).toEqual([
          '2030-03-30T19:00:00+01:00',
          '2030-07-13T19:00:00+02:00',
        ]);
      });

      it('returns listings that satisfy the read-model schema', async () => {
        await fixture.seed([listing('valid', SATURDAY, MINUTES.evening)]);

        const result = await list(SATURDAY, SATURDAY);

        expect(result.map((item) => occurrenceListingSchema.safeParse(item).success)).toEqual([true]);
      });
    });

    describe('(d) failures', () => {
      it('rejects with OccurrenceSourceError when the backend breaks', async () => {
        await fixture.breakBackend();

        await expect(list(SATURDAY, SATURDAY)).rejects.toBeInstanceOf(OccurrenceSourceError);
      });
    });
  });
}
