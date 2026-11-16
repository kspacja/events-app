import { describe, expect, it } from 'vitest';
import type { Price } from '@events/contract/listing';
import { formatPrice } from './eventFacts';

const paid = (from: number, to: number | null, per?: 'person' | 'group' | 'hour'): Price => ({ kind: 'paid', from, to, currency: 'PLN', ...(per ? { per } : {}) });

describe('formatPrice', () => {
  it.each([
    ['a free event', { kind: 'free' } as Price, 'bezpłatne'],
    ['a price with no unit, as per person', paid(15, null), '15 zł / os.'],
    ['a range per person', paid(15, 25, 'person'), '15–25 zł / os.'],
    ['a price per group', paid(350, null, 'group'), '350 zł / grupa'],
    ['a price per hour', paid(120, 120, 'hour'), '120 zł / godz.'],
  ])('shows %s', (_name, price, expected) => {
    expect(formatPrice(price)).toBe(expected);
  });
});
