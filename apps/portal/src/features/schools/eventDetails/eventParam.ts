import type { OccurrenceId } from '@events/contract/listing';

/** `?wydarzenie=<occurrence id>` beside the filters; Next's useSearchParams follows pushState, so the page does not reload. */
export const EVENT_PARAM = 'wydarzenie';

const OPENED_HERE = 'eventDetails';

export function openEventDetails(occurrenceId: OccurrenceId): void {
  const url = new URL(window.location.href);
  url.searchParams.set(EVENT_PARAM, occurrenceId);
  // A fresh state: copying Next's own keys would make Next take this for its navigation and skip useSearchParams
  window.history.pushState({ [OPENED_HERE]: true }, '', url);
}

/** Back when the dialog was opened on this page, so "back" and closing agree; a shared link just drops the param. */
export function closeEventDetails(): void {
  if (window.history.state?.[OPENED_HERE]) {
    window.history.back();
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.delete(EVENT_PARAM);
  window.history.replaceState(null, '', url);
}
