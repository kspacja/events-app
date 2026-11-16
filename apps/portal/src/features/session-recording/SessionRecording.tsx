'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { startClarity } from './clarity';
import { SESSION_RECORDING_LABELS as LABELS } from './labels';
import styles from './SessionRecording.module.css';

const CONSENT_KEY = 'events-app.session-recording';

type Consent = 'granted' | 'denied' | 'unknown';

const listeners = new Set<() => void>();

function readConsent(): Consent {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : 'unknown';
  } catch {
    return 'unknown';
  }
}

function saveConsent(consent: Exclude<Consent, 'unknown'>): void {
  try {
    localStorage.setItem(CONSENT_KEY, consent);
  } catch {
    // Private mode: the question comes back on the next visit, nothing records meanwhile
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Asks once; Clarity loads only after a yes. The layout renders it only on MSW with a project id. */
export function SessionRecording({ projectId }: { readonly projectId: string }) {
  // 'denied' on the server, so nothing shows until the browser has read the answer
  const consent = useSyncExternalStore(subscribe, readConsent, () => 'denied' as const);

  useEffect(() => {
    if (consent === 'granted') startClarity(projectId);
  }, [consent, projectId]);

  if (consent !== 'unknown') return null;

  return (
    <aside className={styles.bar} aria-label={LABELS.title}>
      <p className={styles.text}>
        <strong className={styles.title}>{LABELS.title}</strong> {LABELS.question}
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.accept} onClick={() => saveConsent('granted')}>
          {LABELS.accept}
        </button>
        <button type="button" className={styles.decline} onClick={() => saveConsent('denied')}>
          {LABELS.decline}
        </button>
      </div>
    </aside>
  );
}
