export interface MapPoint {
  readonly occurrenceId: string;
  readonly eventId: string;
  readonly lat: number;
  readonly lng: number;
  readonly title: string;
  readonly date: string;
  readonly time: string;
  readonly active: boolean;
}

/** Mutable tuple so it can be passed straight to maplibre's LngLatBoundsLike. */
type Bounds = [[number, number], [number, number]];

export type MapView =
  | {
      readonly bounds: Bounds;
      readonly fitBoundsOptions: { readonly padding: number; readonly maxZoom: number };
    }
  | { readonly longitude: number; readonly latitude: number; readonly zoom: number };

const MAP_FIT_PADDING = 48;
// Caps the zoom for one point, or several at the same spot
const MAP_MAX_FIT_ZOOM = 14;
const POLAND_VIEW = { longitude: 19.1, latitude: 52.0, zoom: 5 } as const;

function boundsFor(points: readonly MapPoint[]): Bounds {
  const lngs = points.map((p) => p.lng);
  const lats = points.map((p) => p.lat);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

export function viewFor(points: readonly MapPoint[]): MapView {
  if (points.length === 0) return POLAND_VIEW;
  return {
    bounds: boundsFor(points),
    fitBoundsOptions: { padding: MAP_FIT_PADDING, maxZoom: MAP_MAX_FIT_ZOOM },
  };
}
