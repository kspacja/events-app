import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createSampleEvents, toListings } from '@events/repo';
import { SAMPLE_OCCURRENCES_IN_FIRST_WEEK } from '@events/repo/testing';
import { addDays, currentEventDay, mondayOf } from '@events/time';
import { occurrencesHandler } from '@/mocks/handlers';
import { server, TEST_EVENTS_API_URL } from '@/test/mockServer';
import { createHttpOccurrenceSource } from '../source/httpOccurrenceSource';
import { formatCount } from '../schedule';
import { EventsSection } from './EventsSection';

vi.mock('./EventsMapLoader', () => ({ EventsMapLoader: () => null }));

const NOW = new Date('2026-10-07T12:00:00+02:00');

describe('EventsSection', () => {
  it('renders the week served by the API', async () => {
    const monday = mondayOf(currentEventDay(NOW));
    server.use(occurrencesHandler(TEST_EVENTS_API_URL, () => toListings(createSampleEvents(NOW))));
    const source = createHttpOccurrenceSource(TEST_EVENTS_API_URL);

    // Async server components are awaited as plain functions, then the returned element is rendered
    const section = await EventsSection({
      source,
      range: { from: monday, to: addDays(monday, 6) },
      time: null,
      sentence: 'Szukasz wydarzeń',
    });
    const { container } = render(section);

    expect(container.querySelectorAll('article')).toHaveLength(SAMPLE_OCCURRENCES_IN_FIRST_WEEK);
    expect(screen.getByText(formatCount(SAMPLE_OCCURRENCES_IN_FIRST_WEEK))).toBeInTheDocument();
  });
});
