import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  readonly width?: CSSProperties['width'];
  readonly height?: CSSProperties['height'];
  /** e.g. 3 / 2 for a photo; overrides the height. */
  readonly aspectRatio?: CSSProperties['aspectRatio'];
  readonly radius?: CSSProperties['borderRadius'];
  readonly className?: string;
}

/** A pulsing placeholder block, the shape of what will load there. */
export function Skeleton({ width = '100%', height = 16, aspectRatio, radius, className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={className ? `${styles.block} ${className}` : styles.block}
      style={{ width, height: aspectRatio ? 'auto' : height, aspectRatio, borderRadius: radius }}
    />
  );
}
