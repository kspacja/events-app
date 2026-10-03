import { describe, expect, it } from 'vitest';
import type { DateSearchResult } from './dateRange';
import { dateFilter, timeFilter } from './filters';
import type { TimeSearchResult } from './timeRange';

const WEEK: DateSearchResult = {
  source: 'preset',
  preset: 'week',
  range: { from: '2026-10-05', to: '2026-10-11' },
  error: null,
};
const CUSTOM: DateSearchResult = {
  source: 'custom',
  range: { from: '2026-10-05', to: '2026-10-09' },
  error: null,
};
const ALL_TIMES: TimeSearchResult = { source: 'all', window: null, error: null };
const MORNING: TimeSearchResult = {
  source: 'preset',
  preset: 'morning',
  window: { from: 360, to: 660 },
  error: null,
};
const CUSTOM_TIME: TimeSearchResult = {
  source: 'custom',
  window: { from: 1080, to: 1260 },
  error: null,
};

describe('dateFilter', () => {
  it('labels the chip by preset and by custom range', () => {
    expect(dateFilter(WEEK).chipLabel).toBe('w tym tygodniu');
    expect(dateFilter(CUSTOM).chipLabel).toBe('5—9.10');
  });

  it('presses only the active preset', () => {
    const pressed = dateFilter(WEEK).presets.filter((p) => p.pressed);
    expect(pressed.map((p) => p.id)).toEqual(['week']);
    expect(dateFilter(CUSTOM).presets.some((p) => p.pressed)).toBe(false);
  });

  it('has no clear option and no hints', () => {
    const { clear, presets } = dateFilter(WEEK);
    expect(clear).toBeUndefined();
    expect(presets.some((p) => p.hint)).toBe(false);
    expect(presets[0].change).toEqual({ date: 'today' });
  });

  it('seeds the custom form and reset key from the range', () => {
    const definition = dateFilter(CUSTOM);
    expect(definition.custom).toMatchObject({
      inputType: 'date',
      from: '2026-10-05',
      to: '2026-10-09',
    });
    expect(definition.resetKey).toBe('2026-10-05_2026-10-09');
  });

  it('validates the custom range', () => {
    const { validate } = dateFilter(WEEK).custom!;
    expect(validate('2026-10-05', '2026-10-09')).toEqual({
      change: { date: { from: '2026-10-05', to: '2026-10-09' } },
    });
    expect(validate('', '2026-10-09')).toEqual({ error: 'Wybierz obie daty.' });
    expect(validate('2026-10-09', '2026-10-05')).toEqual({
      error: 'Data „od” nie może być późniejsza niż „do”.',
    });
    expect(validate('2026-10-01', '2026-12-01')).toEqual({
      error: 'Przedział może mieć najwyżej 31 dni.',
    });
  });

  it('derives min/max from the current inputs', () => {
    const { limits } = dateFilter(WEEK).custom!;
    expect(limits!('2026-10-05', '2026-10-31')).toEqual({
      from: { min: '2026-10-01', max: '2026-10-31' },
      to: { min: '2026-10-05', max: '2026-11-04' },
    });
    expect(limits!('', '')).toEqual({
      from: { min: undefined, max: undefined },
      to: { min: undefined, max: undefined },
    });
  });
});

describe('timeFilter', () => {
  it('labels the chip for all, preset and custom', () => {
    expect(timeFilter(ALL_TIMES).chipLabel).toBe('o każdej porze');
    expect(timeFilter(MORNING).chipLabel).toBe('rano');
    expect(timeFilter(CUSTOM_TIME).chipLabel).toBe('18:00–21:00');
  });

  it('exposes the clear option and its pressed state', () => {
    expect(timeFilter(ALL_TIMES).clear).toMatchObject({
      label: 'o każdej porze',
      pressed: true,
      change: { time: null },
    });
    expect(timeFilter(MORNING).clear?.pressed).toBe(false);
  });

  it('presses only the active preset', () => {
    const pressed = timeFilter(MORNING).presets.filter((p) => p.pressed);
    expect(pressed.map((p) => p.id)).toEqual(['morning']);
  });

  it('provides hour hints', () => {
    const hints = timeFilter(ALL_TIMES).presets.map((p) => p.hint);
    expect(hints).toEqual([
      '06:00–11:00',
      '11:00–14:00',
      '14:00–18:00',
      '18:00–22:00',
      '22:00–04:00',
    ]);
  });

  it('seeds the custom form only for custom windows', () => {
    expect(timeFilter(MORNING).custom).toMatchObject({ from: '', to: '' });
    expect(timeFilter(CUSTOM_TIME).custom).toMatchObject({
      inputType: 'time',
      from: '18:00',
      to: '21:00',
    });
    expect(timeFilter(ALL_TIMES).resetKey).toBe('all');
    expect(timeFilter(CUSTOM_TIME).resetKey).toBe('18:00–21:00');
  });

  it('has no input limits', () => {
    expect(timeFilter(ALL_TIMES).custom?.limits).toBeUndefined();
  });

  it('validates the custom window', () => {
    const { validate } = timeFilter(ALL_TIMES).custom!;
    expect(validate('18:00', '21:00')).toEqual({
      change: { time: { from: 1080, to: 1260 } },
    });
    expect(validate('22:00', '')).toEqual({
      change: { time: { from: 1320, to: 240 } },
    });
    expect(validate('', '21:00')).toEqual({ error: 'Wybierz godzinę „od”.' });
    expect(validate('10:00', '10:00')).toEqual({
      error: 'Godziny „od” i „do” nie mogą być takie same.',
    });
  });
});
