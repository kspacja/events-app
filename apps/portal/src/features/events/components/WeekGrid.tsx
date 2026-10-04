import type { DateRange } from '@/features/search/dateRange';
import { UI_LABELS } from '../labels';
import type { Schedule } from '../schedule';
import { SCHEDULE_DOM } from '../scheduleDom';
import { DayColumn } from './DayColumn';
import { DayStrip } from './DayStrip';
import styles from './WeekGrid.module.css';

interface WeekGridProps {
  readonly range: DateRange;
  readonly timeKey: string | null;
  readonly schedule: Schedule;
}

export function WeekGrid({ range, timeKey, schedule }: WeekGridProps) {
  return (
    <section
      id={SCHEDULE_DOM.sectionId}
      tabIndex={-1}
      aria-label={UI_LABELS.schedule}
      className={styles.section}
    >
      <DayStrip
        className={styles.weeks}
        rangeKey={`${range.from}:${range.to}`}
        timeKey={timeKey}
      >
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
