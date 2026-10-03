'use client';

import { useRef } from 'react';
import { useEventSelectionStore } from '../EventSelectionProvider';
import { CARD_LABELS } from '../labels';
import styles from './EventPinButton.module.css';

interface EventPinButtonProps {
  readonly eventId: string;
  readonly title: string;
}

export function EventPinButton({ eventId, title }: EventPinButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const store = useEventSelectionStore();

  return (
    <button
      ref={ref}
      type="button"
      className={styles.pin}
      onClick={() => {
        if (ref.current) store.selectFromCard(eventId, ref.current);
      }}
    >
      <span className="visually-hidden">{`${CARD_LABELS.showOnMap}: ${title}`}</span>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </svg>
    </button>
  );
}
