import { describe, expect, it } from 'vitest';
import { createApp } from './app';

describe('GET /health', () => {
  it('answers ok', async () => {
    const response = await createApp().request('/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });
});
