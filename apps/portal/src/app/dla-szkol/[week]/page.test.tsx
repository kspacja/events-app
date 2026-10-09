import { render, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSampleEvents, toListings } from '@events/repo';
import { SAMPLE_SCHOOL_OCCURRENCES_IN_FIRST_WEEK } from '@events/repo/testing';
import { addDays, currentEventDay, mondayOf } from '@events/time';
import { SCHOOLS_LABELS } from '@/features/schools/labels';
import { countByDay } from '@/features/schools/monthCalendar';
import { occurrencesHandler } from '@/mocks/handlers';
import { server, TEST_EVENTS_API_URL } from '@/test/mockServer';

vi.mock('@/features/events/components/EventsMapLoader', () => ({ EventsMapLoader: () => null }));
vi.stubEnv('EVENTS_API_URL', TEST_EVENTS_API_URL);

const NOW = new Date('2026-10-07T12:00:00+02:00');
const TODAY = currentEventDay(NOW);
// The sample school week has 5 events on its Wednesday
const WEDNESDAY = addDays(mondayOf(TODAY), 2);
const WEEK = mondayOf(WEDNESDAY);

// The route's own pieces: the layout with the map slot and the week page, awaited like Next awaits them
async function renderWeek(week: string) {
  const listings = toListings(createSampleEvents(NOW));
  server.use(occurrencesHandler(TEST_EVENTS_API_URL, () => listings));
  const schoolCounts = Object.fromEntries(countByDay(listings.filter(({ event }) => event.forSchools)));
  server.use(http.get('*/api/school-counts', () => HttpResponse.json(schoolCounts)));

  const params = Promise.resolve({ week });
  const { default: Layout } = await import('./layout');
  const { default: Page } = await import('./page');
  const { default: Map } = await import('./@map/page');
  render(await Layout({ params, map: await Map({ params }), children: await Page({ params }) }));
}

describe('/dla-szkol/[week]', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows only the events for schools in the shown week', async () => {
    await renderWeek(WEEK);

    expect(screen.getAllByRole('article')).toHaveLength(SAMPLE_SCHOOL_OCCURRENCES_IN_FIRST_WEEK);
    expect(screen.getByText('Koncert edukacyjny')).toBeInTheDocument();
    expect(screen.queryByText('Jazz nad Odrą')).not.toBeInTheDocument();
  });

  it('puts the heading in the <h1> and the calendar under it', async () => {
    await renderWeek(WEEK);

    expect(screen.getByRole('heading', { level: 1, name: SCHOOLS_LABELS.heading })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Kalendarz miesiąca' })).toBeInTheDocument();
  });

  it('marks calendar days with the number of school events', async () => {
    await renderWeek(WEEK);
    const calendar = screen.getByRole('navigation', { name: 'Kalendarz miesiąca' });

    expect(await within(calendar).findByRole('link', { name: /5 wydarzeń/ })).toHaveAttribute(
      'href',
      `/dla-szkol/${WEEK}#day-${WEDNESDAY}`,
    );
  });

  it('moves the shown week a week forward and back', async () => {
    await renderWeek(WEEK);
    const previous = addDays(WEEK, -7);
    const next = addDays(WEEK, 7);

    expect(screen.getByRole('link', { name: 'Poprzedni tydzień' })).toHaveAttribute('href', `/dla-szkol/${previous}`);
    expect(screen.getByRole('link', { name: 'Następny tydzień' })).toHaveAttribute('href', `/dla-szkol/${next}`);
  });

  it('keeps the calendar month of the shown week', async () => {
    await renderWeek(WEEK);

    expect(screen.getByRole('heading', { name: 'październik 2026' })).toBeInTheDocument();
  });
});
