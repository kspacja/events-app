import { UI_LABELS } from '../labels';
import type { CalendarDay } from '@events/time';
import type { Schedule } from '../schedule';
import { SCHEDULE_SECTION_ID } from '../scheduleDom';
import { DayColumn } from './DayColumn';
import { DayStrip } from './DayStrip';
import styles from './WeekGrid.module.css';

interface WeekGridProps {
  readonly schedule: Schedule;
  /** When given, days before it are marked past (dimmed); today itself stays active until it ends. */
  readonly today?: CalendarDay;
}

export function WeekGrid({ schedule, today }: WeekGridProps) {
  return (
    <section
      id={SCHEDULE_SECTION_ID}
      tabIndex={-1}
      aria-label={UI_LABELS.schedule}
      className={styles.section}
    >
      <DayStrip className={styles.weeks} landing={schedule.landing}>
        {schedule.weeks.map((week) => (
          <ol key={week[0].day} className={styles.week}>
            {week.map((scheduleDay) => (
              <DayColumn
                key={scheduleDay.day}
                scheduleDay={scheduleDay}
                past={today !== undefined && scheduleDay.day < today}
              />
            ))}
          </ol>
        ))}
      </DayStrip>
    </section>
  );
}
