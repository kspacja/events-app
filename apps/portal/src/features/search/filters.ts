import { addDays, isCalendarDay } from '@events/time';
import { formatClock } from '@/lib/format';
import {
  DATE_PRESETS,
  MAX_CUSTOM_RANGE_DAYS,
  formatRangeLabel,
  validateCustomRange,
  type DateSearchResult,
} from './dateRange';
import type {
  CustomRangeDefinition,
  CustomRangeOutcome,
  FilterDefinition,
  InputLimits,
} from './filterDefinition';
import {
  CUSTOM_RANGE_LABEL,
  DATE_ERROR_MESSAGES,
  DATE_PICKER_LABELS,
  DATE_PRESET_LABELS,
  TIME_ERROR_MESSAGES,
  TIME_PICKER_LABELS,
  TIME_PRESET_LABELS,
} from './labels';
import {
  TIME_PRESET_WINDOWS,
  TIME_PRESETS,
  formatTimeWindow,
  validateCustomTime,
  type TimeSearchResult,
} from './timeRange';
import type { SearchChange } from './searchQuery';

const MAX_SPAN_DAYS = MAX_CUSTOM_RANGE_DAYS - 1;

function toOutcome<Value extends object, ErrorCode extends string>(
  result: Value | { readonly error: ErrorCode },
  messages: Record<ErrorCode, string>,
  toChange: (value: Value) => SearchChange,
): CustomRangeOutcome {
  if ('error' in result) return { error: messages[result.error] };
  return { change: toChange(result) };
}

function shiftedDay(day: string, amount: number): string | undefined {
  return isCalendarDay(day) ? addDays(day, amount) : undefined;
}

function dateLimits(from: string, to: string) {
  const fromLimits: InputLimits = {
    min: shiftedDay(to, -MAX_SPAN_DAYS),
    max: to || undefined,
  };
  const toLimits: InputLimits = {
    min: from || undefined,
    max: shiftedDay(from, MAX_SPAN_DAYS),
  };
  return { from: fromLimits, to: toLimits };
}

export function dateFilter(search: DateSearchResult): FilterDefinition {
  const activePreset = search.source === 'preset' ? search.preset : null;
  const custom: CustomRangeDefinition = {
    inputType: 'date',
    from: search.range.from,
    to: search.range.to,
    labels: {
      heading: CUSTOM_RANGE_LABEL,
      from: DATE_PICKER_LABELS.from,
      to: DATE_PICKER_LABELS.to,
      submit: DATE_PICKER_LABELS.submit,
    },
    limits: dateLimits,
    validate: (from, to) => {
      return toOutcome(validateCustomRange(from, to), DATE_ERROR_MESSAGES, ({ range }) => ({
        date: range,
      }));
    },
  };

  return {
    chipLabel:
      search.source === 'preset'
        ? DATE_PRESET_LABELS[search.preset]
        : formatRangeLabel(search.range),
    dialogLabel: DATE_PICKER_LABELS.dialog,
    presetsLabel: DATE_PICKER_LABELS.presets,
    presets: DATE_PRESETS.map((preset) => ({
      id: preset,
      label: DATE_PRESET_LABELS[preset],
      pressed: activePreset === preset,
      change: { date: preset },
    })),
    custom,
    resetKey: `${search.range.from}_${search.range.to}`,
  };
}

function timeChipLabel(search: TimeSearchResult): string {
  switch (search.source) {
    case 'all':
      return TIME_PICKER_LABELS.all;
    case 'preset':
      return TIME_PRESET_LABELS[search.preset];
    case 'custom':
      return formatTimeWindow(search.window);
  }
}

export function timeFilter(search: TimeSearchResult): FilterDefinition {
  const customWindow = search.source === 'custom' ? search.window : null;
  const custom: CustomRangeDefinition = {
    inputType: 'time',
    from: customWindow ? formatClock(customWindow.from) : '',
    to: customWindow ? formatClock(customWindow.to) : '',
    labels: {
      heading: CUSTOM_RANGE_LABEL,
      from: TIME_PICKER_LABELS.from,
      to: TIME_PICKER_LABELS.to,
      submit: TIME_PICKER_LABELS.submit,
    },
    validate: (from, to) => {
      return toOutcome(validateCustomTime(from, to), TIME_ERROR_MESSAGES, ({ window }) => ({
        time: window,
      }));
    },
  };

  return {
    chipLabel: timeChipLabel(search),
    dialogLabel: TIME_PICKER_LABELS.dialog,
    presetsLabel: TIME_PICKER_LABELS.presets,
    clear: {
      id: 'all',
      label: TIME_PICKER_LABELS.all,
      pressed: search.source === 'all',
      change: { time: null },
    },
    presets: TIME_PRESETS.map((preset) => ({
      id: preset,
      label: TIME_PRESET_LABELS[preset],
      hint: formatTimeWindow(TIME_PRESET_WINDOWS[preset]),
      pressed: search.source === 'preset' && search.preset === preset,
      change: { time: preset },
    })),
    custom,
    resetKey: search.window ? formatTimeWindow(search.window) : 'all',
  };
}
