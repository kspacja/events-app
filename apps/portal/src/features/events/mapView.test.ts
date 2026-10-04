import { describe, expect, it } from 'vitest';
import { viewFor, type MapPoint } from './mapView';

function point(id: string, lat: number, lng: number): MapPoint {
  return { id, lat, lng, title: id, date: 'sobota, 6.06', time: '19:00', active: true };
}

describe('viewFor', () => {
  it('shows all of Poland when there are no points', () => {
    expect(viewFor([])).toEqual({ longitude: 19.1, latitude: 52.0, zoom: 5 });
  });

  it('fits a single point with a zoom cap so it is not over-zoomed', () => {
    const view = viewFor([point('a', 50.06, 19.94)]);

    expect(view).toMatchObject({
      bounds: [
        [19.94, 50.06],
        [19.94, 50.06],
      ],
      fitBoundsOptions: { maxZoom: 14 },
    });
  });

  it('fits points in several cities inside the bounds', () => {
    const view = viewFor([
      point('warsaw', 52.23, 21.01),
      point('krakow', 50.06, 19.94),
      point('gdansk', 54.35, 18.65),
    ]);

    expect(view).toMatchObject({
      bounds: [
        [18.65, 50.06],
        [21.01, 54.35],
      ],
      fitBoundsOptions: { maxZoom: 14 },
    });
  });
});
