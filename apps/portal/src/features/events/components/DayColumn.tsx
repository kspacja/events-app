import { DAY_NAMES, UI_LABELS } from '../labels';
import type { ScheduleDay } from '../schedule';
import { columnAttributes } from '../scheduleDom';
import { EventCard } from './EventCard';
import styles from './DayColumn.module.css';

interface DayColumnProps {
  readonly scheduleDay: ScheduleDay;
}

export function DayColumn({
  scheduleDay: { day, weekdayIndex, inRange, isWeekend, entries },
}: DayColumnProps) {
  const dayOfMonth = String(Number(day.slice(8)));

  return (
    <li className={styles.day} {...columnAttributes(inRange, isWeekend)}>
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
              <EventCard listing={listing} muted={!active} />
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
