import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EventSelectionProvider } from '../EventSelectionProvider';
import { buildSchedule } from '../schedule';
import { SCHEDULE_DOM } from '../scheduleDom';
import { SkipLink } from './SkipLink';
import { WeekGrid } from './WeekGrid';

const RANGE = { from: '2026-06-01', to: '2026-06-07' } as const;

describe('skip link and schedule section', () => {
  it('links to a focusable schedule section', () => {
    const schedule = buildSchedule([], { range: RANGE, time: null });
    render(
      <EventSelectionProvider>
        <SkipLink />
        <WeekGrid range={RANGE} timeKey={null} schedule={schedule} />
      </EventSelectionProvider>,
    );

    const link = screen.getByRole('link', { name: 'Przejdź do listy wydarzeń' });
    const section = screen.getByRole('region', { name: 'Program' });

    expect(link).toHaveAttribute('href', `#${SCHEDULE_DOM.sectionId}`);
    expect(section).toHaveAttribute('id', SCHEDULE_DOM.sectionId);

    section.focus();
    expect(section).toHaveFocus();
  });
});
