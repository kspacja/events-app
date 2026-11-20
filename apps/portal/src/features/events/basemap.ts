import type { StyleSpecification } from 'maplibre-gl';
import type { BasemapPalette } from './mapStyle';

/** The vector basemap every map in the portal starts from; `localizeBasemap` turns it Polish and on-brand. */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/bright';

const FALLBACK_BASEMAP: BasemapPalette = {
  water: '#bfd7ea',
  land: '#f5f4f1',
  green: '#e3ecd9',
  road: '#ffffff',
  roadCasing: '#e2ddd3',
};

/** Browser only: the map colours from the theme tokens. */
export function readBasemapPalette(): BasemapPalette {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
  return {
    water: token('--color-map-water', FALLBACK_BASEMAP.water),
    land: token('--color-map-land', FALLBACK_BASEMAP.land),
    green: token('--color-map-green', FALLBACK_BASEMAP.green),
    road: token('--color-map-road', FALLBACK_BASEMAP.road),
    roadCasing: token('--color-map-road-casing', FALLBACK_BASEMAP.roadCasing),
  };
}

let basemapRequest: Promise<StyleSpecification | null> | null = null;

// Fetched once and reworked before the first frame, so the map never shows the English, off-brand original
export function loadBasemap(): Promise<StyleSpecification | null> {
  basemapRequest ??= fetch(MAP_STYLE_URL)
    .then((response) => (response.ok ? (response.json() as Promise<StyleSpecification>) : null))
    .catch(() => null);
  return basemapRequest;
}
