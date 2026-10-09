'use client';

import { useId, useState, type ReactNode } from 'react';
import styles from './CollapsiblePanel.module.css';

interface CollapsiblePanelProps {
  readonly show: string;
  readonly hide: string;
  readonly children: ReactNode;
}

/** Shown in full on desktop; on mobile it stays collapsed behind a button until opened. */
export function CollapsiblePanel({ show, hide, children }: CollapsiblePanelProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  return (
    <>
      <button
        type="button"
        className={styles.button}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((value) => !value)}
      >
        {expanded ? hide : show}
      </button>
      <div id={panelId} className={styles.panel} data-expanded={expanded}>
        {children}
      </div>
    </>
  );
}
