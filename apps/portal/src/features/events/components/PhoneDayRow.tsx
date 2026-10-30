import Link from 'next/link';
import type { CalendarDay } from '@events/time';
import { formatDay } from '@/lib/format';
import type { RangeLinks } from '@/features/search/components/RangeArrows';
import { RANGE_NAVIGATION_LABELS } from '@/features/search/labels';
import { WEEKDAY_SHORT_NAMES } from '@/features/schools/labels';
// The schools page's phone week row, so both rows look the same
import calendarStyles from '@/features/schools/components/MonthCalendar.module.css';
import markerStyles from '@/features/schools/components/DayMarkers.module.css';
import arrowStyles from '@/features/schools/components/WeekArrow.module.css';
import { DAY_NAMES, UI_LABELS } from '../labels';
import { calendarDayMarker } from '../dayMarker';
import { formatCount, type ScheduleDay } from '../schedule';
import { dayDomId } from '../scheduleDom';
import { DayJump } from './DayJump';
import styles from './PhoneDayRow.module.css';

interface PhoneDayRowProps {
  readonly weeks: readonly (readonly ScheduleDay[])[];
  readonly today: CalendarDay;
  readonly links?: RangeLinks;
}

function Markers({ count }: { readonly count: number }) {
  const marker = calendarDayMarker(count);
  return (
    <>
      {marker ? (
        <span className={markerStyles.marker} aria-hidden="true">
          {Array.from({ length: marker.dots }, (_, index) => (
            <span key={index} className={markerStyles.dot} />
          ))}
          {marker.more > 0 ? <span className={markerStyles.more}>+{marker.more}</span> : null}
        </span>
      ) : null}
      <span className="visually-hidden">{`, ${formatCount(count)}`}</span>
    </>
  );
}

function DayCell({ scheduleDay, today }: { readonly scheduleDay: ScheduleDay; readonly today: CalendarDay }) {
  const { day, inRange, entries } = scheduleDay;
  const number = formatDay(day, 'd');
  const isToday = day === today;
  const className = [calendarStyles.day, isToday ? calendarStyles.today : ''].filter(Boolean).join(' ');

  if (day < today || !inRange) {
    return (
      <span className={`${className} ${calendarStyles.past}`}>
        <span aria-hidden="true">{number}</span>
        <span className="visually-hidden">{formatDay(day, 'EEEE, d MMMM')}</span>
      </span>
    );
  }
  return (
    <DayJump
      day={day}
      href={`#${dayDomId(day)}`}
      className={className}
      aria-current={isToday ? 'date' : undefined}
    >
      <span className="visually-hidden">{formatDay(day, 'EEEE, d MMMM')}</span>
      <span aria-hidden="true">{number}</span>
      <Markers count={entries.filter(({ active }) => active).length} />
    </DayJump>
  );
}

function Arrow({ href, direction }: { readonly href: string | null | undefined; readonly direction: -1 | 1 }) {
  const sign = (
    <span className={arrowStyles.sign} aria-hidden="true">
      {direction < 0 ? '‹' : '›'}
    </span>
  );
  const label = direction < 0 ? RANGE_NAVIGATION_LABELS.previous : RANGE_NAVIGATION_LABELS.next;
  if (!href) {
    return (
      <span className={`${arrowStyles.compact} ${arrowStyles.disabled}`} aria-disabled="true">
        {sign}
        <span className="visually-hidden">{label}</span>
      </span>
    );
  }
  return (
    <Link href={href} scroll={false} className={arrowStyles.compact}>
      {sign}
      <span className="visually-hidden">{label}</span>
    </Link>
  );
}

/** Phones: the shown days in calendar rows, one per week; a day scrolls the strip to it, the arrows move the range. */
export function PhoneDayRow({ weeks, today, links }: PhoneDayRowProps) {
  return (
    <div className={styles.nav}>
      <Arrow href={links?.previous} direction={-1} />
      <table className={`${calendarStyles.grid} ${calendarStyles.weekRow}`} aria-label={UI_LABELS.schedule}>
        <thead>
          <tr>
            {WEEKDAY_SHORT_NAMES.map((name, index) => (
              <th key={name} scope="col" className={calendarStyles.weekday}>
                <span aria-hidden="true">{name}</span>
                <span className="visually-hidden">{DAY_NAMES[index]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr
              key={week[0].day}
              className={calendarStyles.week}
              data-current={week.some(({ day }) => day === today) || undefined}
            >
              {week.map((scheduleDay) => (
                <td key={scheduleDay.day} className={calendarStyles.cell}>
                  <DayCell scheduleDay={scheduleDay} today={today} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <Arrow href={links?.next} direction={1} />
    </div>
  );
}
