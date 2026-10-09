# Plan wdrożenia architektury

Realizacja ADR-0001…0008 etapami. Pojęcia: `CONTEXT-MAP.md`. Decyzje: `docs/adr/`.

**Bramki** = `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` uruchomione z katalogu głównego.

## Proces kroku

Etap dzieli się na kroki. Każdy krok przechodzi te punkty po kolei:

1. **Zakres** — zakres i decyzje kroku są zapisane w pliku etapu (`stages/`). Ustalenia z rozmowy trafiają tam przed implementacją.
2. **Implementacja** — commit(y) bez pusha; bramki zielone, smoke test portalu (`API_MOCKING=enabled`) przechodzi.
3. **Code review w dwóch osiach** (Standards + Spec, równolegle, punkt odniesienia = commit sprzed kroku; Spec = plik etapu + ADR-y) — każda uwaga poprawiona albo wpisana do „Odłożone” z powodem.

Koniec etapu: status w tabeli zaktualizowany; etap zamyka code review kroków. Przegląd architektury robimy raz, na samym końcu, po ostatnim etapie: użytkownik uruchamia `/mattpocock-skills:improve-codebase-architecture` (model nie może go wywołać), a plan jest zamknięty, gdy każdy kandydat jest wdrożony, odłożony albo odrzucony. Po etapach — także tych z pełnym numerem — nie robimy żadnego przeglądu architektury, nawet wąskiego.

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
| 3.5 Strona dla szkół | podstrona portalu: Kalendarz miesiąca zamiast Zapytania, afisz wybranego tygodnia, tylko Wydarzenia z Oznaczeniem szkolnym | — | [stages/3.5-strona-dla-szkol.md](stages/3.5-strona-dla-szkol.md) |
| 4. Moderacja | `apps/moderation`: kolejka Zgłoszeń i decyzje | — | — |
| 5. Rekomendacje | `packages/recommendations`, `apps/worker`, Reakcje, `ColdStart` (ADR-0003, 0007) | — | — |
| 6. Import i Kanały | import CSV, Kanał JSON Zaufanego Organizatora (cyklicznie i na webhook) | — | [stages/6-import-i-kanaly.md](stages/6-import-i-kanaly.md) |
| 7. Wdrożenie | Vercel, Neon, Railway/Fly, CI (ADR-0006) | — | — |

Plik etapu powstaje, gdy etap rusza: cel, kroki, decyzje, otwarte pytania, kryterium ukończenia.

## Odłożone

Świadomie odłożone ustalenia z przeglądów. Wracamy do nich, gdy zmienia się dany obszar.

- Przewijanie do mapy po wyborze Terminu z karty działa też na desktopie — rdzeń wyboru nie wie, czy mapa jest rozwinięta.
- Zapasowe kolory mapy w `EventsMap` dublują tokeny — siatka bezpieczeństwa.
- Liniowe `points.find` przy kliknięciu w mapę — wystarcza przy tej skali.
- `isCalendarDay` mapuje lata 0–99 przez `Date.UTC` — bez znaczenia dla domeny.
- Lint nie blokuje względnych importów korzenia sąsiedniego pakietu (`../time` bez `/src`) — importy idą przez `@events/*`.
- Filtr Doby wydarzeń jest dwa razy: w handlerze MSW i w pomocniczej funkcji `sampleCatalog.test.ts` — jedna linia, a backend liczy go w SQL.
- Nazwy w `@events/repo` (`Catalog`, `createCatalog`, `CatalogIntegrityError`, `createSampleCatalog`) nie pasują do nazwy pakietu ani kontekstu „Wydarzenia” — zmieniamy razem ze schematem Drizzle w kroku 2 etapu 1, żeby nie zmieniać nazw dwa razy.
- Brak testu `EventsMap`: lot do Terminu bez punktu jest potwierdzany tylko w kodzie adaptera, sprawdzony w Chrome — wymaga osobnego zestawu testów mapy.
- Lista aplikacji niedostępnych dla pakietów w lincie jest wpisana ręcznie obok `DEPENDENCY_MAP` — przy nowej aplikacji trzeba dopisać ją w dwóch miejscach.
- `apps/api/src/config.ts` składa komunikaty inline zamiast nazwanej `problemsOf` jak w portalu — kosmetyka.
- Postgres z `docker-compose.yml` nasłuchuje na wszystkich interfejsach (`5432:5432`), nie tylko `127.0.0.1` — lokalne hasło deweloperskie.
- Wspólny kod konfiguracji (klasa błędu, `blankAsUnset`, komunikaty bez wartości) jest w portalu i w API — wydzielamy przy trzeciej aplikacji.
- `console.info` przy starcie API — zastąpi go logger w etapie 1.5.
- Lint nie blokuje sterowników bazy w aplikacjach Next.js (ADR-0008) — dodajemy razem z pierwszym sterownikiem w kroku 2 etapu 1.
- Publiczne API Organizatorów — zastąpione Kanałem; wracamy, gdy pojawi się potrzeba zapisu z zewnątrz.

## Testowanie

MCP Chroma użyj tylko na samym końcu - po realizowaniu całego planu.
