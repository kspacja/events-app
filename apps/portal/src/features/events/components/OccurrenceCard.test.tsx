import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { EventSelectionProvider, useEventSelection } from '../EventSelectionProvider';
import { eventIdSchema, occurrenceIdSchema } from '@events/contract/occurrences';
import type { OccurrenceListing } from '../types';
import { OccurrenceCard } from './OccurrenceCard';

const LISTING: OccurrenceListing = {
  occurrenceId: occurrenceIdSchema.parse('e1-2026-06-06'),
  startsAt: '2026-06-06T17:00:00Z',
  price: null,
  event: { id: eventIdSchema.parse('e1'), title: 'Koncert jazzowy', category: 'music' },
  venue: { name: 'Klub', city: 'Warszawa', lat: 52, lng: 21 },
};

function SelectionProbe() {
  const selection = useEventSelection();
  return <output>{selection ? `${selection.source}:${selection.occurrenceId}` : 'none'}</output>;
}

function renderCard(muted = false) {
  return render(
    <EventSelectionProvider>
      <OccurrenceCard listing={LISTING} muted={muted} />
      <SelectionProbe />
    </EventSelectionProvider>,
  );
}

describe('OccurrenceCard', () => {
  it('exposes a pin button named after the event', () => {
    renderCard();

    expect(
      screen.getByRole('button', { name: 'Pokaż na mapie: Koncert jazzowy' }),
    ).toBeInTheDocument();
  });

  it('keeps the pin button on muted cards', () => {
    renderCard(true);

    expect(
      screen.getByRole('button', { name: 'Pokaż na mapie: Koncert jazzowy' }),
    ).toBeInTheDocument();
  });

  it('selects the occurrence for the map when the pin is clicked', async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole('button', { name: /Pokaż na mapie/ }));

    expect(screen.getByRole('status')).toHaveTextContent('card:e1-2026-06-06');
  });

  it('selects the occurrence when the pin is activated from the keyboard', async () => {
    const user = userEvent.setup();
    renderCard();

    await user.tab();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('status')).toHaveTextContent('card:e1-2026-06-06');
  });

  it('tells screen readers that a muted event is outside the chosen period', () => {
    renderCard(true);

    expect(
      screen.getByRole('heading', { name: 'Koncert jazzowy (poza wybranym terminem)' }),
    ).toBeInTheDocument();
  });

  it('adds no extra text to a matching event', () => {
    renderCard(false);

    expect(screen.getByRole('heading', { name: 'Koncert jazzowy' })).toBeInTheDocument();
  });
});
