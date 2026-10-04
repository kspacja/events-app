'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import * as maplibregl from 'maplibre-gl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useOccurrenceSelection, useOccurrenceSelectionInstructions } from '../OccurrenceSelectionProvider';
import {
  Layer,
  Map,
  NavigationControl,
  Popup,
  Source,
  type LayerProps,
  type MapEvent,
  type MapLayerMouseEvent,
  type MapRef,
} from 'react-map-gl/maplibre';
import type { FeatureCollection, Point } from 'geojson';
import { MAP_CONTROL_LOCALE } from '../labels';
import { viewFor, type MapPoint } from '../mapView';
import styles from './EventsMap.module.css';

// Bundlers break maplibre's default worker URL (derived from import.meta.url)
maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/bright';
const SOURCE_ID = 'events';
const CLUSTER_LAYER_ID = 'event-clusters';
const POINT_LAYER_ID = 'event-points';
// One past clusterMaxZoom so a requested point is never inside a cluster
const SELECTED_MIN_ZOOM = 15;

const FALLBACK_ACCENT = '#c2410c';
const FALLBACK_MUTED = '#b5b2ab';
const FALLBACK_HALO = '#ffffff';

const hasActive: maplibregl.ExpressionSpecification = ['>', ['get', 'activeCount'], 0];

interface Palette {
  readonly accent: string;
  readonly muted: string;
  readonly halo: string;
}

// Layer paint can't read CSS variables, so resolve them from tokens.css once the map is up
function readPalette(container: HTMLElement): Palette {
  const styles = getComputedStyle(container);
  // A missing token resolves to '' and MapLibre rejects an empty colour
  const token = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
  return {
    accent: token('--color-accent', FALLBACK_ACCENT),
    muted: token('--color-text-disabled', FALLBACK_MUTED),
    halo: token('--color-bg', FALLBACK_HALO),
  };
}

function layersFor({ accent, muted, halo }: Palette) {
  const clusterLayer: LayerProps = {
    id: CLUSTER_LAYER_ID,
    type: 'circle',
    source: SOURCE_ID,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': ['case', hasActive, accent, muted],
      'circle-radius': ['step', ['get', 'point_count'], 14, 10, 18, 30, 22],
      'circle-stroke-width': 2,
      'circle-stroke-color': halo,
    },
  };

  const clusterCountLayer: LayerProps = {
    id: 'event-cluster-count',
    type: 'symbol',
    source: SOURCE_ID,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['to-string', ['case', hasActive, ['get', 'activeCount'], ['get', 'point_count']]],
      'text-font': ['Noto Sans Bold'],
      'text-size': 12,
      'text-allow-overlap': true,
    },
    paint: { 'text-color': halo },
  };

  const pointLayer: LayerProps = {
    id: POINT_LAYER_ID,
    type: 'circle',
    source: SOURCE_ID,
    filter: ['!', ['has', 'point_count']],
    layout: { 'circle-sort-key': ['case', ['get', 'active'], 1, 0] },
    paint: {
      'circle-color': ['case', ['get', 'active'], accent, muted],
      'circle-radius': ['case', ['get', 'active'], 7, 5],
      'circle-stroke-width': 2,
      'circle-stroke-color': halo,
    },
  };

  return { clusterLayer, clusterCountLayer, pointLayer };
}

type MapLayers = ReturnType<typeof layersFor>;

interface EventsMapProps {
  readonly points: readonly MapPoint[];
  readonly focus: readonly MapPoint[];
}

export function EventsMap({ points, focus }: EventsMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [cursor, setCursor] = useState('');
  // Built once on load so the layer props stay referentially stable
  const [layers, setLayers] = useState<MapLayers | null>(null);
  const loaded = layers !== null;
  const selection = useOccurrenceSelection();
  const { popup, flyTo } = useOccurrenceSelectionInstructions();
  const selected = points.find((p) => p.occurrenceId === popup?.occurrenceId);
  const flightTarget = points.find((p) => p.occurrenceId === flyTo);
  const pointsKey = focus.map((p) => `${p.occurrenceId}:${p.lat}:${p.lng}`).join('|');
  const data = useMemo(() => toFeatureCollection(points), [points]);

  useEffect(() => {
    const { bounds, maxZoom, padding } = viewFor(focus);
    mapRef.current?.fitBounds(bounds, { maxZoom, padding, duration: 0 });
    // focus is covered by pointsKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!loaded || !map || !flyTo) return;
    if (flightTarget) {
      map.flyTo({
        center: [flightTarget.lng, flightTarget.lat],
        zoom: Math.max(map.getZoom(), SELECTED_MIN_ZOOM),
      });
    }
    selection.done('flyTo');
  }, [loaded, flyTo, flightTarget, selection]);

  const hasPopup = selected !== undefined;
  useEffect(() => {
    if (!hasPopup) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') selection.close();
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [hasPopup, selection]);

  function handleLoad(event: MapEvent) {
    setLayers(layersFor(readPalette(event.target.getContainer())));
  }

  function handleClick(event: MapLayerMouseEvent) {
    const feature = event.features?.[0];
    if (feature?.layer.id === POINT_LAYER_ID) {
      const clicked = points.find((p) => p.occurrenceId === feature.properties?.occurrenceId);
      if (clicked) selection.selectFromMap(clicked.occurrenceId);
      else selection.close();
      return;
    }
    selection.close();
    if (feature?.layer.id === CLUSTER_LAYER_ID) void zoomIntoCluster(event);
  }

  async function zoomIntoCluster(event: MapLayerMouseEvent) {
    const map = mapRef.current;
    const feature = event.features?.[0];
    const clusterId = feature?.properties?.cluster_id;
    if (!map || !feature || typeof clusterId !== 'number' || feature.geometry.type !== 'Point') return;
    const source = map.getSource<maplibregl.GeoJSONSource>(SOURCE_ID);
    if (!source) return;
    const zoom = await source.getClusterExpansionZoom(clusterId);
    const [lng, lat] = feature.geometry.coordinates;
    map.easeTo({ center: [lng, lat], zoom });
  }

  return (
    <Map
      ref={mapRef}
      mapLib={maplibregl}
      reuseMaps
      mapStyle={MAP_STYLE_URL}
      initialViewState={initialViewStateFor(focus)}
      attributionControl={{ compact: true }}
      locale={MAP_CONTROL_LOCALE}
      interactiveLayerIds={[CLUSTER_LAYER_ID, POINT_LAYER_ID]}
      cursor={cursor}
      onLoad={handleLoad}
      onClick={handleClick}
      onMouseEnter={() => setCursor('pointer')}
      onMouseLeave={() => setCursor('')}
      style={{ width: '100%', height: '100%' }}
    >
      <NavigationControl position="top-right" showCompass={false} />
      <Source
        id={SOURCE_ID}
        type="geojson"
        data={data}
        cluster
        clusterRadius={40}
        clusterMaxZoom={14}
        clusterProperties={{ activeCount: ['+', ['case', ['get', 'active'], 1, 0]] }}
      >
        {layers ? (
          <>
            <Layer {...layers.clusterLayer} />
            <Layer {...layers.clusterCountLayer} />
            <Layer {...layers.pointLayer} />
          </>
        ) : null}
      </Source>
      {selected && popup ? (
        <Popup
          key={popup.key}
          longitude={selected.lng}
          latitude={selected.lat}
          anchor="bottom"
          offset={12}
          closeOnClick={false}
          focusAfterOpen={popup.takeFocus}
          onClose={() => selection.close(popup)}
          className={styles.popup}
        >
          <div role="dialog" aria-label={selected.title}>
            <p className={styles.title}>{selected.title}</p>
            <p className={styles.when}>
              {selected.date} · {selected.time}
            </p>
          </div>
        </Popup>
      ) : null}
    </Map>
  );
}

function toFeatureCollection(points: readonly MapPoint[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: points.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: { occurrenceId: p.occurrenceId, title: p.title, active: p.active },
    })),
  };
}

function initialViewStateFor(points: readonly MapPoint[]) {
  const { bounds, maxZoom, padding } = viewFor(points);
  return { bounds, fitBoundsOptions: { maxZoom, padding } };
}
