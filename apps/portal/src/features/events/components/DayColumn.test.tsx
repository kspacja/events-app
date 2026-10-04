import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ScheduleDay } from '../schedule';
import type { Event } from '../types';
import { EventSelectionProvider } from '../EventSelectionProvider';
import { DayColumn } from './DayColumn';

const EVENT: Event = {
  id: 'e1',
  startsAt: '2026-06-06T17:00:00Z',
  title: 'Koncert jazzowy',
  venue: { name: 'Klub', city: 'Warszawa', lat: 52, lng: 21 },
  category: 'music',
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
    <EventSelectionProvider>
      <ol>
        <DayColumn scheduleDay={scheduleDay} />
      </ol>
    </EventSelectionProvider>,
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
    renderColumn(makeDay({ entries: [{ event: EVENT, active: false }] }));

    expect(screen.getByRole('article')).toHaveAttribute('data-muted', 'true');
  });

  it('renders matching events as not muted', () => {
    renderColumn(makeDay({ entries: [{ event: EVENT, active: true }] }));

    expect(screen.getByRole('article')).toHaveAttribute('data-muted', 'false');
  });

  it('flags weekend days', () => {
    renderColumn(makeDay({ day: '2026-06-06', weekdayIndex: 5, isWeekend: true }));

    expect(screen.getByRole('listitem')).toHaveAttribute('data-weekend', 'true');
  });
});
