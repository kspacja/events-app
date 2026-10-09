import { describe, expect, it, vi } from 'vitest';
import { OCCURRENCES_QUERY_ERRORS, occurrencesResponseSchema } from '@events/contract/occurrences-http';
import { createApp } from '../../app';
import { OCCURRENCE_ROW } from './occurrenceRow.testing';
import { toListing, type ListOccurrences, type OccurrencesQuery } from './occurrences';

async function get(query: string, listOccurrences: ListOccurrences) {
  const response = await createApp({ listOccurrences }).request(`/occurrences${query}`);
  return { status: response.status, body: (await response.json()) as unknown };
}

describe('GET /occurrences', () => {
  it('serves the listings for the validated range in the contract shape', async () => {
    const listing = toListing(OCCURRENCE_ROW, [{ slug: 'music', label: 'Muzyka' }]);
    const asked: OccurrencesQuery[] = [];

    const result = await get('?from=2030-01-01&to=2030-01-07', async (range) => {
      asked.push(range);
      return [listing];
    });

    expect(result.status).toBe(200);
    expect(occurrencesResponseSchema.parse(result.body)).toEqual({ occurrences: [listing] });
    expect(asked).toEqual([{ from: '2030-01-01', to: '2030-01-07', forSchools: false }]);
  });

  it.each([
    ['', OCCURRENCES_QUERY_ERRORS.missing],
    ['?from=2030-02-30&to=2030-03-01', OCCURRENCES_QUERY_ERRORS.format],
    ['?from=2030-03-02&to=2030-03-01', OCCURRENCES_QUERY_ERRORS.order],
    ['?from=2030-01-01&to=2030-02-01', OCCURRENCES_QUERY_ERRORS.tooLong],
    ['?from=2030-01-01&to=2030-01-01&forSchools=yes', OCCURRENCES_QUERY_ERRORS.forSchools],
  ])('rejects %s with 400 and the contract message', async (query, error) => {
    const listOccurrences = vi.fn<ListOccurrences>();

    expect(await get(query, listOccurrences)).toEqual({ status: 400, body: { error } });
    expect(listOccurrences).not.toHaveBeenCalled();
  });

  it('passes forSchools=true on to the reader', async () => {
    const asked: OccurrencesQuery[] = [];

    await get('?from=2030-01-01&to=2030-01-01&forSchools=true', async (query) => {
      asked.push(query);
      return [];
    });

    expect(asked).toEqual([{ from: '2030-01-01', to: '2030-01-01', forSchools: true }]);
  });

  it('answers 500 without database details when reading fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await get('?from=2030-01-01&to=2030-01-01', async () => {
      throw new Error('connection refused to 10.0.0.5');
    });

    expect(result.status).toBe(500);
    expect(JSON.stringify(result.body)).not.toContain('10.0.0.5');
  });
});
