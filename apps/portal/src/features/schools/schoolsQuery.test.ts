import { describe, expect, it } from 'vitest';
import { SCHOOLS_LABELS } from './labels';
import { parseSchoolsQuery } from './schoolsQuery';

// Wednesday 2026-10-14, 12:00 in Warsaw
const NOW = new Date('2026-10-14T10:00:00Z');

describe('parseSchoolsQuery', () => {
  it('starts on the current week and its month', () => {
    expect(parseSchoolsQuery({}, NOW)).toMatchObject({ week: '2026-10-12', month: '2026-10', notice: null });
  });

  it('shows the Monday of the week of the given day', () => {
    expect(parseSchoolsQuery({ week: '2026-11-03' }, NOW)).toMatchObject({ week: '2026-11-02', month: '2026-11', notice: null });
  });

  it('keeps a shown month apart from the week', () => {
    expect(parseSchoolsQuery({ week: '2026-10-21', month: '2026-12' }, NOW).month).toBe('2026-12');
  });

  it('keeps a past week, so it can be shown', () => {
    expect(parseSchoolsQuery({ week: '2026-10-01' }, NOW)).toMatchObject({ week: '2026-09-28', notice: null });
  });

  it('shows the week Monday to Sunday', () => {
    expect(parseSchoolsQuery({ week: '2026-10-22' }, NOW).range).toEqual({ from: '2026-10-19', to: '2026-10-25' });
  });

  it('replaces an unreadable week with the current one and says so', () => {
    expect(parseSchoolsQuery({ week: 'jutro' }, NOW)).toMatchObject({
      week: '2026-10-12',
      notice: SCHOOLS_LABELS.invalidDayNotice,
    });
  });

  it.each(['2026-09', '2026-13', 'październik'])('shows the week\'s month instead of %s', (month) => {
    expect(parseSchoolsQuery({ week: '2026-11-03', month }, NOW).month).toBe('2026-11');
  });

  it('counts the night before 04:00 as the previous day', () => {
    expect(parseSchoolsQuery({}, new Date('2026-10-14T23:30:00Z')).week).toBe('2026-10-12');
  });
});
