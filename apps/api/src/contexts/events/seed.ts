import type { EventsData } from '@events/repo';
import type { Db } from '../../db';
import { categories, eventCategories, events, occurrences, venues } from './schema';
import { toSeedRows } from './seedRows';

/** Replaces everything in the `events` schema with `data` in one transaction. */
export async function seedEvents(db: Db, data: EventsData): Promise<void> {
  const rows = toSeedRows(data);
  await db.transaction(async (tx) => {
    // Children first, so no foreign key blocks the delete
    await tx.delete(occurrences);
    await tx.delete(eventCategories);
    await tx.delete(events);
    await tx.delete(venues);
    await tx.delete(categories);

    await tx.insert(categories).values(rows.categories);
    await tx.insert(venues).values(rows.venues);
    await tx.insert(events).values(rows.events);
    await tx.insert(eventCategories).values(rows.eventCategories);
    await tx.insert(occurrences).values(rows.occurrences);
  });
}
