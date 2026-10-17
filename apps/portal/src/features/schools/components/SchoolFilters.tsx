'use client';

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FILTER_LABELS } from '../labels';
import {
  SCHOOL_FILTERS,
  filtersQuery,
  parseFilters,
  toggleOption,
  withoutPlacement,
  type FilterPlacement,
  type FilterSelection,
  type SchoolFilter,
} from '../schoolFilters';
import styles from './SchoolFilters.module.css';

/** The filters in the URL, and changes that replace it in place (same week, no scroll). */
function useFilterNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const selection = parseFilters(new URLSearchParams(useSearchParams()));
  const [pending, startTransition] = useTransition();

  function apply(next: FilterSelection) {
    startTransition(() => router.replace(`${pathname}${filtersQuery(next)}`, { scroll: false }));
  }

  return { selection, pending, apply };
}

interface FilterGroupProps {
  readonly filter: SchoolFilter;
  readonly selection: FilterSelection;
  readonly onChange: (next: FilterSelection) => void;
}

// Sub-pixel rounding can leave a row a pixel short of its end
const EDGE_TOLERANCE = 1;

/** Marks a scrolling row with data-fade while more of it hides past the right edge; set on the element, so scrolling never re-renders. */
function useEndFade() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = ref.current;
    if (!row) return;
    function update() {
      if (!row) return;
      row.toggleAttribute('data-fade', row.scrollLeft + row.clientWidth < row.scrollWidth - EDGE_TOLERANCE);
    }
    update();
    const resize = new ResizeObserver(update);
    resize.observe(row);
    row.addEventListener('scroll', update, { passive: true });
    return () => {
      resize.disconnect();
      row.removeEventListener('scroll', update);
    };
  }, []);
  return ref;
}

function FilterGroup({ filter, selection, onChange }: FilterGroupProps) {
  const chosen = selection[filter.param] ?? [];
  const optionsRef = useEndFade();
  return (
    <fieldset className={styles.group}>
      {filter.placement === 'advanced' && <legend className={styles.legend}>{filter.label}</legend>}
      <div ref={optionsRef} className={styles.options}>
        {filter.options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={styles.option}
            aria-pressed={chosen.includes(option.value)}
            onClick={() => onChange(toggleOption(selection, filter.param, option.value))}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

interface SchoolFiltersProps {
  readonly placement: FilterPlacement;
}

/** The filters of one placement; which filter goes where is set in schoolFilters.ts. */
export function SchoolFilters({ placement }: SchoolFiltersProps) {
  const { selection, pending, apply } = useFilterNavigation();
  const filters = SCHOOL_FILTERS.filter((filter) => filter.placement === placement);
  if (filters.length === 0) return null;

  return (
    <div className={styles.filtersContainer}>
    <section
      className={styles.filters}
      data-placement={placement}
      data-pending={pending || undefined}
      aria-label={placement === 'main' ? FILTER_LABELS.main : FILTER_LABELS.advanced}
    >
      {placement === 'advanced' ? <h2 className={styles.heading}>{FILTER_LABELS.advanced}</h2> : null}
      {filters.map((filter) => (
        <FilterGroup key={filter.param} filter={filter} selection={selection} onChange={apply} />
      ))}
    </section>
      {hasOwn(selection, placement) ? (
        <button type="button" className={styles.clear} onClick={() => apply(withoutPlacement(selection, placement))}>
          {FILTER_LABELS.clear}
        </button>
      ) : null}
    </div>
  );
}

function hasOwn(selection: FilterSelection, placement: FilterPlacement): boolean {
  return SCHOOL_FILTERS.some((filter) => filter.placement === placement && selection[filter.param]?.length);
}

function countOwn(selection: FilterSelection, placement: FilterPlacement): number {
  return SCHOOL_FILTERS.filter((filter) => filter.placement === placement).reduce(
    (count, { param }) => count + (selection[param]?.length ?? 0),
    0,
  );
}

/** Phones only: a button under the main filters opens the advanced ones in a sheet that slides up from the bottom. */
export function AdvancedFiltersSheet() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const chosen = countOwn(parseFilters(new URLSearchParams(useSearchParams())), 'advanced');

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!SCHOOL_FILTERS.some((filter) => filter.placement === 'advanced')) return null;

  return (
    <>
      <button type="button" className={styles.sheetButton} onClick={() => setOpen(true)}>
        {FILTER_LABELS.advanced}
        {chosen > 0 ? <span className={styles.count}>{chosen}</span> : null}
      </button>
      <dialog
        ref={dialogRef}
        className={styles.sheet}
        aria-label={FILTER_LABELS.advanced}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // A click on the backdrop lands on the dialog itself
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <div className={styles.sheetBody}>
          <SchoolFilters placement="advanced" />
          {/* Focus lands here on open rather than on the first scrolling chip row */}
          <button type="button" className={styles.done} onClick={() => setOpen(false)} autoFocus>
            {FILTER_LABELS.done}
          </button>
        </div>
      </dialog>
    </>
  );
}
