import { render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSampleEvents, toListings } from '@events/repo';
import { SAMPLE_SCHOOL_OCCURRENCES_IN_FIRST_WEEK } from '@events/repo/testing';
import { addDays, currentEventDay, mondayOf } from '@events/time';
import { EventsSection } from '@/features/events/components/EventsSection';
import { SCHOOLS_LABELS } from '@/features/schools/labels';
import { monthOfWeek } from '@/features/schools/monthCalendar';
import { occurrencesHandler } from '@/mocks/handlers';
import { server, TEST_EVENTS_API_URL } from '@/test/mockServer';
import { settle } from '@/test/settle';

vi.mock('@/features/events/components/EventsMapLoader', () => ({ EventsMapLoader: () => null }));
vi.stubEnv('EVENTS_API_URL', TEST_EVENTS_API_URL);

const NOW = new Date('2026-10-07T12:00:00+02:00');
const TODAY = currentEventDay(NOW);
// The sample school week has 5 events on its Wednesday
const WEDNESDAY = addDays(mondayOf(TODAY), 2);
const WEEK = mondayOf(WEDNESDAY);

async function renderSchoolsPage(params: Record<string, string>) {
  server.use(occurrencesHandler(TEST_EVENTS_API_URL, () => toListings(createSampleEvents(NOW))));
  const { default: SchoolsPage } = await import('./page');
  const page = await SchoolsPage({ params: Promise.resolve({}), searchParams: Promise.resolve(params) });
  const [section] = (page as ReactElement<{ children: ReactElement[] }>).props.children;
  render(await settle(EventsSection(section.props as Parameters<typeof EventsSection>[0])));
}

describe('/dla-szkol', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows only the events for schools in the shown week', async () => {
    await renderSchoolsPage({});

    expect(screen.getAllByRole('article')).toHaveLength(SAMPLE_SCHOOL_OCCURRENCES_IN_FIRST_WEEK);
    expect(screen.getByText('Koncert edukacyjny')).toBeInTheDocument();
    expect(screen.queryByText('Jazz nad Odrą')).not.toBeInTheDocument();
  });

  it('puts the heading in the <h1> and the calendar under it', async () => {
    await renderSchoolsPage({});

    expect(screen.getByRole('heading', { level: 1, name: SCHOOLS_LABELS.heading })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Kalendarz miesiąca' })).toBeInTheDocument();
  });

  it('marks calendar days with the number of school events', async () => {
    await renderSchoolsPage({});
    const calendar = screen.getByRole('navigation', { name: 'Kalendarz miesiąca' });

    expect(within(calendar).getByRole('link', { name: /5 wydarzeń/ })).toHaveAttribute(
      'href',
      `/dla-szkol?week=${WEEK}&preview-month=${monthOfWeek(WEEK)}#day-${WEDNESDAY}`,
    );
  });

  it('moves the shown week a week forward and back', async () => {
    await renderSchoolsPage({ week: WEEK });
    const previous = addDays(WEEK, -7);
    const next = addDays(WEEK, 7);

    expect(screen.getByRole('link', { name: 'Poprzedni tydzień' })).toHaveAttribute(
      'href',
      `/dla-szkol?week=${previous}&preview-month=${monthOfWeek(previous)}`,
    );
    expect(screen.getByRole('link', { name: 'Następny tydzień' })).toHaveAttribute(
      'href',
      `/dla-szkol?week=${next}&preview-month=${monthOfWeek(next)}`,
    );
  });

  it('shows a past week without a notice', async () => {
    await renderSchoolsPage({ week: '2026-10-01' });

    expect(screen.queryByText(SCHOOLS_LABELS.pastDayNotice)).not.toBeInTheDocument();
  });
});
