import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eventIdSchema, occurrenceIdSchema, type OccurrenceListing } from '@events/contract/listing';
import type { CalendarDay } from '@events/time';
import { OccurrenceSelectionProvider } from '@/features/events/OccurrenceSelectionProvider';
import type { ScheduleDay } from '@/features/events/schedule';
import { MonthGrid } from './MonthGrid';

// The dialog reads ?wydarzenie= from the address, as Next's useSearchParams would
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
  // The Miejscowość picker in the caption navigates; these tests never choose one
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => window.location.pathname,
}));

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
      <MonthGrid month="2026-11" weeks={[days]} today="2026-11-02" />
    </OccurrenceSelectionProvider>,
  );
}

beforeEach(() => {
  // jsdom does not lay out, so the default number of bars per day applies
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  window.history.replaceState(null, '', '/dla-szkol/miesiac/2026-11?wiek=1-3');
});

describe('MonthGrid', () => {
  it('shows an event as a bar with its time and title', () => {
    renderGrid([day('2026-11-02', [listing('a', '2026-11-02T09:00:00Z', 'Lekcja w muzeum')])]);

    expect(screen.getByRole('button', { name: '10:00 Lekcja w muzeum' })).toBeInTheDocument();
  });

  it('leaves days outside the month without bars', () => {
    renderGrid([day('2026-10-31', [listing('a', '2026-10-31T09:00:00Z', 'Lekcja w muzeum')], false)]);

    expect(screen.queryByRole('button', { name: /Lekcja/ })).not.toBeInTheDocument();
  });

  it('notes "brak wydarzeń" in an empty day of the month, but not outside it', () => {
    const { container } = renderGrid([day('2026-11-02', []), day('2026-10-31', [], false)]);

    // Drawn by CSS from the attribute, under the day's number
    const notes = [...container.querySelectorAll('[data-empty-note]')].map((list) => list.getAttribute('data-empty-note'));
    expect(notes).toEqual(['brak wydarzeń']);
  });

  it('shows as many bars as fit and the rest behind "+N więcej"', () => {
    const many = Array.from({ length: 6 }, (_, i) => listing(`e${i}`, `2026-11-02T0${i}:00:00Z`, `Wydarzenie ${i}`));
    renderGrid([day('2026-11-02', many)]);

    // The day's bars, inside the month's list of days
    const list = screen.getAllByRole('list')[1];
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByRole('button', { name: '+2 więcej' })).toBeInTheDocument();
  });

  it('opens the full day in a drawer from "+N więcej", and slides it out on Escape', () => {
    const many = Array.from({ length: 6 }, (_, i) => listing(`e${i}`, `2026-11-02T0${i}:00:00Z`, `Wydarzenie ${i}`));
    renderGrid([day('2026-11-02', many)]);

    fireEvent.click(screen.getByRole('button', { name: '+2 więcej' }));
    const drawer = screen.getByRole('dialog', { name: 'poniedziałek, 2 listopada' });
    expect(within(drawer).getAllByRole('article')).toHaveLength(6);

    fireEvent.keyDown(document, { key: 'Escape' });
    // It slides out first, and goes once the slide ends
    expect(drawer).toHaveAttribute('data-closing');
    fireEvent.animationEnd(drawer);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens a day whose bars all fit from "pokaż dzień"', () => {
    renderGrid([day('2026-11-02', [listing('a', '2026-11-02T09:00:00Z', 'Lekcja w muzeum')])]);

    fireEvent.click(screen.getByRole('button', { name: 'pokaż dzień' }));

    expect(screen.getByRole('dialog', { name: 'poniedziałek, 2 listopada' })).toBeInTheDocument();
  });

  it('switches months from the arrows beside the month name', () => {
    renderGrid([day('2026-11-02', [])]);

    expect(screen.getByRole('link', { name: 'Następny miesiąc' })).toHaveAttribute('href', '/dla-szkol/miesiac/2026-12');
    // The current month is the earliest one: the way back is shown, but not a link
    expect(screen.queryByRole('link', { name: 'Poprzedni miesiąc' })).not.toBeInTheDocument();
  });

  it('puts the clicked event into the address, beside the filters', () => {
    renderGrid([day('2026-11-02', [listing('a', '2026-11-02T09:00:00Z', 'Lekcja w muzeum')])]);

    fireEvent.click(screen.getByRole('button', { name: '10:00 Lekcja w muzeum' }));

    expect(window.location.search).toBe('?wiek=1-3&wydarzenie=a');
  });

  it('opens the details of the event named in the address', () => {
    window.history.replaceState(null, '', '/dla-szkol/miesiac/2026-11?wydarzenie=a');
    const event = {
      ...listing('a', '2026-11-02T09:00:00Z', 'Lekcja w muzeum'),
      price: { kind: 'free' as const },
    };
    renderGrid([
      day('2026-11-02', [
        {
          ...event,
          event: {
            ...event.event,
            description: 'Pierwszy akapit.\n\nDrugi akapit.',
            school: { ages: ['1-3'], subjects: ['historia'], groupSizes: [], kinds: ['jednorazowe'] },
          },
        },
      ]),
    ]);

    const details = within(screen.getByRole('dialog', { hidden: true }));
    expect(details.getByRole('heading', { name: 'Lekcja w muzeum', hidden: true })).toBeInTheDocument();
    expect(details.getByText('bezpłatne')).toBeInTheDocument();
    expect(details.getByText('Klasy 1–3')).toBeInTheDocument();
    expect(details.getByText('historia')).toBeInTheDocument();
    expect(details.queryByText('Liczba uczestników')).not.toBeInTheDocument();
    expect(details.getByText('Drugi akapit.')).toBeInTheDocument();
    expect(details.getByRole('button', { name: 'Skontaktuj się', hidden: true })).toBeInTheDocument();
  });
});
