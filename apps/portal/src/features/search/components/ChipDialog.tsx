'use client';

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useRef,
  type SyntheticEvent,
  useState,
  useSyncExternalStore,
  useTransition,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { SentenceChip } from './SentenceChip';
import styles from './ChipDialog.module.css';

const MOBILE_QUERY = '(max-width: 768px)';
const VIEWPORT_MARGIN = 8;
const DIALOG_OFFSET = 8;

type Navigate = (href: string) => void;

const NavigateContext = createContext<Navigate | null>(null);

/** Pushes the href and closes the surrounding ChipDialog. */
export function useChipNavigate(): Navigate {
  const navigate = useContext(NavigateContext);
  if (!navigate) throw new Error('useChipNavigate must be used inside ChipDialog');
  return navigate;
}

const subscribeNothing = () => () => {};

function subscribeToViewport(onChange: () => void) {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const getIsMobile = () => window.matchMedia(MOBILE_QUERY).matches;

function positionBelow(dialog: HTMLDialogElement, chip: HTMLElement) {
  const rect = chip.getBoundingClientRect();
  const maxLeft = window.innerWidth - dialog.offsetWidth - VIEWPORT_MARGIN;
  const left = Math.max(VIEWPORT_MARGIN, Math.min(rect.left, maxLeft));
  dialog.style.top = `${rect.bottom + window.scrollY + DIALOG_OFFSET}px`;
  dialog.style.left = `${left + window.scrollX}px`;
}

function focusFirstControl(dialog: HTMLDialogElement) {
  dialog.querySelector<HTMLElement>('button, input')?.focus();
}

interface ChipDialogProps {
  readonly label: string;
  readonly dialogLabel: string;
  readonly children: ReactNode;
}

/** Desktop: a native popover under the chip. Mobile: a modal bottom sheet. */
export function ChipDialog({ label, dialogLabel, children }: ChipDialogProps) {
  const router = useRouter();
  const dialogId = useId();
  const chipRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isClient = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const isMobile = useSyncExternalStore(subscribeToViewport, getIsMobile, () => false);

  const closeDialog = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isMobile) dialog.close();
    else dialog.hidePopover();
  }, [isMobile]);

  function openSheet() {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    setIsOpen(true);
    focusFirstControl(dialog);
  }

  function handleChipClick() {
    if (isOpen) closeDialog();
    else openSheet();
  }

  // Fires for popovers only on desktop; the sheet is tracked by openSheet and onClose
  function handleToggle(event: SyntheticEvent<HTMLDialogElement>) {
    const { nativeEvent, currentTarget } = event;
    if (isMobile || !('newState' in nativeEvent)) return;
    const opened = nativeEvent.newState === 'open';
    setIsOpen(opened);
    if (!opened) return;
    if (chipRef.current) positionBelow(currentTarget, chipRef.current);
    focusFirstControl(currentTarget);
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (isMobile && event.target === event.currentTarget) closeDialog();
  }

  const navigate = useCallback(
    (href: string) => {
      startTransition(() => {
        router.push(href, { scroll: false });
      });
      closeDialog();
    },
    [router, closeDialog],
  );

  const dialog = (
    <dialog
      ref={dialogRef}
      id={dialogId}
      className={styles.dialog}
      aria-label={dialogLabel}
      popover={isMobile ? undefined : 'auto'}
      onToggle={handleToggle}
      onClose={() => setIsOpen(false)}
      onClick={handleBackdropClick}
    >
      <NavigateContext value={navigate}>{children}</NavigateContext>
    </dialog>
  );

  return (
    <>
      <SentenceChip
        interactive
        ref={chipRef}
        label={label}
        expanded={isOpen}
        controls={dialogId}
        pending={isPending}
        popoverTarget={isMobile ? undefined : dialogId}
        onClick={isMobile ? handleChipClick : undefined}
      />
      {isClient ? createPortal(dialog, document.body) : null}
    </>
  );
}
