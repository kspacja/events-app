import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { EventSelectionProvider, useEventSelectionStore } from '../EventSelectionProvider';
import { MapToggle } from './MapToggle';

function renderToggle() {
  return render(
    <EventSelectionProvider>
      <MapToggle>map content</MapToggle>
      <RequestButton />
    </EventSelectionProvider>,
  );
}

function RequestButton() {
  const store = useEventSelectionStore();
  return (
    <button
      type="button"
      onClick={(event) => store.selectFromCard('e1', event.currentTarget)}
    >
      request
    </button>
  );
}

describe('MapToggle', () => {
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
    window.HTMLElement.prototype.scrollIntoView = () => {};
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
