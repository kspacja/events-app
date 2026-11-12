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
import { firstDayOf, type CalendarMonth } from '../monthCalendar';
import { formatPassedWeeks, type PassedWeeks } from '../monthWeeks';
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
// Phones list the days one under another, each with up to this many bars
const PHONE_QUERY = '(max-width: 768px)';
const PHONE_CAPACITY = 10;
// Saturday and Sunday share one narrow column on wider screens
const WEEKEND_FROM = 5;

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

function barsThatFit(list: HTMLElement | null | undefined): number {
  return list ? Math.max(1, Math.floor((list.clientHeight + BAR_GAP) / (BAR_HEIGHT + BAR_GAP))) : DEFAULT_CAPACITY;
}

/** How many bars fit in a weekday and in a half-height weekend day; one list of each is enough to measure. */
function useCapacity() {
  const ref = useRef<HTMLOListElement>(null);
  const [capacity, setCapacity] = useState(DEFAULT_CAPACITY);
  const [weekendCapacity, setWeekendCapacity] = useState(DEFAULT_CAPACITY);
  const [isPhone, setIsPhone] = useState(false);
  useEffect(() => {
    // Weeks start on Monday, so the first list is a weekday's
    const list = ref.current?.querySelector<HTMLElement>('[data-bars]');
    const weekendList = ref.current?.querySelector<HTMLElement>(`[data-weekday="${WEEKEND_FROM}"] [data-bars]`);
    if (!list) return;
    const phone = window.matchMedia(PHONE_QUERY);
    function update() {
      setIsPhone(phone.matches);
      setCapacity(phone.matches ? PHONE_CAPACITY : barsThatFit(list));
      setWeekendCapacity(phone.matches ? PHONE_CAPACITY : barsThatFit(weekendList));
    }
    const measure = new ResizeObserver(update);
    measure.observe(list);
    if (weekendList) measure.observe(weekendList);
    phone.addEventListener('change', update);
    return () => {
      measure.disconnect();
      phone.removeEventListener('change', update);
    };
  }, []);
  return { ref, capacity, weekendCapacity, isPhone };
}

interface MonthBarProps {
  readonly listing: OccurrenceListing;
  readonly alignEnd: boolean;
  readonly upward: boolean;
}

/** "10:00 Title"; hovering, focusing or tapping it shows the event's tile. */
function MonthBar({ listing, alignEnd, upward }: MonthBarProps) {
  const [open, setOpen] = useState(false);
  // A tapped bar opens its tile towards the larger part of the screen
  const [tappedUpward, setTappedUpward] = useState<boolean | null>(null);
  const tileId = useId();
  const entryRef = useRef<HTMLLIElement>(null);

  // Safari does not focus a tapped button, so blur alone would never close the tile
  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (!entryRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [open]);

  return (
    <li
      ref={entryRef}
      className={styles.entry}
      data-open={open || undefined}
      data-align={alignEnd ? 'end' : 'start'}
      data-upward={(tappedUpward ?? upward) || undefined}
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
        onClick={(event) => {
          setTappedUpward(event.currentTarget.getBoundingClientRect().top > window.innerHeight / 2);
          setOpen((value) => !value);
        }}
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
  /** A weekend day in the narrow column, half a week's height, with its name beside the number. */
  readonly narrow: boolean;
  /** The week's row, placing the day in the grid. */
  readonly row: number;
  readonly upward: boolean;
  readonly selected: boolean;
  /** Opens the day's drawer at `scrollToIndex`; `opener` gets the focus back when it closes. */
  readonly onOpen: (opener: HTMLButtonElement, scrollToIndex: number | null) => void;
}

function MonthDay({ scheduleDay, today, capacity, narrow, row, upward, selected, onOpen }: MonthDayProps) {
  const { day, weekdayIndex, inRange, isWeekend } = scheduleDay;
  const listings = activeListings(scheduleDay);
  // The footer below the list always holds its row, so the list has room for exactly `capacity` bars
  const shown = listings.slice(0, capacity);
  const hidden = listings.length - shown.length;
  const isToday = day === today;
  return (
    <li
      className={styles.day}
      data-in-month={inRange}
      data-weekend={isWeekend}
      data-weekday={weekdayIndex}
      data-narrow={narrow || undefined}
      style={{ '--row': row } as CSSProperties}
      data-past={day < today || undefined}
      data-selected={selected || undefined}
      data-day={day}
      data-empty={listings.length === 0 || undefined}
      aria-current={isToday ? 'date' : undefined}
    >
      <h3 className={styles.dayHeading}>
        <span className={styles.weekday} aria-hidden="true">
          {formatDay(day, 'EEEE')}
        </span>
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
      {/* Every day keeps this row, even empty, so all lists have the same height */}
      <div className={styles.footer}>
        {listings.length > 0 ? (
          <button
            type="button"
            className={styles.more}
            data-more
            aria-expanded={selected}
            onClick={(event) => onOpen(event.currentTarget, hidden > 0 ? shown.length : null)}
          >
            {hidden > 0 ? `+${hidden} ${MONTH_LABELS.more}` : MONTH_LABELS.showDay}
          </button>
        ) : null}
      </div>
    </li>
  );
}

interface MonthGridProps {
  readonly month: CalendarMonth;
  /** The weeks still ahead; those fully gone are left out. */
  readonly weeks: readonly (readonly ScheduleDay[])[];
  /** What the left-out weeks held, for a note above the grid. */
  readonly passed?: PassedWeeks | null;
  readonly today: CalendarDay;
}

/** The whole month on one and a half screens: equal week rows, events as bars. */
export function MonthGrid({ month, weeks, passed = null, today }: MonthGridProps) {
  const { ref, capacity, weekendCapacity, isPhone } = useCapacity();
  const [openDay, setOpenDay] = useState<CalendarDay | null>(null);
  // The drawer slides out before it goes
  const [closing, setClosing] = useState(false);
  const [scrollToIndex, setScrollToIndex] = useState<number | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const open = openDay ? weeks.flat().find(({ day }) => day === openDay) : undefined;
  const closed = useCallback(() => {
    setOpenDay(null);
    setClosing(false);
    // Back to the "+N" that opened it, once the drawer is gone
    requestAnimationFrame(() => openerRef.current?.focus());
  }, []);
  const close = useCallback(() => {
    // No animation runs, so nothing would report its end
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) closed();
    else setClosing(true);
  }, [closed]);
  const openDayDrawer = useCallback((day: CalendarDay, scrollTo: number | null) => {
    setClosing(false);
    setOpenDay(day);
    setScrollToIndex(scrollTo);
  }, []);

  useEffect(() => {
    function reveal(event: Event) {
      const occurrenceId = (event as CustomEvent<OccurrenceId>).detail;
      const bar = document.getElementById(occurrenceDomId(occurrenceId));
      if (bar) {
        flash(bar);
        return;
      }
      for (const scheduleDay of weeks.flat()) {
        const index = activeListings(scheduleDay).findIndex((listing) => listing.occurrenceId === occurrenceId);
        if (index < 0) continue;
        openerRef.current = document.querySelector<HTMLButtonElement>(`[data-day="${scheduleDay.day}"] [data-more]`);
        openDayDrawer(scheduleDay.day, index);
        return;
      }
    }
    document.addEventListener(REVEAL_EVENT, reveal);
    return () => document.removeEventListener(REVEAL_EVENT, reveal);
  }, [weeks, openDayDrawer]);
  const style = {
    '--rows': weeks.length,
    '--bar-height': `${BAR_HEIGHT}px`,
    '--bar-gap': `${BAR_GAP}px`,
  } as CSSProperties;
  return (
    <section aria-label={CALENDAR_LABELS.region} style={style}>
      <div className={styles.caption}>
        {/* The dock's h2 already names the month for screen readers */}
        <span className={styles.monthName} aria-hidden="true">
          {formatDay(firstDayOf(month), 'LLLL yyyy')}
        </span>
        {passed ? <p className={styles.passed}>{formatPassedWeeks(passed)}</p> : null}
      </div>
      <div className={styles.grid}>
        <div className={styles.weekdays} aria-hidden="true">
          {WEEKDAY_SHORT_NAMES.slice(0, WEEKEND_FROM).map((name) => (
            <span key={name}>{name}</span>
          ))}
          <span>{WEEKDAY_SHORT_NAMES.slice(WEEKEND_FROM).join(' / ')}</span>
        </div>
        <ol ref={ref} className={styles.days}>
          {weeks.flatMap((week, row) =>
            week.map((scheduleDay) => (
              <MonthDay
                key={scheduleDay.day}
                scheduleDay={scheduleDay}
                today={today}
                capacity={scheduleDay.weekdayIndex >= WEEKEND_FROM ? weekendCapacity : capacity}
                narrow={!isPhone && scheduleDay.weekdayIndex >= WEEKEND_FROM}
                row={row}
                upward={row >= weeks.length - UPWARD_ROWS}
                selected={openDay === scheduleDay.day}
                onOpen={(opener, scrollTo) => {
                  if (openDay === scheduleDay.day && !closing) {
                    close();
                    return;
                  }
                  openerRef.current = opener;
                  openDayDrawer(scheduleDay.day, scrollTo);
                }}
              />
            )),
          )}
        </ol>
      </div>
      {open ? (
        <MonthDayDrawer
          // A drawer changing sides slides in anew from its own edge
          key={open.weekdayIndex >= END_ALIGNED_FROM ? 'start' : 'end'}
          day={open.day}
          listings={activeListings(open)}
          side={open.weekdayIndex >= END_ALIGNED_FROM ? 'start' : 'end'}
          closing={closing}
          scrollToIndex={scrollToIndex}
          onClose={close}
          onClosed={closed}
        />
      ) : null}
    </section>
  );
}
