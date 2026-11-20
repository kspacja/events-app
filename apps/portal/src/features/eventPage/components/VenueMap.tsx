'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import * as maplibregl from 'maplibre-gl';
import { useEffect, useState } from 'react';
import { Map, Marker, NavigationControl } from 'react-map-gl/maplibre';
import { loadBasemap, MAP_STYLE_URL, readBasemapPalette } from '@/features/events/basemap';
import { MAP_CONTROL_LOCALE } from '@/features/events/labels';
import { localizeBasemap } from '@/features/events/mapStyle';
import styles from './VenueMap.module.css';

// Bundlers break maplibre's default worker URL (derived from import.meta.url)
maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

const ZOOM = 14;

interface VenueMapProps {
  readonly lat: number;
  readonly lng: number;
  readonly label: string;
}

/** One pin on the venue; the page scrolls over it, so only the buttons and a drag move the map. */
export function VenueMap({ lat, lng, label }: VenueMapProps) {
  const [basemap, setBasemap] = useState<maplibregl.StyleSpecification | string | null>(null);

  useEffect(() => {
    let active = true;
    void loadBasemap().then((style) => {
      if (active) setBasemap(style ? localizeBasemap(style, readBasemapPalette()) : MAP_STYLE_URL);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!basemap) return <div className={styles.map} />;
  return (
    <div className={styles.map} role="img" aria-label={label}>
      <Map
        initialViewState={{ latitude: lat, longitude: lng, zoom: ZOOM }}
        mapStyle={basemap}
        scrollZoom={false}
        attributionControl={{ compact: true }}
        locale={MAP_CONTROL_LOCALE}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <Marker latitude={lat} longitude={lng} anchor="bottom">
          <svg className={styles.pin} width="32" height="40" viewBox="0 0 24 30" aria-hidden="true">
            <path d="M12 29s-10-9.2-10-17a10 10 0 0 1 20 0c0 7.8-10 17-10 17z" fill="currentColor" stroke="#fff" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="3.5" fill="#fff" />
          </svg>
        </Marker>
      </Map>
    </div>
  );
}
