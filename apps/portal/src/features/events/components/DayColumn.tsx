import { DAY_NAMES, UI_LABELS } from '../labels';
import type { ScheduleDay } from '../schedule';
import { dayDomId } from '../scheduleDom';
import { OccurrenceCard } from './OccurrenceCard';
import styles from './DayColumn.module.css';

interface DayColumnProps {
  readonly scheduleDay: ScheduleDay;
  readonly past?: boolean;
}

export function DayColumn({
  scheduleDay: { day, weekdayIndex, inRange, isWeekend, entries },
  past = false,
}: DayColumnProps) {
  const dayOfMonth = String(Number(day.slice(8)));

  return (
    <li
      id={dayDomId(day)}
      className={styles.day}
      data-in-range={inRange}
      data-weekend={isWeekend}
      data-past={past || undefined}
    >
      <h2 className={styles.heading}>
        <span className={styles.name}>{DAY_NAMES[weekdayIndex]}</span>
        <time dateTime={day} className={styles.number}>
          {dayOfMonth}
        </time>
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
