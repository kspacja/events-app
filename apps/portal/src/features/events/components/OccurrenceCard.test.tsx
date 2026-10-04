import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { OccurrenceSelectionProvider, useOccurrenceSelectionInstructions } from '../OccurrenceSelectionProvider';
import {
  eventIdSchema,
  occurrenceIdSchema,
  type OccurrenceListing,
} from '@events/contract/listing';
import { OccurrenceCard } from './OccurrenceCard';

const LISTING: OccurrenceListing = {
  occurrenceId: occurrenceIdSchema.parse('e1-2026-06-06'),
  startsAt: '2026-06-06T17:00:00Z',
  price: null,
  event: { id: eventIdSchema.parse('e1'), title: 'Koncert jazzowy', category: { slug: 'music', label: 'Muzyka' } },
  venue: { name: 'Klub', city: 'Warszawa', lat: 52, lng: 21 },
};

const CARD_SELECTION = JSON.stringify({ occurrenceId: LISTING.occurrenceId, takeFocus: true });

function SelectionProbe() {
  const { popup } = useOccurrenceSelectionInstructions();
  const instruction = popup && { occurrenceId: popup.occurrenceId, takeFocus: popup.takeFocus };
  return <output>{JSON.stringify(instruction)}</output>;
}

function renderCard(muted = false) {
  return render(
    <OccurrenceSelectionProvider>
      <OccurrenceCard listing={LISTING} muted={muted} />
      <SelectionProbe />
    </OccurrenceSelectionProvider>,
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

    expect(screen.getByRole('status')).toHaveTextContent(CARD_SELECTION);
  });

  it('selects the occurrence when the pin is activated from the keyboard', async () => {
    const user = userEvent.setup();
    renderCard();

    await user.tab();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('status')).toHaveTextContent(CARD_SELECTION);
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
