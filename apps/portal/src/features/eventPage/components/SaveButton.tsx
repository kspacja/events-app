'use client';

import { useState } from 'react';
import { EVENT_PAGE_LABELS as LABELS } from '../labels';
import styles from './EventPage.module.css';

/** Prototype: remembers nothing yet; saving comes with the teacher's account. */
export function SaveButton() {
  const [saved, setSaved] = useState(false);
  return (
    <button type="button" className={styles.save} aria-pressed={saved} onClick={() => setSaved((value) => !value)}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" />
      </svg>
      {saved ? LABELS.saved : LABELS.save}
    </button>
  );
}
