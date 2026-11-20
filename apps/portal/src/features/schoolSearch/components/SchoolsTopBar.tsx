import { Suspense } from 'react';
import { TopBar } from '@/features/events/components/TopBar';
import { SCHOOLS_LABELS } from '@/features/schools/labels';
import { SearchBox } from './SearchBox';

/** The green bar of the schools pages, with the search at its end. */
export function SchoolsTopBar() {
  return (
    <TopBar
      title={SCHOOLS_LABELS.heading}
      wide
      // The search reads the URL, so a static render waits for the browser
      search={
        <Suspense fallback={null}>
          <SearchBox />
        </Suspense>
      }
    />
  );
}
