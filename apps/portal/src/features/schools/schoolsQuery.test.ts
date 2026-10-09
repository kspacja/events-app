import { describe, expect, it } from 'vitest';
import { SCHOOLS_LABELS } from './labels';
import { parseSchoolsQuery } from './schoolsQuery';

// Wednesday 2026-10-14, 12:00 in Warsaw
const NOW = new Date('2026-10-14T10:00:00Z');

describe('parseSchoolsQuery', () => {
  it('starts on today and its month', () => {
    expect(parseSchoolsQuery({}, NOW)).toEqual({ day: '2026-10-14', month: '2026-10', notice: null });
  });

  it('takes a future day and defaults the month to it', () => {
    expect(parseSchoolsQuery({ day: '2026-11-03' }, NOW)).toEqual({ day: '2026-11-03', month: '2026-11', notice: null });
  });

  it('keeps a shown month apart from the day', () => {
    expect(parseSchoolsQuery({ day: '2026-10-20', month: '2026-12' }, NOW).month).toBe('2026-12');
  });

  it('replaces a past day with today and says so', () => {
    expect(parseSchoolsQuery({ day: '2026-10-13' }, NOW)).toEqual({
      day: '2026-10-14',
      month: '2026-10',
      notice: SCHOOLS_LABELS.pastDayNotice,
    });
  });

  it('replaces an unreadable day with today and says so', () => {
    expect(parseSchoolsQuery({ day: 'jutro' }, NOW).notice).toBe(SCHOOLS_LABELS.invalidDayNotice);
  });

  it.each(['2026-09', '2026-13', 'październik'])('shows the day\'s month instead of %s', (month) => {
    expect(parseSchoolsQuery({ day: '2026-11-03', month }, NOW).month).toBe('2026-11');
  });

  it('counts the night before 04:00 as the previous day', () => {
    expect(parseSchoolsQuery({}, new Date('2026-10-14T23:30:00Z')).day).toBe('2026-10-14');
  });
});
