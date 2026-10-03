import { z } from 'zod';
import { formatClock } from '@/features/time/localTime';
import {
  DATE_PRESETS,
  resolvePreset,
  validateCustomRange,
  type DatePreset,
  type DateRange,
  type DateSearchError,
  type DateSearchResult,
} from './dateRange';
import {
  INVALID_RANGE_NOTICE,
  INVALID_SEARCH_NOTICE,
  INVALID_TIME_NOTICE,
} from './labels';
import {
  TIME_PRESET_WINDOWS,
  TIME_PRESETS,
  validateCustomTime,
  type TimePreset,
  type TimeSearchError,
  type TimeSearchResult,
  type TimeWindow,
} from './timeRange';

export type SearchParamsInput = Readonly<
  Record<string, string | readonly string[] | undefined>
>;

export interface SearchQuery {
  readonly date: DateSearchResult;
  readonly time: TimeSearchResult;
  readonly notice: string | null;
}

export type SearchChange =
  | { readonly date: DatePreset | DateRange }
  | { readonly time: TimePreset | TimeWindow | null };

const DATE_PARAM_KEYS = ['when', 'from', 'to'] as const;
const TIME_PARAM_KEYS = ['time', 'timeFrom', 'timeTo'] as const;

function firstValue(value: string | readonly string[] | undefined) {
  return typeof value === 'string' ? value : value?.[0];
}

const datePresetSchema = z.enum(DATE_PRESETS);
const timePresetSchema = z.enum(TIME_PRESETS);

function weekFallback(now: Date, error: DateSearchError | null): DateSearchResult {
  return {
    source: 'preset',
    preset: 'week',
    range: resolvePreset('week', now),
    error,
  };
}

function allTimes(error: TimeSearchError | null): TimeSearchResult {
  return { source: 'all', window: null, error };
}

function parseDate(params: SearchParamsInput, now: Date): DateSearchResult {
  const when = firstValue(params.when);
  const from = firstValue(params.from);
  const to = firstValue(params.to);

  if (when !== undefined) {
    const parsed = datePresetSchema.safeParse(when);
    if (!parsed.success) return weekFallback(now, 'invalid-preset');
    return {
      source: 'preset',
      preset: parsed.data,
      range: resolvePreset(parsed.data, now),
      error: null,
    };
  }

  if (from === undefined && to === undefined) return weekFallback(now, null);
  if (from === undefined || to === undefined) {
    return weekFallback(now, 'invalid-format');
  }

  const validated = validateCustomRange(from, to);
  if ('error' in validated) return weekFallback(now, validated.error);
  return { source: 'custom', range: validated.range, error: null };
}

function parseTime(params: SearchParamsInput): TimeSearchResult {
  const preset = firstValue(params.time);
  const from = firstValue(params.timeFrom);
  const to = firstValue(params.timeTo);

  if (preset !== undefined) {
    const parsed = timePresetSchema.safeParse(preset);
    if (!parsed.success) return allTimes('invalid-preset');
    return {
      source: 'preset',
      preset: parsed.data,
      window: TIME_PRESET_WINDOWS[parsed.data],
      error: null,
    };
  }

  if (from === undefined && to === undefined) return allTimes(null);
  if (from === undefined) return allTimes('invalid-format');

  const validated = validateCustomTime(from, to ?? '');
  if ('error' in validated) return allTimes(validated.error);
  return { source: 'custom', window: validated.window, error: null };
}

function noticeFor(hasDateError: boolean, hasTimeError: boolean): string | null {
  if (hasDateError && hasTimeError) return INVALID_SEARCH_NOTICE;
  if (hasDateError) return INVALID_RANGE_NOTICE;
  if (hasTimeError) return INVALID_TIME_NOTICE;
  return null;
}

function toRecord(params: SearchParamsInput | URLSearchParams): SearchParamsInput {
  if (!(params instanceof URLSearchParams)) return params;
  const record: Record<string, string> = {};
  for (const [key, value] of params) record[key] ??= value;
  return record;
}

export function parseSearchQuery(
  params: SearchParamsInput | URLSearchParams,
  now: Date,
): SearchQuery {
  const record = toRecord(params);
  const date = parseDate(record, now);
  const time = parseTime(record);
  return {
    date,
    time,
    notice: noticeFor(date.error !== null, time.error !== null),
  };
}

function dateParams(input: DatePreset | DateRange): URLSearchParams {
  if (typeof input === 'string') return new URLSearchParams({ when: input });
  return new URLSearchParams({ from: input.from, to: input.to });
}

function timeParams(input: TimePreset | TimeWindow | null): URLSearchParams {
  if (input === null) return new URLSearchParams();
  if (typeof input === 'string') return new URLSearchParams({ time: input });
  return new URLSearchParams({
    timeFrom: formatClock(input.from),
    timeTo: formatClock(input.to),
  });
}

function replaceKeys(
  current: URLSearchParams,
  ownKeys: readonly string[],
  next: URLSearchParams,
): URLSearchParams {
  const merged = new URLSearchParams(current);
  for (const key of ownKeys) merged.delete(key);
  for (const [key, value] of next) merged.set(key, value);
  return merged;
}

export function hrefFor(
  pathname: string,
  current: URLSearchParams | string,
  change: SearchChange,
): string {
  const base = new URLSearchParams(current);
  const next =
    'date' in change
      ? replaceKeys(base, DATE_PARAM_KEYS, dateParams(change.date))
      : replaceKeys(base, TIME_PARAM_KEYS, timeParams(change.time));
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}
