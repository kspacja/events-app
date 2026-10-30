import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createSampleEvents, toListings } from '@events/repo';
import { SAMPLE_GENERAL_OCCURRENCES_IN_FIRST_WEEK } from '@events/repo/testing';
import { addDays, currentEventDay, mondayOf } from '@events/time';
import { occurrencesHandler } from '@/mocks/handlers';
import { server, TEST_EVENTS_API_URL } from '@/test/mockServer';
import { settle } from '@/test/settle';
import type { ReactElement } from 'react';
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

    const section = EventsSection({
      source,
      range: { from: monday, to: addDays(monday, 6) },
      today: currentEventDay(NOW),
      time: null,
      sentence: 'Szukasz wydarzeń',
    });
    const { container } = render(await settle(section) as ReactElement);

    expect(container.querySelectorAll('article')).toHaveLength(SAMPLE_GENERAL_OCCURRENCES_IN_FIRST_WEEK);
    expect(screen.getByText(formatCount(SAMPLE_GENERAL_OCCURRENCES_IN_FIRST_WEEK))).toBeInTheDocument();
  });
});
