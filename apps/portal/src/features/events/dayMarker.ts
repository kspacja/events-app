const MAX_DOTS = 3;
const DOT_PER_EVENT_UP_TO = 4;

/** Znacznik dnia: one dot per event up to 4; from 5 on, 3 dots and the rest as a number. */
export interface DayMarker {
  readonly dots: number;
  readonly more: number;
}

export function dayMarker(count: number): DayMarker | null {
  if (count <= 0) return null;
  if (count <= DOT_PER_EVENT_UP_TO) return { dots: count, more: 0 };
  return { dots: MAX_DOTS, more: count - MAX_DOTS };
}

const CALENDAR_DOT_PER_EVENT_UP_TO = 3;

/** In the calendars' narrow cells: a dot per event up to 3; from 4 on, one dot and the rest as a number ("● +5"). */
export function calendarDayMarker(count: number): DayMarker | null {
  if (count <= 0) return null;
  if (count <= CALENDAR_DOT_PER_EVENT_UP_TO) return { dots: count, more: 0 };
  return { dots: 1, more: count - 1 };
}
