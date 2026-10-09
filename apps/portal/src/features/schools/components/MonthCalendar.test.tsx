import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CalendarDay } from '@events/time';
import { buildMonthCalendar } from '../monthCalendar';
import { MonthCalendar } from './MonthCalendar';

const TODAY: CalendarDay = '2026-10-14';
const SELECTED: CalendarDay = '2026-10-19';

function renderCalendar(month: '2026-10' | '2026-11' = '2026-10') {
  const calendar = buildMonthCalendar({
    month,
    today: TODAY,
    selectedWeek: SELECTED,
    counts: new Map([
      ['2026-10-14', 2],
      ['2026-10-21', 6],
    ]),
  });
  return render(<MonthCalendar calendar={calendar} selectedWeek={SELECTED} today={TODAY} />);
}

describe('MonthCalendar', () => {
  it('names the month', () => {
    renderCalendar();

    expect(screen.getByRole('heading', { name: 'październik 2026' })).toBeInTheDocument();
  });

  it('links a day to its week and month, scrolled to the day', () => {
    renderCalendar();

    expect(screen.getByRole('link', { name: 'środa, 21 października, 6 wydarzeń' })).toHaveAttribute(
      'href',
      '/dla-szkol?week=2026-10-19&month=2026-10#day-2026-10-21',
    );
  });

  it('links a day of the next month to that month', () => {
    renderCalendar();

    expect(screen.getByRole('link', { name: 'niedziela, 1 listopada, brak wydarzeń' })).toHaveAttribute(
      'href',
      '/dla-szkol?week=2026-10-26&month=2026-11#day-2026-11-01',
    );
  });

  it('shows past days without a link', () => {
    renderCalendar();

    expect(screen.queryByRole('link', { name: /wtorek, 13 października/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText('wtorek, 13 października')).toBeInTheDocument();
  });

  it('marks today', () => {
    renderCalendar();

    expect(screen.getByRole('link', { name: 'środa, 14 października, 2 wydarzenia' })).toHaveAttribute(
      'aria-current',
      'date',
    );
  });

  it('shows 3 dots and the rest as a number from 5 events on', () => {
    renderCalendar();

    expect(screen.getByRole('link', { name: /21 października/ })).toHaveTextContent('21+3');
  });

  it('keeps the selected week when changing months, and cannot go before the current month', () => {
    renderCalendar();

    expect(screen.queryByRole('link', { name: 'Poprzedni miesiąc' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Następny miesiąc' })).toHaveAttribute(
      'href',
      '/dla-szkol?week=2026-10-19&month=2026-11',
    );
  });

  it('goes back to the current week and month with "Dziś"', () => {
    renderCalendar('2026-11');

    expect(screen.getByRole('link', { name: 'Dziś' })).toHaveAttribute('href', '/dla-szkol?week=2026-10-12&month=2026-10');
    expect(screen.getByRole('link', { name: 'Poprzedni miesiąc' })).toHaveAttribute(
      'href',
      '/dla-szkol?week=2026-10-19&month=2026-10',
    );
  });
});
