import type { ExpressionSpecification, LayerSpecification, StyleSpecification } from 'maplibre-gl';

export interface BasemapPalette {
  readonly water: string;
  readonly land: string;
  readonly green: string;
  readonly road: string;
  readonly roadCasing: string;
}

const POLISH_NAME: ExpressionSpecification = ['coalesce', ['get', 'name:pl'], ['get', 'name:latin'], ['get', 'name']];

const GREEN_LAYERS = new Set(['park', 'landcover-wood', 'landcover-grass', 'landcover-grass-park']);
const ROAD_LAYER = /^(highway|bridge|tunnel)-/;

function isRoadLine(id: string): boolean {
  // Paths and rails keep their own dashed look
  return ROAD_LAYER.test(id) && !id.includes('path') && !id.includes('railway');
}

function hasNameLabel(layer: LayerSpecification): boolean {
  if (layer.type !== 'symbol') return false;
  const field = layer.layout?.['text-field'];
  return field !== undefined && JSON.stringify(field).includes('"name');
}

function recolor(layer: LayerSpecification, palette: BasemapPalette): LayerSpecification {
  const { id } = layer;
  if (layer.type === 'background') return { ...layer, paint: { ...layer.paint, 'background-color': palette.land } };
  if (layer.type === 'fill') {
    if (id === 'water' || id === 'water-intermittent') return { ...layer, paint: { ...layer.paint, 'fill-color': palette.water } };
    if (GREEN_LAYERS.has(id)) return { ...layer, paint: { ...layer.paint, 'fill-color': palette.green } };
    if (id.startsWith('landuse-')) return { ...layer, paint: { ...layer.paint, 'fill-color': palette.land } };
  }
  if (layer.type === 'line') {
    if (id.startsWith('waterway')) return { ...layer, paint: { ...layer.paint, 'line-color': palette.water } };
    if (isRoadLine(id)) {
      const color = id.endsWith('-casing') ? palette.roadCasing : palette.road;
      return { ...layer, paint: { ...layer.paint, 'line-color': color } };
    }
  }
  if (hasNameLabel(layer) && layer.type === 'symbol') {
    return { ...layer, layout: { ...layer.layout, 'text-field': POLISH_NAME } };
  }
  return layer;
}

/** The base map in Polish and in the site's colours: names from `name:pl`, water, land, greenery and roads from the tokens. */
export function localizeBasemap(style: StyleSpecification, palette: BasemapPalette): StyleSpecification {
  return { ...style, layers: style.layers.map((layer) => recolor(layer, palette)) };
}
