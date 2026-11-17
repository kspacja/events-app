'use client';

import dynamic from 'next/dynamic';
import type { OccurrenceId } from '@events/contract/listing';
import type { MapArea, MapPoint } from '../mapView';
import styles from './EventsMapLoader.module.css';

const EventsMap = dynamic(
  () => import('./EventsMap').then((m) => m.EventsMap),
  { ssr: false, loading: () => <div className={styles.placeholder} /> },
);

interface EventsMapLoaderProps {
  readonly points: readonly MapPoint[];
  readonly focus: readonly MapPoint[];
  readonly area?: MapArea | null;
  readonly onShowInWeek?: (occurrenceId: OccurrenceId) => void;
  readonly showInLabel?: string;
}

export function EventsMapLoader(props: EventsMapLoaderProps) {
  return <EventsMap {...props} />;
}
