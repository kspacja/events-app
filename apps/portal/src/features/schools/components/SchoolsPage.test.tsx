import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createSampleEvents, toListings } from '@events/repo';
import { SAMPLE_SCHOOL_OCCURRENCES_IN_FIRST_WEEK } from '@events/repo/testing';
import { addDays, currentEventDay, mondayOf } from '@events/time';
import { EventsSection } from '@/features/events/components/EventsSection';
import { createHttpOccurrenceSource } from '@/features/events/source/httpOccurrenceSource';
import { occurrencesHandler } from '@/mocks/handlers';
import { server, TEST_EVENTS_API_URL } from '@/test/mockServer';
import { monthOf } from '../monthCalendar';
import { SchoolsCalendar } from './SchoolsCalendar';

vi.mock('@/features/events/components/EventsMapLoader', () => ({ EventsMapLoader: () => null }));

const NOW = new Date('2026-10-07T12:00:00+02:00');
const TODAY = currentEventDay(NOW);
const MONDAY = mondayOf(TODAY);
// The sample school week has 5 events on its Wednesday
const WEDNESDAY = addDays(MONDAY, 2);

async function renderSchoolsPage() {
  server.use(occurrencesHandler(TEST_EVENTS_API_URL, () => toListings(createSampleEvents(NOW))));
  const source = createHttpOccurrenceSource(TEST_EVENTS_API_URL, { forSchools: true });
  // Async server components are awaited as plain functions, then the returned elements are rendered
  const calendar = await SchoolsCalendar({ source, month: monthOf(TODAY), selectedDay: TODAY, today: TODAY });
  const section = await EventsSection({
    source,
    range: { from: MONDAY, to: addDays(MONDAY, 6) },
    time: null,
    sentence: 'Wydarzenia dla grup szkolnych',
    controls: calendar,
    landingDay: TODAY,
  });
  return render(section);
}

describe('schools page', () => {
  it('shows only the events for schools in the picked week', async () => {
    const { container } = await renderSchoolsPage();

    expect(container.querySelectorAll('article')).toHaveLength(SAMPLE_SCHOOL_OCCURRENCES_IN_FIRST_WEEK);
    expect(screen.getByText('Koncert edukacyjny')).toBeInTheDocument();
    expect(screen.queryByText('Jazz nad Odrą')).not.toBeInTheDocument();
  });

  it('marks calendar days with the number of school events', async () => {
    await renderSchoolsPage();
    const calendar = screen.getByRole('navigation', { name: 'Kalendarz miesiąca' });

    expect(within(calendar).getByRole('link', { name: /5 wydarzeń/ })).toHaveAttribute(
      'href',
      `/dla-szkol?day=${WEDNESDAY}&month=${monthOf(WEDNESDAY)}#day-${WEDNESDAY}`,
    );
  });
});
