# Plan wdrożenia architektury

Realizacja ADR-0001…0008 etapami. Pojęcia: `CONTEXT-MAP.md`. Decyzje: `docs/adr/`.

**Bramki** = `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` uruchomione z katalogu głównego.

## Proces kroku

Etap dzieli się na kroki. Każdy krok przechodzi te punkty po kolei:

1. **Zakres** — zakres i decyzje kroku są zapisane w pliku etapu (`stages/`). Ustalenia z rozmowy trafiają tam przed implementacją.
2. **Implementacja** — commit(y) bez pusha; bramki zielone, smoke test portalu (`API_MOCKING=enabled`) przechodzi.
3. **Code review w dwóch osiach** (Standards + Spec, równolegle, punkt odniesienia = commit sprzed kroku; Spec = plik etapu + ADR-y) — każda uwaga poprawiona albo wpisana do „Odłożone” z powodem.

Koniec etapu: status w tabeli zaktualizowany. Przegląd architektury robimy raz, po etapie z pełnym numerem (1, 2, …): użytkownik uruchamia `/mattpocock-skills:improve-codebase-architecture` (model nie może go wywołać), a etap jest zamknięty, gdy każdy kandydat jest wdrożony, odłożony albo odrzucony. Etapy pośrednie (0.5, 0.6, 1.5) zamyka samo code review kroków, bez żadnego przeglądu architektury (także wąskiego) — przegląd architektury obejmie je razem z następnym pełnym etapem.

## Etapy

| Etap | Cel | Status | Szczegóły |
| --- | --- | --- | --- |
| 0. Monorepo | pnpm + Turborepo, `apps/portal`, pakiety współdzielone | zrobione | historia gita |
| 0.5 Porządki | czas lokalny, seam odczytu Terminów, wybór Terminu na mapie | zrobione | historia gita |
| 0.6 Gotowość do etapu 1 | interfejs źródła Terminów w pakiecie, Kategoria jako dane, przykładowy Katalog | zrobione | [stages/0.6-gotowosc-do-etapu-1.md](stages/0.6-gotowosc-do-etapu-1.md) |
| 1. Backend + baza | `apps/api` (Hono + Drizzle) serwuje Terminy z Postgresa, portal czyta przez HTTP (ADR-0008) | — | [stages/1-baza-i-katalog.md](stages/1-baza-i-katalog.md) |
| 1.5 Obserwowalność | ślady, metryki, logi i błędy z aplikacji i workera | — | [stages/1.5-obserwowalnosc.md](stages/1.5-obserwowalnosc.md) |
| 2. Tożsamość | konta `Attendee`, `Organizer`, `Moderator`, `Guest` (ADR-0004, 0005) | — | — |
| 3. Studio | `apps/studio`: Organizator dodaje Wydarzenia, Terminy, Miejsca, Zgłoszenia | — | — |
| 4. Moderacja | `apps/moderation`: kolejka Zgłoszeń i decyzje | — | — |
| 5. Rekomendacje | `packages/recommendations`, `apps/worker`, Reakcje, `ColdStart` (ADR-0003, 0007) | — | — |
| 6. Import i API | import CSV, publiczne API Organizatorów | — | — |
| 7. Wdrożenie | Vercel, Neon, Railway/Fly, CI (ADR-0006) | — | — |

Plik etapu powstaje, gdy etap rusza: cel, kroki, decyzje, otwarte pytania, kryterium ukończenia.

## Odłożone

Świadomie odłożone ustalenia z przeglądów. Wracamy do nich, gdy zmienia się dany obszar.

- Przewijanie do mapy po wyborze Terminu z karty działa też na desktopie — rdzeń wyboru nie wie, czy mapa jest rozwinięta.
- Zapasowe kolory mapy w `EventsMap` dublują tokeny — siatka bezpieczeństwa.
- Liniowe `points.find` przy kliknięciu w mapę — wystarcza przy tej skali.
- `isCalendarDay` mapuje lata 0–99 przez `Date.UTC` — bez znaczenia dla domeny.
- Lint nie blokuje względnych importów korzenia sąsiedniego pakietu (`../time` bez `/src`) — importy idą przez `@events/*`.
- Fałszywe źródła w testach (źródło w pamięci w `contract`, handler MSW) dzielą mały kształt filtra i sortowania.
- Brak testu `EventsMap`: lot do Terminu bez punktu jest potwierdzany tylko w kodzie adaptera, sprawdzony w Chrome — wymaga osobnego zestawu testów mapy.

## Testowanie

MCP Chroma użyj tylko na samym końcu - po realizowaniu całego planu.
