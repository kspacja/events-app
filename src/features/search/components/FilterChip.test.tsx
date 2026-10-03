import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dateFilter } from '../filters';
import { FilterChip } from './FilterChip';

vi.mock('next/navigation', async () => (await import('@/test/nextNavigation')).nextNavigationMock);

import { push } from '@/test/nextNavigation';

const WEEK_SEARCH = {
  source: 'preset',
  preset: 'week',
  range: { from: '2026-10-05', to: '2026-10-11' },
  error: null,
} as const;

function renderChip() {
  render(<FilterChip definition={dateFilter(WEEK_SEARCH)} />);
}

function presetsList() {
  return within(screen.getByRole('list', { name: 'Gotowe terminy', hidden: true }));
}

describe('FilterChip', () => {
  beforeEach(() => push.mockClear());

  it('reports itself as expanded once opened', async () => {
    const user = userEvent.setup();
    renderChip();

    const chip = screen.getByRole('button', { name: /w tym tygodniu/ });
    expect(chip).toHaveAttribute('aria-expanded', 'false');
    await user.click(chip);

    expect(chip).toHaveAttribute('aria-expanded', 'true');
  });

  it('marks only the active preset as pressed', async () => {
    const user = userEvent.setup();
    renderChip();

    await user.click(screen.getByRole('button', { name: /w tym tygodniu/ }));

    expect(
      presetsList().getByRole('button', { name: 'w tym tygodniu', hidden: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(presetsList().getByRole('button', { name: 'jutro', hidden: true })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('pushes the href of a clicked preset', async () => {
    const user = userEvent.setup();
    renderChip();

    await user.click(screen.getByRole('button', { name: /w tym tygodniu/ }));
    await user.click(presetsList().getByRole('button', { name: 'jutro', hidden: true }));

    expect(push).toHaveBeenCalledWith('/?when=tomorrow', { scroll: false });
  });
});
