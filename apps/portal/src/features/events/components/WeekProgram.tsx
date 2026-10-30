import type { CalendarDay } from '@events/time';
import { formatCount, type Schedule } from '../schedule';
import { DayTabs } from './DayTabs';
import { EventsMapLoader } from './EventsMapLoader';
import { MapToggle } from './MapToggle';
import { SkipLink } from './SkipLink';
import { StripControls } from './StripControls';
import { WeekGrid } from './WeekGrid';
import stripStyles from './StripControls.module.css';
import styles from './WeekProgram.module.css';

// Each part awaits the same promise, so the week is requested once and each part streams in on its own
interface WeekPartProps {
  readonly schedule: Promise<Schedule>;
}

export async function WeekCount({ schedule }: WeekPartProps) {
  return formatCount((await schedule).activeCount);
}

export async function WeekMap({ schedule }: WeekPartProps) {
  const { mapPoints, mapFocus } = await schedule;
  return (
    <>
      <SkipLink />
      <MapToggle>
        <EventsMapLoader points={mapPoints} focus={mapFocus} />
      </MapToggle>
    </>
  );
}

export async function WeekStrip({ schedule, today }: WeekPartProps & { readonly today: CalendarDay }) {
  const resolved = await schedule;
  const days = resolved.weeks.flat();
  return (
    <>
      <div className={styles.phoneTabs}>
        <DayTabs
          days={days.map(({ day, weekdayIndex, entries }) => ({ day, weekdayIndex, count: entries.length }))}
          today={today}
        />
      </div>
      <div className={stripStyles.area}>
        <StripControls days={days.map(({ day }) => day)} />
        <WeekGrid schedule={resolved} today={today} />
      </div>
    </>
  );
}
