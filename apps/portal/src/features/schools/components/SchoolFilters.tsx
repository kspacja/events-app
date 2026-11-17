'use client';

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { TopProgress } from '@/components/TopProgress';
import { LOCALITY_LABELS, radiusOptionLabel } from '@/features/locality/labels';
import { useLocality } from '@/features/locality/LocalityContext';
import { DEFAULT_RADIUS_KM, RADII_KM } from '@/features/locality/place';
import { rememberPlace } from '@/features/locality/placeCookies';
import { FILTER_LABELS } from '../labels';
import {
  PRICE_PARAM,
  SCHOOL_FILTERS,
  filtersQuery,
  parseFilters,
  placeOf,
  priceModeOf,
  priceOptions,
  toggleOption,
  withPeople,
  withPlace,
  withPriceMode,
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
  readonly labelled: boolean;
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

function FilterGroup({ filter, selection, onChange, labelled }: FilterGroupProps) {
  const chosen = selection[filter.param] ?? [];
  const optionsRef = useEndFade();
  return (
    <fieldset className={styles.group}>
      {labelled && <legend className={styles.legend}>{filter.label}</legend>}
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

/** Zasięg around the chosen Miejscowość; shown only once one is chosen. */
function RadiusGroup({ selection, onChange }: { readonly selection: FilterSelection; readonly onChange: (next: FilterSelection) => void }) {
  const place = placeOf(selection);
  const locality = useLocality(place?.localityId);
  const optionsRef = useEndFade();
  if (!place) return null;
  const name = locality?.name ?? '…';
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{LOCALITY_LABELS.radiusLegend(name)}</legend>
      <div ref={optionsRef} className={styles.options}>
        {RADII_KM.map((radiusKm) => (
          <button
            key={radiusKm}
            type="button"
            className={styles.option}
            aria-pressed={place.radiusKm === radiusKm}
            onClick={() => {
              if (place.radiusKm === radiusKm) return;
              rememberPlace({ ...place, radiusKm });
              onChange(withPlace(selection, { ...place, radiusKm }));
            }}
          >
            {radiusOptionLabel(radiusKm, name)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const PRICE_MODES = [
  ['osoba', FILTER_LABELS.perPupil],
  ['grupa', FILTER_LABELS.perGroup],
] as const;

/** Price per pupil by default; per group it asks how many pupils and compares the whole group's cost. */
function PriceFilterGroup({ filter, selection, onChange, labelled }: FilterGroupProps) {
  const mode = priceModeOf(selection);
  const chosen = selection[filter.param] ?? [];
  const optionsRef = useEndFade();
  // An empty or unreadable field keeps the number in the URL
  const commitPeople = (input: HTMLInputElement) => {
    const people = input.valueAsNumber;
    if (!Number.isFinite(people) || people < 1) input.value = String(mode.people);
    else if (people !== mode.people) onChange(withPeople(selection, people));
  };
  return (
    <fieldset className={styles.group} data-price>
      {labelled && <legend className={styles.legend}>{filter.label}</legend>}
      <div className={styles.priceControls}>
        <div className={styles.modes} role="group" aria-label={FILTER_LABELS.priceMode}>
          {PRICE_MODES.map(([per, label]) => (
            <button
              key={per}
              type="button"
              className={styles.mode}
              aria-pressed={mode.per === per}
              onClick={() => mode.per !== per && onChange(withPriceMode(selection, per))}
            >
              {label}
            </button>
          ))}
        </div>
        {mode.per === 'grupa' && (
          <label className={styles.people}>
            {FILTER_LABELS.people}
            <input
              // Re-created when the URL's number changes, so it never holds a stale value
              key={mode.people}
              type="number"
              inputMode="numeric"
              min={1}
              max={500}
              defaultValue={mode.people}
              className={styles.peopleInput}
              onBlur={(event) => commitPeople(event.currentTarget)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitPeople(event.currentTarget);
              }}
            />
          </label>
        )}
      </div>
      <div ref={optionsRef} className={styles.options}>
        {priceOptions(filter, mode).map((option) => (
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
      {/* Kept but hidden per group, so the dialog does not jump when the mode changes */}
      <p className={styles.hint} hidden={mode.per === 'grupa'}>
        {FILTER_LABELS.groupPriceHint}
      </p>
    </fieldset>
  );
}

interface SchoolFiltersProps {
  readonly placement: FilterPlacement;
  /** `rows`: a scrolling row per filter, without names (the month dock). `sheet`: inside the filters dialog, every filter named. */
  readonly layout?: 'inline' | 'rows' | 'sheet';
}

/** The filters of one placement; which filter goes where is set in schoolFilters.ts. */
export function SchoolFilters({ placement, layout = 'inline' }: SchoolFiltersProps) {
  const { selection, pending, apply } = useFilterNavigation();
  const filters = SCHOOL_FILTERS.filter((filter) => filter.placement === placement);
  if (filters.length === 0) return null;
  const clearable = hasOwn(selection, placement);
  const clear = (
    <button type="button" className={styles.clear} onClick={() => apply(withoutPlacement(selection, placement))}>
      {FILTER_LABELS.clear}
    </button>
  );

  return (
    <div className={styles.filtersContainer} data-layout={layout}>
    <TopProgress active={pending} />
    <section
      className={styles.filters}
      data-placement={placement}
      data-layout={layout}
      data-pending={pending || undefined}
      aria-label={placement === 'main' ? FILTER_LABELS.main : FILTER_LABELS.advanced}
    >
      {layout === 'sheet' ? (
        // In the dialog it sits at the top and only hides, so choosing a filter never moves the rest
        <div className={styles.sheetHeader}>
          {placement === 'advanced' ? <h2 className={styles.heading}>{FILTER_LABELS.advanced}</h2> : <span />}
          <span className={styles.clearSlot} hidden={!clearable}>
            {clear}
          </span>
        </div>
      ) : placement === 'advanced' ? (
        <h2 className={styles.heading}>{FILTER_LABELS.advanced}</h2>
      ) : null}
      {placement === 'advanced' ? <RadiusGroup selection={selection} onChange={apply} /> : null}
      {filters.map((filter) => {
        const Group = filter.param === PRICE_PARAM ? PriceFilterGroup : FilterGroup;
        return (
          <Group
            key={filter.param}
            filter={filter}
            selection={selection}
            onChange={apply}
            labelled={placement === 'advanced' || layout === 'sheet'}
          />
        );
      })}
    </section>
      {/* The month dock has no room for it: chips are toggled off one by one */}
      {layout === 'inline' && clearable ? clear : null}
    </div>
  );
}

/** A radius other than the default counts as an advanced filter: clearing them brings it back. */
function changedRadius(selection: FilterSelection): boolean {
  const place = placeOf(selection);
  return place !== null && place.radiusKm !== DEFAULT_RADIUS_KM;
}

function hasOwn(selection: FilterSelection, placement: FilterPlacement): boolean {
  return (
    (placement === 'advanced' && changedRadius(selection)) ||
    SCHOOL_FILTERS.some((filter) => filter.placement === placement && selection[filter.param]?.length)
  );
}

function countOwn(selection: FilterSelection, placements: readonly FilterPlacement[]): number {
  return SCHOOL_FILTERS.filter((filter) => placements.includes(filter.placement)).reduce(
    (count, { param }) => count + (selection[param]?.length ?? 0),
    placements.includes('advanced') && changedRadius(selection) ? 1 : 0,
  );
}

interface FiltersDialogProps {
  /** `text`: phones only, under the main filters. `dock`: a button in the month dock, on every screen. */
  readonly trigger?: 'text' | 'dock';
  /** The filters it holds; phones put the main ones in too when there is no room for them on the page. */
  readonly placements?: readonly FilterPlacement[];
}

const ADVANCED_ONLY: readonly FilterPlacement[] = ['advanced'];

/** Filters in a dialog: a sheet from the bottom on phones, centred on wider screens. */
export function FiltersDialog({ trigger = 'text', placements = ADVANCED_ONLY }: FiltersDialogProps) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const chosen = countOwn(parseFilters(new URLSearchParams(useSearchParams())), placements);
  const label = placements.includes('main') ? FILTER_LABELS.main : FILTER_LABELS.advanced;

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!SCHOOL_FILTERS.some((filter) => placements.includes(filter.placement))) return null;

  return (
    <>
      <button
        type="button"
        className={trigger === 'dock' ? styles.dockButton : styles.sheetButton}
        onClick={() => setOpen(true)}
      >
        {label}
        {chosen > 0 ? <span className={styles.count}>{chosen}</span> : null}
      </button>
      <dialog
        ref={dialogRef}
        className={styles.sheet}
        data-trigger={trigger}
        aria-label={label}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // A click on the backdrop lands on the dialog itself
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <div className={styles.sheetBody}>
          {placements.map((placement) => (
            <SchoolFilters key={placement} placement={placement} layout="sheet" />
          ))}
          {/* Focus lands here on open rather than on the first scrolling chip row */}
          <button type="button" className={styles.done} onClick={() => setOpen(false)} autoFocus>
            {FILTER_LABELS.done}
          </button>
        </div>
      </dialog>
    </>
  );
}
