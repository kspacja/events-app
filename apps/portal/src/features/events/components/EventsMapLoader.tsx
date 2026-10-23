'use client';

import dynamic from 'next/dynamic';
import type { OccurrenceId } from '@events/contract/listing';
import type { MapPoint } from '../mapView';
import styles from './EventsMapLoader.module.css';

const EventsMap = dynamic(
  () => import('./EventsMap').then((m) => m.EventsMap),
  { ssr: false, loading: () => <div className={styles.placeholder} /> },
);

interface EventsMapLoaderProps {
  readonly points: readonly MapPoint[];
  readonly focus: readonly MapPoint[];
  readonly onShowInWeek?: (occurrenceId: OccurrenceId) => void;
}

export function EventsMapLoader({ points, focus, onShowInWeek }: EventsMapLoaderProps) {
  return <EventsMap points={points} focus={focus} onShowInWeek={onShowInWeek} />;
}
