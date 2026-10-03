'use client';

import { useId, useState, type FormEvent } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import type {
  CustomRangeDefinition,
  FilterDefinition,
  FilterOption,
} from '../filterDefinition';
import { hrefFor } from '../searchQuery';
import { ChipDialog, useChipNavigate } from './ChipDialog';
import styles from './Picker.module.css';

interface FilterChipProps {
  readonly definition: FilterDefinition;
}

export function FilterChip({ definition }: FilterChipProps) {
  return (
    <ChipDialog label={definition.chipLabel} dialogLabel={definition.dialogLabel}>
      <FilterPanel key={definition.resetKey} definition={definition} />
    </ChipDialog>
  );
}

function FilterPanel({ definition }: FilterChipProps) {
  const navigate = useChipNavigate();
  const pathname = usePathname();
  const currentParams = useSearchParams();
  const { clear, presets, custom } = definition;

  function select(option: FilterOption) {
    navigate(hrefFor(pathname, currentParams, option.change));
  }

  return (
    <div className={styles.picker}>
      <ul className={styles.presets} aria-label={definition.presetsLabel}>
        {[...(clear ? [clear] : []), ...presets].map((option) => (
          <li key={option.id}>
            <button
              type="button"
              className={styles.preset}
              aria-pressed={option.pressed}
              onClick={() => select(option)}
            >
              {option.label}
              {option.hint ? (
                <span className={styles.presetHours}>{option.hint}</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
      {custom ? (
        <CustomRangeForm
          custom={custom}
          onSubmit={(change) => navigate(hrefFor(pathname, currentParams, change))}
        />
      ) : null}
    </div>
  );
}

interface CustomRangeFormProps {
  readonly custom: CustomRangeDefinition;
  readonly onSubmit: (change: FilterOption['change']) => void;
}

function CustomRangeForm({ custom, onSubmit }: CustomRangeFormProps) {
  const errorId = useId();
  const [from, setFrom] = useState(custom.from);
  const [to, setTo] = useState(custom.to);
  const [error, setError] = useState<string | null>(null);
  const limits = custom.limits?.(from, to);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const outcome = custom.validate(from, to);
    if ('error' in outcome) {
      setError(outcome.error);
      return;
    }
    setError(null);
    onSubmit(outcome.change);
  }

  const invalidProps = {
    'aria-invalid': error !== null,
    'aria-describedby': error ? errorId : undefined,
  };

  return (
    <form className={styles.custom} onSubmit={handleSubmit} noValidate>
      <p className={styles.heading}>{custom.labels.heading}</p>
      <div className={styles.fields}>
        <label className={styles.field}>
          {custom.labels.from}
          <input
            type={custom.inputType}
            value={from}
            min={limits?.from.min}
            max={limits?.from.max}
            {...invalidProps}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className={styles.field}>
          {custom.labels.to}
          <input
            type={custom.inputType}
            value={to}
            min={limits?.to.min}
            max={limits?.to.max}
            {...invalidProps}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </div>
      {error ? (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      ) : null}
      <button type="submit" className={styles.submit}>
        {custom.labels.submit}
      </button>
    </form>
  );
}
