'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, useTransition, type KeyboardEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  LOCALITY_QUERY_MIN_LENGTH,
  localitiesResponseSchema,
  type Locality,
} from '@events/contract/localities';
import { TopProgress } from '@/components/TopProgress';
import { filtersQuery, parseFilters, placeOf, withPlace } from '@/features/schools/schoolFilters';
import { hintsTotalLabel, kindLabel, LOCALITY_LABELS, radiusLabel, whereLabel } from '../labels';
import { useLocality } from '../LocalityContext';
import { DEFAULT_RADIUS_KM } from '../place';
import styles from './LocalityPicker.module.css';

const SEARCH_DELAY_MS = 150;

type Hints =
  | { readonly state: 'idle' }
  | { readonly state: 'ready'; readonly localities: readonly Locality[]; readonly total: number }
  | { readonly state: 'failed' };

/** Hints for the typed text, a moment after typing stops; older answers never overwrite newer ones. */
function useHints(query: string): Hints {
  const [hints, setHints] = useState<Hints>({ state: 'idle' });
  const trimmed = query.trim();
  useEffect(() => {
    if (trimmed.length < LOCALITY_QUERY_MIN_LENGTH) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/localities?${new URLSearchParams({ q: trimmed })}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error(`status ${response.status}`);
          const body = localitiesResponseSchema.parse(await response.json());
          setHints({ state: 'ready', localities: body.localities, total: body.total });
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) setHints({ state: 'failed' });
          if (!(error instanceof DOMException)) console.warn('[events] locality search failed', error);
        });
    }, SEARCH_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);
  return trimmed.length < LOCALITY_QUERY_MIN_LENGTH ? { state: 'idle' } : hints;
}

function PinIcon() {
  return (
    <svg className={styles.pin} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

/** The chosen Miejscowość as a button over the month; it opens a search under it (a sheet from the bottom on phones). */
export function LocalityPicker() {
  const router = useRouter();
  const pathname = usePathname();
  const selection = parseFilters(new URLSearchParams(useSearchParams()));
  const place = placeOf(selection);
  const locality = useLocality(place?.localityId);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hints = useHints(query);
  const listId = useId();
  const options = hints.state === 'ready' ? hints.localities : [];

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const button = buttonRef.current;
    if (!dialog || !button) return;
    if (!dialog.open) {
      // Wider screens: just under the button; phones: CSS turns it into a sheet and ignores these
      const { left, bottom } = button.getBoundingClientRect();
      dialog.style.setProperty('--picker-left', `${left}px`);
      dialog.style.setProperty('--picker-top', `${bottom + 8}px`);
      dialog.showModal();
    }
  }, [open]);

  // Through the native close, so focus goes back to the button before the dialog unmounts
  function close() {
    dialogRef.current?.close();
  }

  function go(next: typeof place) {
    close();
    setQuery('');
    startTransition(() => router.replace(`${pathname}${filtersQuery(withPlace(selection, next))}`, { scroll: false }));
  }

  function choose(chosen: Locality) {
    go({ localityId: chosen.id, radiusKm: place?.radiusKm ?? DEFAULT_RADIUS_KM });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (options.length === 0) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((current) => (current + step + options.length) % options.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(options[Math.min(active, options.length - 1)]);
    } else if (event.key === 'Escape' && query !== '') {
      // The first Escape clears the hints, the next one closes the dialog
      event.preventDefault();
      setQuery('');
    }
  }

  const name = place ? (locality?.name ?? '…') : LOCALITY_LABELS.wholeCountry;
  const optionId = (index: number) => `${listId}-${index}`;

  return (
    <>
      <TopProgress active={pending} />
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <PinIcon />
        <span className={styles.name}>{name}</span>
        {place ? <span className={styles.radius}>{radiusLabel(place.radiusKm)}</span> : null}
        <svg className={styles.chevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {/* Mounted only while open, so a closed picker leaves no second dialog in the page */}
      {open ? (
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-label={LOCALITY_LABELS.dialog}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // A click on the backdrop lands on the dialog itself
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className={styles.body}>
          <label className={styles.label} htmlFor={`${listId}-input`}>
            {LOCALITY_LABELS.search}
          </label>
          <input
            id={`${listId}-input`}
            className={styles.input}
            type="text"
            enterKeyHint="search"
            role="combobox"
            autoComplete="off"
            spellCheck={false}
            placeholder={LOCALITY_LABELS.searchPlaceholder}
            aria-expanded={options.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={options.length > 0 ? optionId(Math.min(active, options.length - 1)) : undefined}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            autoFocus
          />
          <ul id={listId} role="listbox" className={styles.hints} aria-label={LOCALITY_LABELS.search} hidden={options.length === 0}>
            {options.map((option, index) => (
              <li
                key={option.id}
                id={optionId(index)}
                role="option"
                aria-selected={index === active}
                className={styles.hint}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(option)}
              >
                <span>
                  <span className={styles.hintName}>{option.name}</span> <span className={styles.kind}>{kindLabel(option.kind)}</span>
                </span>
                <span className={styles.where}>{whereLabel(option)}</span>
              </li>
            ))}
          </ul>
          <p className={styles.status} role="status">
            {hints.state === 'ready' && hints.total > options.length ? hintsTotalLabel(hints.total - options.length) : null}
            {hints.state === 'ready' && hints.total === 0 ? LOCALITY_LABELS.noHints : null}
            {hints.state === 'failed' ? LOCALITY_LABELS.searchFailed : null}
          </p>
          {place ? <p className={styles.note}>{LOCALITY_LABELS.radiusHint}</p> : null}
          <div className={styles.actions}>
            <button type="button" className={styles.wholeCountry} onClick={() => go(null)} disabled={!place}>
              {LOCALITY_LABELS.wholeCountry}
            </button>
          </div>
          <p className={styles.source}>{LOCALITY_LABELS.source}</p>
        </div>
      </dialog>
      ) : null}
    </>
  );
}
