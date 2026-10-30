import type { OccurrenceId } from '@events/contract/listing';

export interface MapPoint {
  readonly occurrenceId: OccurrenceId;
  readonly lat: number;
  readonly lng: number;
  readonly title: string;
  readonly date: string;
  readonly time: string;
  readonly active: boolean;
}

/** Mutable tuple so it can be passed straight to maplibre's LngLatBoundsLike. */
type Bounds = [[number, number], [number, number]];

export interface MapView {
  readonly bounds: Bounds;
  readonly maxZoom: number;
  readonly padding: number;
}

const MAP_FIT_PADDING = 48;
// Caps the zoom for one point, or several at the same spot
const MAP_MAX_FIT_ZOOM = 14;
const POLAND_BOUNDS: Bounds = [
  [14.12, 49.0],
  [24.15, 54.84],
];

// Points spread wider than about a city frame all of Poland, so the country sits in the middle, not its western half
const CITY_SPAN_DEGREES = 1;

function boundsFor(points: readonly MapPoint[]): Bounds {
  if (points.length === 0) return POLAND_BOUNDS;
  const lngs = points.map((p) => p.lng);
  const lats = points.map((p) => p.lat);
  const [[west, south], [east, north]]: Bounds = [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
  if (east - west <= CITY_SPAN_DEGREES && north - south <= CITY_SPAN_DEGREES) {
    return [
      [west, south],
      [east, north],
    ];
  }
  const [[polandWest, polandSouth], [polandEast, polandNorth]] = POLAND_BOUNDS;
  return [
    [Math.min(west, polandWest), Math.min(south, polandSouth)],
    [Math.max(east, polandEast), Math.max(north, polandNorth)],
  ];
}

export function viewFor(points: readonly MapPoint[]): MapView {
  return { bounds: boundsFor(points), maxZoom: MAP_MAX_FIT_ZOOM, padding: MAP_FIT_PADDING };
}
