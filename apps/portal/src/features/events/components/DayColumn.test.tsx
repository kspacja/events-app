import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ScheduleDay } from '../schedule';
import { eventIdSchema, occurrenceIdSchema } from '@events/contract/occurrences';
import type { OccurrenceListing } from '../types';
import { OccurrenceSelectionProvider } from '../OccurrenceSelectionProvider';
import { DayColumn } from './DayColumn';

const LISTING: OccurrenceListing = {
  occurrenceId: occurrenceIdSchema.parse('e1-2026-06-06'),
  startsAt: '2026-06-06T17:00:00Z',
  price: null,
  event: { id: eventIdSchema.parse('e1'), title: 'Koncert jazzowy', category: 'music' },
  venue: { name: 'Klub', city: 'Warszawa', lat: 52, lng: 21 },
};

function makeDay(overrides: Partial<ScheduleDay> = {}): ScheduleDay {
  return {
    day: '2026-06-03',
    weekdayIndex: 2,
    inRange: true,
    isWeekend: false,
    entries: [],
    ...overrides,
  };
}

function renderColumn(scheduleDay: ScheduleDay) {
  return render(
    <OccurrenceSelectionProvider>
      <ol>
        <DayColumn scheduleDay={scheduleDay} />
      </ol>
    </OccurrenceSelectionProvider>,
  );
}

describe('DayColumn', () => {
  it('says nothing matches on an empty in-range day', () => {
    renderColumn(makeDay());

    expect(screen.getByText('Tego dnia nic pasującego.')).toBeInTheDocument();
  });

  it('says the day is outside the range on an empty out-of-range day', () => {
    renderColumn(makeDay({ inRange: false }));

    expect(screen.getByText('Poza wybranym zakresem.')).toBeInTheDocument();
  });

  it('marks events that do not match the time filter as muted', () => {
    renderColumn(makeDay({ entries: [{ listing: LISTING, active: false }] }));

    expect(screen.getByRole('article')).toHaveAttribute('data-muted', 'true');
  });

  it('renders matching events as not muted', () => {
    renderColumn(makeDay({ entries: [{ listing: LISTING, active: true }] }));

    expect(screen.getByRole('article')).toHaveAttribute('data-muted', 'false');
  });

  it('flags weekend days', () => {
    renderColumn(makeDay({ day: '2026-06-06', weekdayIndex: 5, isWeekend: true }));

    expect(screen.getByRole('listitem')).toHaveAttribute('data-weekend', 'true');
  });
});
