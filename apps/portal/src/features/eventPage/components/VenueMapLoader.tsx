'use client';

import dynamic from 'next/dynamic';
import styles from './VenueMap.module.css';

/** MapLibre needs the browser, so the map loads there only. */
export const VenueMapLoader = dynamic(() => import('./VenueMap').then((m) => m.VenueMap), {
  ssr: false,
  loading: () => <div className={styles.map} />,
});
