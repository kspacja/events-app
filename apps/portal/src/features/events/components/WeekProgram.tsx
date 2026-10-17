import { formatCount, type Schedule } from '../schedule';
import { EventsMapLoader } from './EventsMapLoader';
import { MapToggle } from './MapToggle';
import { SkipLink } from './SkipLink';
import { StripControls } from './StripControls';
import { WeekGrid } from './WeekGrid';
import stripStyles from './StripControls.module.css';

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

export async function WeekStrip({ schedule }: WeekPartProps) {
  const resolved = await schedule;
  return (
    <div className={stripStyles.area}>
      <StripControls days={resolved.weeks.flat().map(({ day }) => day)} />
      <WeekGrid schedule={resolved} />
    </div>
  );
}
