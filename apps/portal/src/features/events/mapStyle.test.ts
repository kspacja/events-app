import { describe, expect, it } from 'vitest';
import type { ExpressionSpecification, LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { localizeBasemap, type BasemapPalette } from './mapStyle';

const PALETTE: BasemapPalette = {
  water: '#water',
  land: '#land',
  green: '#green',
  road: '#road',
  roadCasing: '#casing',
};

const LATIN_NAME: ExpressionSpecification = ['coalesce', ['get', 'name_en'], ['get', 'name']];

function styleWith(layers: LayerSpecification[]): StyleSpecification {
  return { version: 8, sources: {}, layers };
}

function layerOf(style: StyleSpecification, id: string) {
  return style.layers.find((layer) => layer.id === id);
}

describe('localizeBasemap', () => {
  const style = localizeBasemap(
    styleWith([
      { id: 'background', type: 'background', paint: { 'background-color': '#f8f4f0' } },
      { id: 'water', type: 'fill', source: 'omt', paint: { 'fill-color': '#AECFE2', 'fill-opacity': 0.9 } },
      { id: 'waterway-river', type: 'line', source: 'omt', paint: { 'line-color': '#a0c8f0' } },
      { id: 'landcover-wood', type: 'fill', source: 'omt', paint: { 'fill-color': '#6a4' } },
      { id: 'landuse-residential', type: 'fill', source: 'omt', paint: { 'fill-color': '#eee' } },
      { id: 'highway-primary', type: 'line', source: 'omt', paint: { 'line-color': '#fea' } },
      { id: 'highway-primary-casing', type: 'line', source: 'omt', paint: { 'line-color': '#e9ac77' } },
      { id: 'highway-path', type: 'line', source: 'omt', paint: { 'line-color': '#cba' } },
      { id: 'bridge-railway', type: 'line', source: 'omt', paint: { 'line-color': '#bbb' } },
      { id: 'label_country_1', type: 'symbol', source: 'omt', layout: { 'text-field': LATIN_NAME } },
      { id: 'highway-shield-non-us', type: 'symbol', source: 'omt', layout: { 'text-field': ['to-string', ['get', 'ref']] } },
    ]),
    PALETTE,
  );

  it.each([
    ['background', 'background-color', '#land'],
    ['water', 'fill-color', '#water'],
    ['waterway-river', 'line-color', '#water'],
    ['landcover-wood', 'fill-color', '#green'],
    ['landuse-residential', 'fill-color', '#land'],
    ['highway-primary', 'line-color', '#road'],
    ['highway-primary-casing', 'line-color', '#casing'],
    ['highway-path', 'line-color', '#cba'],
    ['bridge-railway', 'line-color', '#bbb'],
  ])('paints %s with %s %s', (id, property, color) => {
    expect((layerOf(style, id)?.paint as Record<string, unknown>)[property]).toBe(color);
  });

  it('keeps the rest of the paint', () => {
    expect((layerOf(style, 'water')?.paint as Record<string, unknown>)['fill-opacity']).toBe(0.9);
  });

  it('labels places with their Polish name first', () => {
    expect((layerOf(style, 'label_country_1')?.layout as Record<string, unknown>)['text-field']).toEqual([
      'coalesce',
      ['get', 'name:pl'],
      ['get', 'name:latin'],
      ['get', 'name'],
    ]);
  });

  it('leaves road numbers alone', () => {
    expect((layerOf(style, 'highway-shield-non-us')?.layout as Record<string, unknown>)['text-field']).toEqual([
      'to-string',
      ['get', 'ref'],
    ]);
  });
});
