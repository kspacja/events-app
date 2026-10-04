import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { occurrenceIdSchema } from '@events/contract/occurrences';
import { OccurrenceSelectionProvider, useOccurrenceSelection } from '../OccurrenceSelectionProvider';
import { MapToggle } from './MapToggle';

const OCCURRENCE_ID = occurrenceIdSchema.parse('e1-2026-06-06');

function renderToggle() {
  return render(
    <OccurrenceSelectionProvider>
      <MapToggle>map content</MapToggle>
      <RequestButton />
    </OccurrenceSelectionProvider>,
  );
}

function RequestButton() {
  const selection = useOccurrenceSelection();
  return (
    <button
      type="button"
      onClick={() => selection.selectFromCard(OCCURRENCE_ID, () => {})}
    >
      request
    </button>
  );
}

describe('MapToggle', () => {
  afterEach(() => {
    // jsdom has no scrollIntoView, so the stub is removed rather than restored
    Reflect.deleteProperty(window.HTMLElement.prototype, 'scrollIntoView');
  });

  it('exposes the toggle button by its accessible name', () => {
    renderToggle();

    expect(screen.getByRole('button', { name: 'Mapa' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('expands the panel and relabels the button when clicked', async () => {
    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole('button', { name: 'Mapa' }));

    expect(screen.getByRole('button', { name: 'Ukryj mapę' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('figure', { name: 'Mapa wydarzeń' })).toHaveAttribute(
      'data-expanded',
      'true',
    );
    expect(screen.getByText('map content')).toBeInTheDocument();
  });

  it('collapses again on a second click', async () => {
    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole('button', { name: 'Mapa' }));
    await user.click(screen.getByRole('button', { name: 'Ukryj mapę' }));

    expect(screen.getByRole('button', { name: 'Mapa' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByText('map content')).not.toBeInTheDocument();
  });

  it('expands when an event card asks to be shown on the map', async () => {
    const user = userEvent.setup();
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: () => {},
    });
    renderToggle();

    await user.click(screen.getByRole('button', { name: 'request' }));

    expect(screen.getByRole('button', { name: 'Ukryj mapę' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('describes the map for screen readers', () => {
    renderToggle();

    expect(screen.getByRole('figure', { name: 'Mapa wydarzeń' })).toHaveAccessibleDescription(
      'Te same wydarzenia są dostępne na liście poniżej.',
    );
  });
});
