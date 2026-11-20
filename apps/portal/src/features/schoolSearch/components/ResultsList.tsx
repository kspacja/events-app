'use client';

import type { OccurrenceListing } from '@events/contract/listing';
import { eventDayOf, weekdayIndex, type CalendarDay } from '@events/time';
import { DAY_SHORT_NAMES } from '@/features/events/labels';
import { EventDetailsDialog } from '@/features/schools/eventDetails/EventDetailsDialog';
import { formatPrice } from '@/features/schools/eventDetails/eventFacts';
import { openEventDetails } from '@/features/schools/eventDetails/eventParam';
import { hasStarted } from '@/features/schools/hasStarted';
import { formatDay, formatLocalTime } from '@/lib/format';
import styles from './ResultsList.module.css';

interface ResultsListProps {
  readonly listings: readonly OccurrenceListing[];
  readonly today: CalendarDay;
  /** The server's moment, in ms: events that have started fade. */
  readonly now: number;
  /** Left out on the organizer's own page, where every row would repeat it. */
  readonly showOrganizer?: boolean;
}

interface MonthGroup {
  readonly key: string;
  readonly listings: readonly OccurrenceListing[];
}

/** Consecutive months of the (already sorted) listings, by event day. */
function byMonth(listings: readonly OccurrenceListing[]): MonthGroup[] {
  const groups: { key: string; listings: OccurrenceListing[] }[] = [];
  for (const listing of listings) {
    const key = eventDayOf(listing.startsAt).slice(0, 7);
    const last = groups.at(-1);
    if (last?.key === key) last.listings.push(listing);
    else groups.push({ key, listings: [listing] });
  }
  return groups;
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zm.9 4.6v4.5l3.3 2-.9 1.5-4.2-2.5V7.1h1.8z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a7.5 7.5 0 0 0-7.5 7.5c0 5.6 7.5 12.5 7.5 12.5s7.5-6.9 7.5-12.5A7.5 7.5 0 0 0 12 2zm0 10.3a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6z" />
    </svg>
  );
}

/** Search results as one card per occurrence, under a heading per month; a row opens the event's details. */
export function ResultsList({ listings, today, now, showOrganizer = true }: ResultsListProps) {
  return (
    <>
      {byMonth(listings).map((group) => (
        <section key={group.key} className={styles.month} aria-labelledby={`month-${group.key}`}>
          <h2 id={`month-${group.key}`} className={styles.monthName}>
            {formatDay(`${group.key}-01` as CalendarDay, 'LLLL yyyy')}
          </h2>
          <ul className={styles.rows}>
            {group.listings.map((listing) => {
              const { occurrenceId, startsAt, event, venue, price } = listing;
              const day = eventDayOf(startsAt);
              const sub = [showOrganizer ? event.organizer?.name : null, price ? formatPrice(price) : null].filter(Boolean);
              return (
                <li key={occurrenceId}>
                  <button
                    type="button"
                    className={styles.row}
                    data-past={hasStarted(startsAt, now) || undefined}
                    onClick={() => openEventDetails(occurrenceId)}
                  >
                    <span className={styles.date} data-today={day === today || undefined}>
                      <span className={styles.weekday} aria-hidden="true">
                        {DAY_SHORT_NAMES[weekdayIndex(day)]}
                      </span>
                      <span className={styles.dayNumber} aria-hidden="true">
                        {formatDay(day, 'dd')}
                      </span>
                      <span className="visually-hidden">{formatDay(day, 'EEEE, d MMMM')}</span>
                    </span>
                    <span className={styles.meta}>
                      <span className={styles.metaLine}>
                        <ClockIcon />
                        <span className={styles.time}>{formatLocalTime(startsAt)}</span>
                      </span>
                      <span className={styles.metaLine}>
                        <PinIcon />
                        <span className={styles.venue}>
                          {venue.name}, {venue.city}
                        </span>
                      </span>
                    </span>
                    <span className={styles.main}>
                      <span className={styles.title}>{event.title}</span>
                      {sub.length > 0 ? <span className={styles.sub}>{sub.join(' · ')}</span> : null}
                    </span>
                    <svg className={styles.chevron} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <EventDetailsDialog listings={listings} now={now} />
    </>
  );
}
