'use client';

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import type { CalendarDay } from '@events/time';
import type { OccurrenceId, OccurrenceListing } from '@events/contract/listing';
import { OccurrenceCard } from '@/features/events/components/OccurrenceCard';
import { UI_LABELS } from '@/features/events/labels';
import type { ScheduleDay } from '@/features/events/schedule';
import { occurrenceDomId } from '@/features/events/scheduleDom';
import { formatDay, formatLocalTime } from '@/lib/format';
import { CALENDAR_LABELS, MONTH_LABELS, WEEKDAY_SHORT_NAMES } from '../labels';
import { MonthDayDrawer } from './MonthDayDrawer';
import styles from './MonthGrid.module.css';

// One source for the bar size, read by the CSS and by the count of bars that fit a day
const BAR_HEIGHT = 24;
const BAR_GAP = 2;
// Until the first measurement, e.g. in the server render
const DEFAULT_CAPACITY = 4;
// Thursday on: the tile opens to the left, so it stays on the page
const END_ALIGNED_FROM = 3;
// The last two rows open their tiles upwards
const UPWARD_ROWS = 2;

const REVEAL_EVENT = 'month-grid:reveal';

/** From the map: focus the occurrence's bar, or open its day's drawer when it hides behind "+N". */
export function revealInMonth(occurrenceId: OccurrenceId) {
  document.dispatchEvent(new CustomEvent<OccurrenceId>(REVEAL_EVENT, { detail: occurrenceId }));
}

function flash(bar: HTMLElement) {
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  bar.scrollIntoView({ block: 'center', behavior });
  bar.focus({ preventScroll: true });
  bar.dataset.revealed = 'true';
  bar.addEventListener('animationend', () => delete bar.dataset.revealed, { once: true });
}

/** How many bars fit in a day; every day has the same height, so one list is enough to measure. */
function useCapacity() {
  const ref = useRef<HTMLOListElement>(null);
  const [capacity, setCapacity] = useState(DEFAULT_CAPACITY);
  useEffect(() => {
    const list = ref.current?.querySelector<HTMLElement>('[data-bars]');
    if (!list) return;
    const measure = new ResizeObserver(() => {
      setCapacity(Math.max(1, Math.floor((list.clientHeight + BAR_GAP) / (BAR_HEIGHT + BAR_GAP))));
    });
    measure.observe(list);
    return () => measure.disconnect();
  }, []);
  return { ref, capacity };
}

interface MonthBarProps {
  readonly listing: OccurrenceListing;
  readonly alignEnd: boolean;
  readonly upward: boolean;
}

/** "10:00 Title"; hovering, focusing or tapping it shows the event's tile. */
function MonthBar({ listing, alignEnd, upward }: MonthBarProps) {
  const [open, setOpen] = useState(false);
  const tileId = useId();
  return (
    <li
      className={styles.entry}
      data-open={open || undefined}
      data-align={alignEnd ? 'end' : 'start'}
      data-upward={upward || undefined}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false);
      }}
    >
      <button
        type="button"
        id={occurrenceDomId(listing.occurrenceId)}
        className={styles.bar}
        aria-expanded={open}
        aria-controls={tileId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.time}>{formatLocalTime(listing.startsAt)}</span>{' '}
        <span className={styles.title}>{listing.event.title}</span>
      </button>
      <div id={tileId} className={styles.tile}>
        <OccurrenceCard listing={listing} variant="popup" />
      </div>
    </li>
  );
}

function activeListings({ entries }: ScheduleDay): OccurrenceListing[] {
  return entries.filter(({ active }) => active).map(({ listing }) => listing);
}

interface MonthDayProps {
  readonly scheduleDay: ScheduleDay;
  readonly today: CalendarDay;
  readonly capacity: number;
  readonly upward: boolean;
  readonly selected: boolean;
  readonly onMore: (opener: HTMLButtonElement) => void;
}

function MonthDay({ scheduleDay, today, capacity, upward, selected, onMore }: MonthDayProps) {
  const { day, weekdayIndex, inRange, isWeekend } = scheduleDay;
  const listings = activeListings(scheduleDay);
  // A full day keeps its last row for "+N więcej"
  const shown = listings.length > capacity ? listings.slice(0, capacity - 1) : listings;
  const hidden = listings.length - shown.length;
  const isToday = day === today;
  return (
    <li
      className={styles.day}
      data-in-month={inRange}
      data-weekend={isWeekend}
      data-past={day < today || undefined}
      data-selected={selected || undefined}
      data-day={day}
      aria-current={isToday ? 'date' : undefined}
    >
      <h3 className={styles.dayHeading}>
        <time dateTime={day} aria-hidden="true">
          {formatDay(day, 'd')}
        </time>
        <span className="visually-hidden">{formatDay(day, 'EEEE, d MMMM')}</span>
        {isToday ? <span className={styles.today}>{UI_LABELS.today}</span> : null}
      </h3>
      <ul className={styles.bars} data-bars>
        {shown.map((listing) => (
          <MonthBar
            key={listing.occurrenceId}
            listing={listing}
            alignEnd={weekdayIndex >= END_ALIGNED_FROM}
            upward={upward}
          />
        ))}
      </ul>
      {hidden > 0 ? (
        <button
          type="button"
          className={styles.more}
          data-more
          aria-expanded={selected}
          onClick={(event) => onMore(event.currentTarget)}
        >
          {`+${hidden} ${MONTH_LABELS.more}`}
        </button>
      ) : null}
    </li>
  );
}

interface MonthGridProps {
  readonly weeks: readonly (readonly ScheduleDay[])[];
  readonly today: CalendarDay;
}

/** The whole month on one and a half screens: equal week rows, events as bars. */
export function MonthGrid({ weeks, today }: MonthGridProps) {
  const { ref, capacity } = useCapacity();
  const [openDay, setOpenDay] = useState<CalendarDay | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const open = openDay ? weeks.flat().find(({ day }) => day === openDay) : undefined;
  const close = useCallback(() => {
    setOpenDay(null);
    // Back to the "+N" that opened it, once the drawer is gone
    requestAnimationFrame(() => openerRef.current?.focus());
  }, []);

  useEffect(() => {
    function reveal(event: Event) {
      const occurrenceId = (event as CustomEvent<OccurrenceId>).detail;
      const bar = document.getElementById(occurrenceDomId(occurrenceId));
      if (bar) {
        flash(bar);
        return;
      }
      const hiddenIn = weeks.flat().find((scheduleDay) =>
        activeListings(scheduleDay).some((listing) => listing.occurrenceId === occurrenceId),
      );
      if (!hiddenIn) return;
      openerRef.current = document.querySelector<HTMLButtonElement>(`[data-day="${hiddenIn.day}"] [data-more]`);
      setOpenDay(hiddenIn.day);
    }
    document.addEventListener(REVEAL_EVENT, reveal);
    return () => document.removeEventListener(REVEAL_EVENT, reveal);
  }, [weeks]);
  const style = {
    '--rows': weeks.length,
    '--bar-height': `${BAR_HEIGHT}px`,
    '--bar-gap': `${BAR_GAP}px`,
  } as CSSProperties;
  return (
    <section className={styles.grid} aria-label={CALENDAR_LABELS.region} style={style}>
      <div className={styles.weekdays} aria-hidden="true">
        {WEEKDAY_SHORT_NAMES.map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>
      <ol ref={ref} className={styles.days}>
        {weeks.flatMap((week, row) =>
          week.map((scheduleDay) => (
            <MonthDay
              key={scheduleDay.day}
              scheduleDay={scheduleDay}
              today={today}
              capacity={capacity}
              upward={row >= weeks.length - UPWARD_ROWS}
              selected={openDay === scheduleDay.day}
              onMore={(opener) => {
                openerRef.current = opener;
                setOpenDay((current) => (current === scheduleDay.day ? null : scheduleDay.day));
              }}
            />
          )),
        )}
      </ol>
      {open ? (
        <MonthDayDrawer
          day={open.day}
          listings={activeListings(open)}
          side={open.weekdayIndex >= END_ALIGNED_FROM ? 'start' : 'end'}
          onClose={close}
        />
      ) : null}
    </section>
  );
}
