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

/** The chosen Miejscowość and its radius, drawn as a circle (stage 3.8). */
export interface MapArea {
  readonly lat: number;
  readonly lng: number;
  readonly radiusKm: number;
}

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

export function viewFor(points: readonly MapPoint[], area: MapArea | null = null): MapView {
  return { bounds: area ? areaBounds(area) : boundsFor(points), maxZoom: MAP_MAX_FIT_ZOOM, padding: MAP_FIT_PADDING };
}

const KM_PER_DEGREE_LAT = 111.32;
// Radius 0 means the Miejscowość itself; frame a few km around its centre
const OWN_LOCALITY_FRAME_KM = 3;
const CIRCLE_STEPS = 64;

function kmToDegrees({ lat, radiusKm }: MapArea): { dLat: number; dLng: number } {
  const km = radiusKm > 0 ? radiusKm : OWN_LOCALITY_FRAME_KM;
  return { dLat: km / KM_PER_DEGREE_LAT, dLng: km / (KM_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180)) };
}

function areaBounds(area: MapArea): Bounds {
  const { dLat, dLng } = kmToDegrees(area);
  return [
    [area.lng - dLng, area.lat - dLat],
    [area.lng + dLng, area.lat + dLat],
  ];
}

/** The radius as a closed ring of [lng, lat]; close enough to a circle at these distances. */
export function areaRing(area: MapArea): [number, number][] {
  const { dLat, dLng } = kmToDegrees(area);
  return Array.from({ length: CIRCLE_STEPS + 1 }, (_, step) => {
    const angle = (2 * Math.PI * step) / CIRCLE_STEPS;
    return [area.lng + dLng * Math.cos(angle), area.lat + dLat * Math.sin(angle)];
  });
}
