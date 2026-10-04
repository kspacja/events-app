import { UI_LABELS } from '../labels';
import type { Schedule } from '../schedule';
import { SCHEDULE_SECTION_ID } from '../scheduleDom';
import { DayColumn } from './DayColumn';
import { DayStrip } from './DayStrip';
import styles from './WeekGrid.module.css';

interface WeekGridProps {
  readonly schedule: Schedule;
}

export function WeekGrid({ schedule }: WeekGridProps) {
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
              <DayColumn key={scheduleDay.day} scheduleDay={scheduleDay} />
            ))}
          </ol>
        ))}
      </DayStrip>
    </section>
  );
}
