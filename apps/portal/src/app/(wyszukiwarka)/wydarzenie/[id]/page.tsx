import type { Metadata } from 'next';
import styles from '@/features/schoolSearch/components/SearchPage.module.css';
import { SEARCH_LABELS } from '@/features/schoolSearch/labels';
import { BackToCalendar } from '@/features/schoolSearch/components/BackToCalendar';

export const metadata: Metadata = { title: SEARCH_LABELS.eventPage };

/** Placeholder (TBD) for the event's own page, linked from "Dowiedz się więcej". */
export default function EventPage() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <BackToCalendar />
        <header className={styles.header}>
          <h1 className={styles.title}>{SEARCH_LABELS.eventPage}</h1>
        </header>
        <p className={styles.empty}>{SEARCH_LABELS.eventPageSoon}</p>
      </div>
    </main>
  );
}
