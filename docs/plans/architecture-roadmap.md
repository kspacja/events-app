# Plan wdrożenia architektury

Realizacja ADR-0001…0007 etapami. Pojęcia: `CONTEXT-MAP.md`. Decyzje: `docs/adr/`.

**Bramki** = `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` uruchomione z katalogu głównego.

## Proces kroku

Etap dzieli się na kroki. Każdy krok przechodzi te punkty po kolei:

1. **Zakres** — zakres i decyzje kroku są zapisane w pliku etapu (`stages/`). Ustalenia z rozmowy trafiają tam przed implementacją.
2. **Implementacja** — commit(y) bez pusha; bramki zielone, smoke test portalu (`API_MOCKING=enabled`) przechodzi.
3. **Code review w dwóch osiach** (Standards + Spec, równolegle, punkt odniesienia = commit sprzed kroku; Spec = plik etapu + ADR-y) — każda uwaga poprawiona albo wpisana do „Odłożone” z powodem.
4. **Przeglądarka** — zmiany widoczne dla użytkownika sprawdzone w Chrome; sprawdzone scenariusze wypisane w raporcie kroku.

Koniec etapu: status w tabeli zaktualizowany, a użytkownik uruchamia `/mattpocock-skills:improve-codebase-architecture` (model nie może go wywołać). Etap jest zamknięty, gdy każdy kandydat z przeglądu jest wdrożony, odłożony albo odrzucony.

## Etapy

| Etap | Cel | Status | Szczegóły |
| --- | --- | --- | --- |
| 0. Monorepo | pnpm + Turborepo, `apps/portal`, pakiety współdzielone | zrobione | historia gita |
| 0.5 Porządki | czas lokalny, seam odczytu Terminów, wybór Terminu na mapie | zrobione | historia gita |
| 0.6 Gotowość do etapu 1 | interfejs źródła Terminów w pakiecie, Kategoria jako dane, przykładowy Katalog | w toku | [stages/0.6-gotowosc-do-etapu-1.md](stages/0.6-gotowosc-do-etapu-1.md) |
| 1. Baza + Katalog | portal czyta Terminy z Postgresa przez `packages/catalog` | — | [stages/1-baza-i-katalog.md](stages/1-baza-i-katalog.md) |
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
