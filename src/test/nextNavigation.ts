import { vi } from 'vitest';

export const push = vi.fn();

// Usage in a test file: vi.mock('next/navigation', async () => (await import('@/test/nextNavigation')).nextNavigationMock);
export const nextNavigationMock = {
  useRouter: () => ({ push }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
};
