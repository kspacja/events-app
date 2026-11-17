'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, useTransition, type KeyboardEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  LOCALITY_QUERY_MIN_LENGTH,
  localitiesResponseSchema,
  localityResponseSchema,
  type Locality,
} from '@events/contract/localities';
import { TopProgress } from '@/components/TopProgress';
import { filtersQuery, parseFilters, placeOf, withPlace } from '@/features/schools/schoolFilters';
import { guessedLabel, hintsTotalLabel, kindLabel, LOCALITY_LABELS, radiusLabel, radiusOptionLabel, whereLabel } from '../labels';
import { useLocality } from '../LocalityContext';
import { DEFAULT_RADIUS_KM, RADII_KM, type Place } from '../place';
import { guessedLocality, rememberPlace } from '../placeCookies';
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

const noSubscription = () => () => {};

/** The guessed Miejscowość from its cookie; nothing on the server, so the first render matches. */
function useGuessedLocality(): string | undefined {
  return useSyncExternalStore(noSubscription, guessedLocality, () => undefined);
}

type Locating = 'idle' | 'busy' | 'denied' | 'failed';

/** "Użyj mojej lokalizacji": asks the browser only on the click, then the closest Miejscowość of any kind. */
function useMyLocation(onFound: (locality: Locality) => void) {
  const [state, setState] = useState<Locating>('idle');
  function locate() {
    if (!('geolocation' in navigator)) {
      setState('failed');
      return;
    }
    setState('busy');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        fetch(`/api/localities/nearest?${new URLSearchParams({ lat: String(coords.latitude), lng: String(coords.longitude) })}`)
          .then(async (response) => {
            if (!response.ok) throw new Error(`status ${response.status}`);
            setState('idle');
            onFound(localityResponseSchema.parse(await response.json()).locality);
          })
          .catch(() => setState('failed'));
      },
      (error) => setState(error.code === error.PERMISSION_DENIED ? 'denied' : 'failed'),
      { maximumAge: 10 * 60 * 1000, timeout: 15_000 },
    );
  }
  return { state, locate };
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
  const guessed = useGuessedLocality();
  const [guessSettled, setGuessSettled] = useState(false);
  const showGuess = !guessSettled && !open && place !== null && locality !== null && guessed === place.localityId;

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

  function go(next: Place | null, { keepOpen = false } = {}) {
    // Before navigating: with no place in the URL the proxy reads it to keep all of Poland
    rememberPlace(next);
    if (!keepOpen) {
      close();
      setQuery('');
    }
    startTransition(() => router.replace(`${pathname}${filtersQuery(withPlace(selection, next))}`, { scroll: false }));
  }

  function choose(chosen: Locality) {
    go({ localityId: chosen.id, radiusKm: place?.radiusKm ?? DEFAULT_RADIUS_KM });
  }

  const myLocation = useMyLocation(choose);

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
    <div className={styles.root}>
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
      {showGuess ? (
        <div className={styles.guess} role="status">
          <p className={styles.guessText}>{guessedLabel(locality.name)}</p>
          <div className={styles.guessActions}>
            <button type="button" className={styles.guessChange} onClick={() => setOpen(true)}>
              {LOCALITY_LABELS.guessChange}
            </button>
            <button
              type="button"
              className={styles.guessConfirm}
              onClick={() => {
                rememberPlace(place);
                setGuessSettled(true);
              }}
            >
              {LOCALITY_LABELS.guessConfirm}
            </button>
          </div>
        </div>
      ) : null}
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
          {place ? (
            // Stays open after a change, so the radius can be tried step by step
            <fieldset className={styles.radii}>
              <legend className={styles.label}>{LOCALITY_LABELS.radiusLegend(locality?.name ?? '…')}</legend>
              <div className={styles.radiusOptions}>
                {RADII_KM.map((radiusKm) => (
                  <button
                    key={radiusKm}
                    type="button"
                    className={styles.radiusOption}
                    aria-pressed={place.radiusKm === radiusKm}
                    onClick={() => place.radiusKm !== radiusKm && go({ ...place, radiusKm }, { keepOpen: true })}
                  >
                    {radiusOptionLabel(radiusKm, locality?.name ?? '…')}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}
          <p className={styles.status} role="status">
            {myLocation.state === 'busy' ? LOCALITY_LABELS.locating : null}
            {myLocation.state === 'denied' ? LOCALITY_LABELS.locationDenied : null}
            {myLocation.state === 'failed' ? LOCALITY_LABELS.locationFailed : null}
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.locate} onClick={myLocation.locate} disabled={myLocation.state === 'busy'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
              {LOCALITY_LABELS.useMyLocation}
            </button>
            <button type="button" className={styles.wholeCountry} onClick={() => go(null)} disabled={!place}>
              {LOCALITY_LABELS.wholeCountry}
            </button>
          </div>
          <p className={styles.source}>{LOCALITY_LABELS.source}</p>
        </div>
      </dialog>
      ) : null}
    </div>
  );
}
