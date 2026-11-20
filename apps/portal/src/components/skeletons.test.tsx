import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EventPageSkeleton } from '@/features/eventPage/components/EventPageSkeleton';
import { ResultsSkeleton } from '@/features/schoolSearch/components/ResultsSkeleton';

describe('page skeletons', () => {
  it.each([
    ['event page', <EventPageSkeleton key="event" />],
    ['search results', <ResultsSkeleton key="results" />],
    ['organizer page', <ResultsSkeleton key="organizer" organizer />],
  ])('%s says it is loading and is marked busy', (_, skeleton) => {
    const { container } = render(skeleton);

    expect(screen.getByRole('status')).toHaveTextContent('Wczytujemy wydarzenia…');
    expect(container.querySelector('main')).toHaveAttribute('aria-busy', 'true');
  });
});
