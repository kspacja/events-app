import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CalendarDay } from '@events/time';
import { buildMonthCalendar } from '../monthCalendar';
import { MonthCalendar } from './MonthCalendar';

const TODAY: CalendarDay = '2026-10-14';
const SHOWN_WEEK: CalendarDay = '2026-10-19';

function renderCalendar(month: '2026-10' | '2026-11' = '2026-10') {
  const calendar = buildMonthCalendar({
    month,
    today: TODAY,
    selectedWeek: SHOWN_WEEK,
    counts: new Map([
      ['2026-10-14', 2],
      ['2026-10-21', 6],
    ]),
  });
  return render(<MonthCalendar calendar={calendar} shownWeek={SHOWN_WEEK} today={TODAY} />);
}

describe('MonthCalendar', () => {
  it('names the month', () => {
    renderCalendar();

    expect(screen.getByRole('heading', { name: 'październik 2026' })).toBeInTheDocument();
  });

  it('links a day to its week and to its column in the strip', () => {
    renderCalendar();

    expect(screen.getByRole('link', { name: 'środa, 21 października, 6 wydarzeń, wybrany tydzień' })).toHaveAttribute(
      'href',
      '/dla-szkol?week=2026-10-19&preview-month=2026-10#day-2026-10-21',
    );
  });

  it('links a day of the next month to its own week and month', () => {
    renderCalendar();

    expect(screen.getByRole('link', { name: 'niedziela, 1 listopada, brak wydarzeń' })).toHaveAttribute(
      'href',
      '/dla-szkol?week=2026-10-26&preview-month=2026-11#day-2026-11-01',
    );
  });

  it('shows past days without a link', () => {
    renderCalendar();

    expect(screen.queryByRole('link', { name: /wtorek, 13 października/ })).not.toBeInTheDocument();
    expect(screen.getByText('wtorek, 13 października, dzień minął')).toBeInTheDocument();
  });

  it('marks today', () => {
    renderCalendar();

    expect(screen.getByRole('link', { name: 'środa, 14 października, 2 wydarzenia, bieżący tydzień' })).toHaveAttribute(
      'aria-current',
      'date',
    );
  });

  it('shows 3 dots and the rest as a number from 5 events on', () => {
    renderCalendar();

    expect(screen.getByRole('link', { name: /21 października/ })).toHaveTextContent('21+3');
  });

  it('cannot go before the current month', () => {
    renderCalendar();

    expect(screen.queryByRole('link', { name: 'Poprzedni miesiąc' })).not.toBeInTheDocument();
  });

  it('keeps the shown week when changing months', () => {
    renderCalendar();

    expect(screen.getByRole('link', { name: 'Następny miesiąc' })).toHaveAttribute(
      'href',
      '/dla-szkol?week=2026-10-19&preview-month=2026-11',
    );
  });

  it('goes back to the current week and month with "Obecny tydz."', () => {
    renderCalendar('2026-11');

    expect(screen.getByRole('link', { name: 'Obecny tydz.' })).toHaveAttribute(
      'href',
      '/dla-szkol?week=2026-10-12&preview-month=2026-10',
    );
  });

  it('goes back a month once ahead of the current one', () => {
    renderCalendar('2026-11');

    expect(screen.getByRole('link', { name: 'Poprzedni miesiąc' })).toHaveAttribute(
      'href',
      '/dla-szkol?week=2026-10-19&preview-month=2026-10',
    );
  });

  it('is a table labelled by the month, with full day names for screen readers', () => {
    renderCalendar();
    const table = screen.getByRole('table', { name: 'październik 2026' });

    for (const name of ['Poniedziałek', 'Czwartek', 'Niedziela']) {
      expect(within(table).getByRole('columnheader', { name })).toBeInTheDocument();
    }
  });

  it('says which week is the current one and which is shown', () => {
    renderCalendar();

    expect(screen.getByRole('link', { name: /^czwartek, 15 października, .*, bieżący tydzień$/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^czwartek, 22 października, .*, wybrany tydzień$/ })).toBeInTheDocument();
  });
});
