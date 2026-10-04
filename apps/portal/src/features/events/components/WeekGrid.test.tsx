import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OccurrenceSelectionProvider } from '../OccurrenceSelectionProvider';
import { buildSchedule } from '../schedule';
import { SCHEDULE_SECTION_ID } from '../scheduleDom';
import { SkipLink } from './SkipLink';
import { WeekGrid } from './WeekGrid';

const RANGE = { from: '2026-06-01', to: '2026-06-07' } as const;

describe('skip link and schedule section', () => {
  it('links to a focusable schedule section', () => {
    const schedule = buildSchedule([], { range: RANGE, time: null });
    render(
      <OccurrenceSelectionProvider>
        <SkipLink />
        <WeekGrid schedule={schedule} />
      </OccurrenceSelectionProvider>,
    );

    const link = screen.getByRole('link', { name: 'Przejdź do listy wydarzeń' });
    const section = screen.getByRole('region', { name: 'Program' });

    expect(link).toHaveAttribute('href', `#${SCHEDULE_SECTION_ID}`);
    expect(section).toHaveAttribute('id', SCHEDULE_SECTION_ID);

    section.focus();
    expect(section).toHaveFocus();
  });
});
