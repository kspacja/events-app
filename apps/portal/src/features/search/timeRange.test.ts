import { describe, expect, it } from 'vitest';
import {
  formatTimeWindow,
  isMinuteInWindow,
  matchesTimeWindow,
  TIME_PRESET_WINDOWS,
  validateCustomTime,
} from './timeRange';

const at = (hours: number, minutes = 0) => hours * 60 + minutes;

describe('preset windows', () => {
  it.each([
    ['morning', '06:00–11:00'],
    ['noon', '11:00–14:00'],
    ['afternoon', '14:00–18:00'],
    ['evening', '18:00–22:00'],
    ['night', '22:00–04:00'],
  ] as const)('%s covers %s', (preset, label) => {
    expect(formatTimeWindow(TIME_PRESET_WINDOWS[preset])).toBe(label);
  });
});

describe('isMinuteInWindow', () => {
  const morning = TIME_PRESET_WINDOWS.morning;
  const night = TIME_PRESET_WINDOWS.night;

  it('includes the start and excludes the end of a normal window', () => {
    expect(isMinuteInWindow(at(6), morning)).toBe(true);
    expect(isMinuteInWindow(at(10, 59), morning)).toBe(true);
    expect(isMinuteInWindow(at(11), morning)).toBe(false);
    expect(isMinuteInWindow(at(5, 59), morning)).toBe(false);
  });

  it('handles a window crossing midnight', () => {
    expect(isMinuteInWindow(at(22), night)).toBe(true);
    expect(isMinuteInWindow(at(23, 30), night)).toBe(true);
    expect(isMinuteInWindow(at(0), night)).toBe(true);
    expect(isMinuteInWindow(at(3, 59), night)).toBe(true);
    expect(isMinuteInWindow(at(4), night)).toBe(false);
    expect(isMinuteInWindow(at(21, 59), night)).toBe(false);
    expect(isMinuteInWindow(at(12), night)).toBe(false);
  });
});

describe('matchesTimeWindow', () => {
  it('matches everything when there is no window', () => {
    expect(matchesTimeWindow('2026-10-10T03:00:00+02:00', null)).toBe(true);
  });

  it('uses Europe/Warsaw local time', () => {
    const evening = TIME_PRESET_WINDOWS.evening;
    expect(matchesTimeWindow('2026-07-10T16:30:00Z', evening)).toBe(true);
    expect(matchesTimeWindow('2026-07-10T15:59:00Z', evening)).toBe(false);
  });
});

describe('validateCustomTime', () => {
  it('defaults an empty end to 04:00', () => {
    expect(validateCustomTime('17:30', '')).toEqual({
      window: { from: at(17, 30), to: at(4) },
    });
  });

  it('rejects an empty start, bad format and equal times', () => {
    expect(validateCustomTime('', '10:00')).toEqual({ error: 'invalid-format' });
    expect(validateCustomTime('25:00', '')).toEqual({ error: 'invalid-format' });
    expect(validateCustomTime('10:00', '10:00')).toEqual({ error: 'same-time' });
    expect(validateCustomTime('04:00', '')).toEqual({ error: 'same-time' });
  });
});
