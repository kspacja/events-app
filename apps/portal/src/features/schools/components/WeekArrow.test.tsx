import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WeekArrow } from './WeekArrow';

describe('WeekArrow', () => {
  it('links to the next week', () => {
    render(<WeekArrow direction={1} week="2026-10-19" />);

    expect(screen.getByRole('link', { name: 'Następny tydzień' })).toHaveAttribute('href', '/dla-szkol/2026-10-26');
  });

  it('hands the click to the page with the target week', async () => {
    const onNavigate = vi.fn();
    render(<WeekArrow direction={-1} week="2026-10-19" onNavigate={onNavigate} />);

    await userEvent.click(screen.getByRole('link', { name: 'Poprzedni tydzień' }));

    expect(onNavigate).toHaveBeenCalledWith('2026-10-12');
  });
});
