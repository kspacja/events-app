import { DAY_NAMES, UI_LABELS } from '../labels';
import type { ScheduleDay } from '../schedule';
import { dayDomId } from '../scheduleDom';
import { dayMarker } from '../dayMarker';
import { OccurrenceCard } from './OccurrenceCard';
import styles from './DayColumn.module.css';

interface DayColumnProps {
  readonly scheduleDay: ScheduleDay;
  readonly past?: boolean;
  readonly isToday?: boolean;
}

export function DayColumn({
  scheduleDay: { day, weekdayIndex, inRange, isWeekend, entries },
  past = false,
  isToday = false,
}: DayColumnProps) {
  const dayOfMonth = String(Number(day.slice(8)));
  const marker = dayMarker(entries.filter(({ active }) => active).length);

  return (
    <li
      id={dayDomId(day)}
      className={styles.day}
      data-in-range={inRange}
      data-weekend={isWeekend}
      data-past={past || undefined}
      aria-current={isToday ? 'date' : undefined}
    >
      <h2 className={styles.heading}>
        <span className={styles.name}>
          {DAY_NAMES[weekdayIndex]}
          {isToday ? <span className={styles.today}>{UI_LABELS.today}</span> : null}
        </span>
        <span className={styles.numberRow}>
          <time dateTime={day} className={styles.number}>
            {dayOfMonth}
          </time>
          {/* The same dots as the month calendar; the list below says it in words */}
          {marker ? (
            <span className={styles.marker} aria-hidden="true">
              {Array.from({ length: marker.dots }, (_, index) => (
                <span key={index} className={styles.dot} />
              ))}
              {marker.more > 0 ? <span className={styles.more}>+{marker.more}</span> : null}
            </span>
          ) : null}
        </span>
      </h2>
      {entries.length > 0 ? (
        <ul className={styles.events}>
          {entries.map(({ listing, active }) => (
            <li key={listing.occurrenceId}>
              <OccurrenceCard listing={listing} muted={!active} />
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>
          {inRange ? UI_LABELS.emptyDay : UI_LABELS.outOfRange}
        </p>
      )}
    </li>
  );
}
