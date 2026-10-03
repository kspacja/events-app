import type { Ref } from 'react';
import styles from './SentenceChip.module.css';

interface StaticChipProps {
  readonly label: string;
  readonly interactive?: false;
}

interface InteractiveChipProps {
  readonly label: string;
  readonly interactive: true;
  readonly expanded: boolean;
  readonly controls: string;
  readonly pending: boolean;
  /** Native popover invoker: the browser toggles it and keeps light-dismiss from reopening it. */
  readonly popoverTarget?: string;
  readonly onClick?: () => void;
  readonly ref?: Ref<HTMLButtonElement>;
}

export type SentenceChipProps = StaticChipProps | InteractiveChipProps;

export function SentenceChip(props: SentenceChipProps) {
  if (!props.interactive) {
    return <span className={styles.chip}>{props.label}</span>;
  }

  const { label, expanded, controls, pending, popoverTarget, onClick, ref } = props;
  return (
    <button
      ref={ref}
      type="button"
      className={`${styles.chip} ${styles.interactive}`}
      aria-haspopup="dialog"
      aria-expanded={expanded}
      aria-controls={controls}
      aria-busy={pending}
      data-pending={pending || undefined}
      popoverTarget={popoverTarget}
      onClick={onClick}
    >
      {label}
      <span className={styles.caret} aria-hidden="true">
        ▾
      </span>
    </button>
  );
}
