interface ChevronProps {
  readonly direction: -1 | 1;
  readonly size?: number;
}

/** The one previous/next sign across the app; decorative, the link or button carries the label. */
export function Chevron({ direction, size = 18 }: ChevronProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={direction < 0 ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  );
}
