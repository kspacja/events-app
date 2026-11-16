type ClarityQueue = ((...args: unknown[]) => void) & { q?: unknown[][] };

declare global {
  interface Window {
    clarity?: ClarityQueue;
  }
}

/** Microsoft Clarity's loader: a queue for calls made before the tag arrives, then the tag itself. */
export function startClarity(projectId: string): void {
  if (window.clarity) return;
  const queue: ClarityQueue = (...args) => {
    (queue.q ??= []).push(args);
  };
  window.clarity = queue;
  // Only after the visitor said yes; Clarity needs this signal for visitors in the EU
  queue('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${encodeURIComponent(projectId)}`;
  document.head.appendChild(script);
}
