'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, useTransition, type KeyboardEvent, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Organizer } from '@events/contract/listing';
import { SEARCH_QUERY_MIN_LENGTH, suggestionsResponseSchema, type VenueHint } from '@events/contract/search';
import { TopProgress } from '@/components/TopProgress';
import { radiusLabel } from '@/features/locality/labels';
import { useLocality } from '@/features/locality/LocalityContext';
import type { Place } from '@/features/locality/place';
import { knownPlaceInBrowser } from '@/features/locality/placeCookies';
import { parseFilters, placeOf } from '@/features/schools/schoolFilters';
import { SEARCH_LABELS as LABELS, searchForLabel } from '../labels';
import { readRecent, rememberRecent } from '../recentSearches';
import { keywordsHref, KEYWORDS_PARAM, organizerHref, venueHref } from '../searchHref';
import styles from './SearchBox.module.css';

const SEARCH_DELAY_MS = 150;

type Hints =
  | { readonly state: 'idle' }
  | { readonly state: 'ready'; readonly organizers: readonly Organizer[]; readonly venues: readonly VenueHint[] }
  | { readonly state: 'failed' };

/** Organizer and venue hints a moment after typing stops; older answers never overwrite newer ones. */
function useHints(query: string): Hints {
  const [hints, setHints] = useState<Hints>({ state: 'idle' });
  const trimmed = query.trim();
  useEffect(() => {
    if (trimmed.length < SEARCH_QUERY_MIN_LENGTH) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?${new URLSearchParams({ q: trimmed })}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error(`status ${response.status}`);
          setHints({ state: 'ready', ...suggestionsResponseSchema.parse(await response.json()) });
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) setHints({ state: 'failed' });
          if (!(error instanceof DOMException)) console.warn('[events] search hints failed', error);
        });
    }, SEARCH_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);
  return trimmed.length < SEARCH_QUERY_MIN_LENGTH ? { state: 'idle' } : hints;
}

type Option =
  | { readonly kind: 'keywords'; readonly keywords: string; readonly place: Place | null }
  | { readonly kind: 'recent'; readonly keywords: string }
  | { readonly kind: 'organizer'; readonly organizer: Organizer }
  | { readonly kind: 'venue'; readonly venue: VenueHint };

function hrefOf(option: Option, place: Place | null): string {
  switch (option.kind) {
    case 'keywords':
      return keywordsHref(option.keywords, option.place);
    case 'recent':
      return keywordsHref(option.keywords, place);
    case 'organizer':
      return organizerHref(option.organizer.slug);
    case 'venue':
      return venueHref(option.venue.id);
  }
}

interface Group {
  readonly label: string;
  readonly options: readonly Option[];
}

function groupsOf(query: string, place: Place | null, hints: Hints, recent: readonly string[]): Group[] {
  const keywords = query.trim();
  if (keywords.length < SEARCH_QUERY_MIN_LENGTH) {
    return [{ label: LABELS.recent, options: recent.map((text) => ({ kind: 'recent', keywords: text })) }];
  }
  const ready = hints.state === 'ready' ? hints : { organizers: [], venues: [] };
  return [
    {
      label: LABELS.keywordsGroup,
      options: [
        ...(place ? [{ kind: 'keywords', keywords, place } as const] : []),
        { kind: 'keywords', keywords, place: null },
      ],
    },
    { label: LABELS.organizers, options: ready.organizers.map((organizer) => ({ kind: 'organizer', organizer })) },
    { label: LABELS.venues, options: ready.venues.map((venue) => ({ kind: 'venue', venue })) },
  ];
}

function MagnifierIcon({ className }: { readonly className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

const OPTION_ICONS: Readonly<Record<Option['kind'], ReactNode>> = {
  keywords: <MagnifierIcon />,
  recent: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  ),
  organizer: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6" />
    </svg>
  ),
  venue: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  ),
};

/** Whether a key press lands in something the visitor types into, so "/" stays a slash there. */
function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
}

/** The search field on the green bar; it opens a larger search window with hints (the whole screen on phones). */
export function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  const urlPlace = placeOf(parseFilters(new URLSearchParams(params)));
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [place, setPlace] = useState<Place | null>(null);
  const [recent, setRecent] = useState<readonly string[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const hints = useHints(query);
  const locality = useLocality(place?.localityId);
  const listId = useId();
  const groups = groupsOf(query, place, hints, recent);
  const options = groups.flatMap((group) => group.options);
  const current = Math.min(active, options.length - 1);

  function show() {
    // The page's own place first; elsewhere the last chosen or guessed one
    setPlace(urlPlace ?? knownPlaceInBrowser());
    setRecent(readRecent());
    setQuery(params.get(KEYWORDS_PARAM) ?? '');
    setActive(0);
    setOpen(true);
  }

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      event.preventDefault();
      show();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, [open]);

  // Through the native close, so focus goes back to the field before the dialog unmounts
  function close() {
    dialogRef.current?.close();
  }

  function choose(option: Option) {
    if (option.kind === 'keywords' || option.kind === 'recent') setRecent(rememberRecent(option.keywords));
    const href = hrefOf(option, place);
    close();
    startTransition(() => router.push(href));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (options.length === 0) return;
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((index) => (Math.min(index, options.length - 1) + step + options.length) % options.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (options.length > 0) choose(options[current]);
    } else if (event.key === 'Escape' && query !== '') {
      // The first Escape clears the text, the next one closes the window
      event.preventDefault();
      setQuery('');
      setActive(0);
    }
  }

  const optionId = (index: number) => `${listId}-${index}`;
  const inputId = `${listId}-input`;
  const nearby = place ? [LABELS.nearby, locality ? `${locality.name}, ${radiusLabel(place.radiusKm)}` : null] : null;

  function optionLabel(option: Option): { readonly main: ReactNode; readonly detail: string | null } {
    switch (option.kind) {
      case 'keywords':
        return option.place
          ? { main: searchForLabel(option.keywords), detail: nearby?.filter(Boolean).join(' · ') ?? null }
          : { main: searchForLabel(option.keywords), detail: LABELS.wholeCountry };
      case 'recent':
        return { main: option.keywords, detail: null };
      case 'organizer':
        return { main: option.organizer.name, detail: null };
      case 'venue':
        return { main: option.venue.name, detail: option.venue.city };
    }
  }

  // Each group's first index in the flat list the keyboard walks
  const starts = groups.map((_, at) => groups.slice(0, at).reduce((sum, group) => sum + group.options.length, 0));
  const hasQuery = query.trim().length >= SEARCH_QUERY_MIN_LENGTH;
  const noHints = hasQuery && hints.state === 'ready' && hints.organizers.length === 0 && hints.venues.length === 0;

  return (
    <div className={styles.root}>
      <TopProgress active={pending} />
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={LABELS.trigger}
        onClick={show}
      >
        <MagnifierIcon className={styles.triggerIcon} />
        <span className={styles.triggerText}>{params.get(KEYWORDS_PARAM) || LABELS.trigger}</span>
        <kbd className={styles.shortcut} aria-hidden="true">
          /
        </kbd>
      </button>
      {/* Mounted only while open, so a closed search leaves no second dialog in the page */}
      {open ? (
        <dialog
          ref={dialogRef}
          className={styles.dialog}
          aria-label={LABELS.dialog}
          onClose={() => setOpen(false)}
          onClick={(event) => {
            // A click on the backdrop lands on the dialog itself
            if (event.target === event.currentTarget) close();
          }}
        >
          <div className={styles.searchRow}>
            <label htmlFor={inputId} className="visually-hidden">
              {LABELS.input}
            </label>
            <MagnifierIcon className={styles.inputIcon} />
            <input
              id={inputId}
              className={styles.input}
              type="search"
              enterKeyHint="search"
              role="combobox"
              autoComplete="off"
              spellCheck={false}
              placeholder={LABELS.placeholder}
              aria-expanded={options.length > 0}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={options.length > 0 ? optionId(current) : undefined}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              autoFocus
            />
            <button type="button" className={styles.close} onClick={close} aria-label={LABELS.close}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div className={styles.panel}>
            {!hasQuery ? <p className={styles.intro}>{LABELS.intro}</p> : null}
            <div id={listId} role="listbox" aria-label={LABELS.dialog} className={styles.groups}>
              {groups.map((group, at) =>
                group.options.length === 0 ? null : (
                  <div key={group.label} role="group" aria-labelledby={`${listId}-${group.label}`} className={styles.group}>
                    <p id={`${listId}-${group.label}`} className={styles.groupLabel}>
                      {group.label}
                    </p>
                    <ul className={styles.options} role="presentation">
                      {group.options.map((option, within) => {
                        const own = starts[at] + within;
                        const { main, detail } = optionLabel(option);
                        return (
                          <li
                            key={own}
                            id={optionId(own)}
                            role="option"
                            aria-selected={own === current}
                            className={styles.option}
                            data-kind={option.kind}
                            onMouseEnter={() => setActive(own)}
                            onClick={() => choose(option)}
                          >
                            <span className={styles.optionIcon}>{OPTION_ICONS[option.kind]}</span>
                            <span className={styles.optionText}>
                              <span className={styles.optionMain}>{main}</span>
                              {detail ? <span className={styles.optionDetail}>{detail}</span> : null}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ),
              )}
            </div>
            <p className={styles.status} role="status">
              {noHints ? LABELS.noHints : null}
              {hasQuery && hints.state === 'failed' ? LABELS.hintsFailed : null}
            </p>
          </div>

          <footer className={styles.keys} aria-hidden="true">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> wybór
            </span>
            <span>
              <kbd>Enter</kbd> otwórz
            </span>
            <span>
              <kbd>Esc</kbd> zamknij
            </span>
          </footer>
        </dialog>
      ) : null}
    </div>
  );
}
