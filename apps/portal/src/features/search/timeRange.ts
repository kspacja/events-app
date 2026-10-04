import {
  DAY_BOUNDARY_MINUTES,
  localMinutesOf,
  MINUTES_PER_HOUR,
} from '@events/time';
import { formatClock } from '@/features/format/format';

export const TIME_PRESETS = [
  'morning',
  'noon',
  'afternoon',
  'evening',
  'night',
] as const;
export type TimePreset = (typeof TIME_PRESETS)[number];

/** Minutes after local midnight. When `to <= from` the window crosses midnight. */
export interface TimeWindow {
  readonly from: number;
  readonly to: number;
}

export type TimeSearchError = 'invalid-preset' | 'invalid-format' | 'same-time';

export type TimeSearchResult =
  | {
      readonly source: 'all';
      readonly window: null;
      readonly error: TimeSearchError | null;
    }
  | {
      readonly source: 'preset';
      readonly preset: TimePreset;
      readonly window: TimeWindow;
      readonly error: null;
    }
  | {
      readonly source: 'custom';
      readonly window: TimeWindow;
      readonly error: null;
    };

const CLOCK_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const hours = (value: number) => value * MINUTES_PER_HOUR;

export const TIME_PRESET_WINDOWS: Record<TimePreset, TimeWindow> = {
  morning: { from: hours(6), to: hours(11) },
  noon: { from: hours(11), to: hours(14) },
  afternoon: { from: hours(14), to: hours(18) },
  evening: { from: hours(18), to: hours(22) },
  night: { from: hours(22), to: hours(4) },
};

export function isMinuteInWindow(minute: number, window: TimeWindow): boolean {
  if (window.to > window.from) return minute >= window.from && minute < window.to;
  return minute >= window.from || minute < window.to;
}

/** A `null` window means all times. */
export function matchesTimeWindow(iso: string, window: TimeWindow | null): boolean {
  return window === null || isMinuteInWindow(localMinutesOf(iso), window);
}

export function formatTimeWindow(window: TimeWindow): string {
  return `${formatClock(window.from)}–${formatClock(window.to)}`;
}

function parseClock(value: string): number | null {
  const match = CLOCK_PATTERN.exec(value);
  if (!match) return null;
  return Number(match[1]) * MINUTES_PER_HOUR + Number(match[2]);
}

/** An empty `to` means the end of the event day (04:00). */
export function validateCustomTime(
  from: string,
  to: string,
): { window: TimeWindow } | { error: TimeSearchError } {
  const fromMinutes = parseClock(from);
  const toMinutes = to === '' ? DAY_BOUNDARY_MINUTES : parseClock(to);
  if (fromMinutes === null || toMinutes === null) return { error: 'invalid-format' };
  if (fromMinutes === toMinutes) return { error: 'same-time' };
  return { window: { from: fromMinutes, to: toMinutes } };
}
