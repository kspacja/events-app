'use client';

import { useEffect, useRef } from 'react';
import styles from './TopProgress.module.css';

// Creeps towards the end without reaching it, as the wait has no known length
const CREEP = { duration: 12000, easing: 'cubic-bezier(0.1, 0.7, 0.2, 1)' };
const FINISH_MS = 200;
const FADE_MS = 250;

interface TopProgressProps {
  readonly active: boolean;
}

/** A thin bar across the top of the page while a change waits for the server, like YouTube's. */
export function TopProgress({ active }: TopProgressProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    const fill = fillRef.current;
    // Popover puts the bar in the top layer, above an open filters dialog; jsdom has neither API
    if (!active || !bar || !fill || typeof bar.showPopover !== 'function' || typeof fill.animate !== 'function') return;

    bar.showPopover();
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const creep = fill.animate([{ transform: 'scaleX(0)' }, { transform: still ? 'scaleX(1)' : 'scaleX(0.9)' }], {
      ...CREEP,
      duration: still ? 0 : CREEP.duration,
      fill: 'forwards',
    });

    return () => {
      const reached = getComputedStyle(fill).transform;
      creep.cancel();
      const finish = fill.animate(
        [
          { transform: reached, opacity: 1 },
          { transform: 'scaleX(1)', opacity: 1, offset: FINISH_MS / (FINISH_MS + FADE_MS) },
          { transform: 'scaleX(1)', opacity: 0 },
        ],
        { duration: still ? 0 : FINISH_MS + FADE_MS, fill: 'forwards' },
      );
      finish.onfinish = () => {
        if (bar.matches(':popover-open')) bar.hidePopover();
        finish.cancel();
      };
    };
  }, [active]);

  return (
    <div ref={barRef} popover="manual" className={styles.bar} aria-hidden="true">
      <div ref={fillRef} className={styles.fill} />
    </div>
  );
}
