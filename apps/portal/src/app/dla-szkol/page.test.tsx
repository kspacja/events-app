import { render, screen, within } from '@testing-library/react';
import { isValidElement, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSampleEvents, toListings } from '@events/repo';
import { SAMPLE_SCHOOL_OCCURRENCES_IN_FIRST_WEEK } from '@events/repo/testing';
import { addDays, currentEventDay, mondayOf } from '@events/time';
import { EventsSection } from '@/features/events/components/EventsSection';
import { SchoolsCalendar } from '@/features/schools/components/SchoolsCalendar';
import { SCHOOLS_LABELS } from '@/features/schools/labels';
import { monthOf } from '@/features/schools/monthCalendar';
import { occurrencesHandler } from '@/mocks/handlers';
import { server, TEST_EVENTS_API_URL } from '@/test/mockServer';

vi.mock('@/features/events/components/EventsMapLoader', () => ({ EventsMapLoader: () => null }));
vi.stubEnv('EVENTS_API_URL', TEST_EVENTS_API_URL);

const NOW = new Date('2026-10-07T12:00:00+02:00');
const TODAY = currentEventDay(NOW);
// The sample school week has 5 events on its Wednesday
const WEDNESDAY = addDays(mondayOf(TODAY), 2);

type Props<T> = T extends (props: infer P) => unknown ? P : never;

// Testing Library cannot render async server components, so they are awaited here with the props the page gave them
async function renderSchoolsPage(params: Record<string, string>) {
  server.use(occurrencesHandler(TEST_EVENTS_API_URL, () => toListings(createSampleEvents(NOW))));
  const { default: SchoolsPage } = await import('./page');
  const page = await SchoolsPage({ params: Promise.resolve({}), searchParams: Promise.resolve(params) });

  const [section] = (page.props as { children: ReactElement[] }).children;
  const sectionProps = section.props as Props<typeof EventsSection>;
  if (!isValidElement(sectionProps.controls)) throw new Error('the page should pass the calendar');
  const calendar = await SchoolsCalendar(sectionProps.controls.props as Props<typeof SchoolsCalendar>);
  render(await EventsSection({ ...sectionProps, controls: calendar }));
  return { sectionProps };
}

describe('/dla-szkol', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows only the events for schools in the picked week', async () => {
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
      `/dla-szkol?day=${WEDNESDAY}&month=${monthOf(WEDNESDAY)}#day-${WEDNESDAY}`,
    );
  });

  it('lands the week strip on the picked day', async () => {
    const { sectionProps } = await renderSchoolsPage({ day: WEDNESDAY });

    expect(sectionProps.landingDay).toBe(WEDNESDAY);
  });

  it('tells when a past day was replaced by today', async () => {
    await renderSchoolsPage({ day: '2026-10-01' });

    expect(screen.getByText(SCHOOLS_LABELS.pastDayNotice)).toBeInTheDocument();
  });
});
