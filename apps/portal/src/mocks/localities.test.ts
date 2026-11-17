import { describe, expect, it } from 'vitest';
import { localitiesResponseSchema, localityResponseSchema } from '@events/contract/localities';
import { SAMPLE_LOCALITIES } from '@events/repo';
import { TEST_EVENTS_API_URL } from '@/test/mockServer';
import { indexLocalities, searchKey, searchLocalities } from './localities';

const INDEXED = indexLocalities(SAMPLE_LOCALITIES);
const names = (query: string) => searchLocalities(INDEXED, query).localities.map(({ name }) => name);

describe('searchKey', () => {
  it('drops Polish marks, ł included', () => {
    expect(searchKey('  Łódź Żółć ')).toBe('lodz zolc');
  });
});

describe('searchLocalities', () => {
  it('finds a city typed without Polish marks', () => {
    expect(names('lodz')[0]).toBe('Łódź');
  });

  it('puts cities before villages of the same prefix', () => {
    const hits = searchLocalities(INDEXED, 'wroc').localities;
    expect(hits[0].name).toBe('Wrocław');
    const firstVillage = hits.findIndex(({ kind }) => kind !== 'city');
    expect(hits.slice(0, firstVillage === -1 ? hits.length : firstVillage).every(({ kind }) => kind === 'city')).toBe(true);
  });

  it('narrows a repeated name by commune or county', () => {
    const all = searchLocalities(INDEXED, 'nowa wies');
    expect(all.total).toBeGreaterThan(8);
    expect(all.localities).toHaveLength(8);

    const narrowed = searchLocalities(INDEXED, 'nowa wies katy');
    expect(narrowed.localities.map(({ name, commune }) => `${name}, ${commune}`)).toContain('Nowa Wieś Wrocławska, Kąty Wrocławskie');
  });

  it('finds villages near Wrocław', () => {
    expect(names('kobierzyce')).toContain('Kobierzyce');
  });
});

describe('localities handlers', () => {
  it('serves hints in the contract shape', async () => {
    const response = await fetch(`${TEST_EVENTS_API_URL}/localities?q=lodz`);
    expect(response.status).toBe(200);
    const body = localitiesResponseSchema.parse(await response.json());
    expect(body.localities[0].name).toBe('Łódź');
  });

  it('rejects a one-letter query', async () => {
    const response = await fetch(`${TEST_EVENTS_API_URL}/localities?q=w`);
    expect(response.status).toBe(400);
  });

  it('serves one locality by its SIMC id, 404 otherwise', async () => {
    const found = await fetch(`${TEST_EVENTS_API_URL}/localities/0986283`);
    expect(localityResponseSchema.parse(await found.json()).locality.name).toBe('Wrocław');
    expect((await fetch(`${TEST_EVENTS_API_URL}/localities/0000000`)).status).toBe(404);
  });
});

describe('nearest locality', () => {
  it('finds the Miejscowość closest to a point, a village included', async () => {
    // A field just outside Kobierzyce
    const response = await fetch(`${TEST_EVENTS_API_URL}/localities/nearest?lat=50.972&lng=16.93`);
    expect(localityResponseSchema.parse(await response.json()).locality.name).toBe('Kobierzyce');
  });

  it('rejects a point that is no coordinates', async () => {
    expect((await fetch(`${TEST_EVENTS_API_URL}/localities/nearest?lat=abc&lng=17`)).status).toBe(400);
  });
});
