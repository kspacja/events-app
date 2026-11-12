import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eventIdSchema, occurrenceIdSchema, type OccurrenceListing } from '@events/contract/listing';
import type { CalendarDay } from '@events/time';
import { OccurrenceSelectionProvider } from '@/features/events/OccurrenceSelectionProvider';
import type { ScheduleDay } from '@/features/events/schedule';
import { MonthGrid } from './MonthGrid';

function listing(id: string, startsAt: string, title: string): OccurrenceListing {
  return {
    occurrenceId: occurrenceIdSchema.parse(id),
    startsAt,
    price: null,
    event: { id: eventIdSchema.parse(id), title, categories: [{ slug: 'theatre', label: 'Teatr' }], forSchools: true },
    venue: { name: 'Teatr', address: 'ul. Testowa 1', city: 'Kraków', lat: 50, lng: 20 },
  };
}

function day(date: CalendarDay, listings: OccurrenceListing[], inRange = true): ScheduleDay {
  return { day: date, weekdayIndex: 0, inRange, isWeekend: false, entries: listings.map((l) => ({ listing: l, active: inRange })) };
}

function renderGrid(days: ScheduleDay[]) {
  return render(
    <OccurrenceSelectionProvider>
      <MonthGrid weeks={[days]} today="2026-11-02" />
    </OccurrenceSelectionProvider>,
  );
}

beforeEach(() => {
  // jsdom does not lay out, so the default number of bars per day applies
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});

describe('MonthGrid', () => {
  it('shows an event as a bar with its time and title', () => {
    renderGrid([day('2026-11-02', [listing('a', '2026-11-02T09:00:00Z', 'Lekcja w muzeum')])]);

    expect(screen.getByRole('button', { name: '10:00 Lekcja w muzeum' })).toBeInTheDocument();
  });

  it('leaves days outside the month without bars', () => {
    renderGrid([day('2026-10-31', [listing('a', '2026-10-31T09:00:00Z', 'Lekcja w muzeum')], false)]);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('keeps the last row of a full day for the rest', () => {
    const many = Array.from({ length: 6 }, (_, i) => listing(`e${i}`, `2026-11-02T0${i}:00:00Z`, `Wydarzenie ${i}`));
    renderGrid([day('2026-11-02', many)]);

    // The day's bars, inside the month's list of days
    const list = screen.getAllByRole('list')[1];
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('+3 więcej')).toBeInTheDocument();
  });

  it('opens the full day in a drawer from "+N więcej", and closes it with Escape', () => {
    const many = Array.from({ length: 6 }, (_, i) => listing(`e${i}`, `2026-11-02T0${i}:00:00Z`, `Wydarzenie ${i}`));
    renderGrid([day('2026-11-02', many)]);

    fireEvent.click(screen.getByRole('button', { name: '+3 więcej' }));
    const drawer = screen.getByRole('dialog', { name: 'poniedziałek, 2 listopada' });
    expect(within(drawer).getAllByRole('article')).toHaveLength(6);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the tile when the bar is tapped', () => {
    renderGrid([day('2026-11-02', [listing('a', '2026-11-02T09:00:00Z', 'Lekcja w muzeum')])]);
    const bar = screen.getByRole('button', { name: '10:00 Lekcja w muzeum' });

    fireEvent.click(bar);

    expect(bar).toHaveAttribute('aria-expanded', 'true');
  });
});
