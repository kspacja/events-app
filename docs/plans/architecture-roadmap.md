# Plan wdrożenia architektury

Realizacja ADR-0001…0008 etapami. Pojęcia: `CONTEXT-MAP.md`. Decyzje: `docs/adr/`.

**Bramki** = `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` uruchomione z katalogu głównego.

## Proces kroku

Etap dzieli się na kroki. Każdy krok przechodzi te punkty po kolei:

1. **Zakres** — zakres i decyzje kroku są zapisane w pliku etapu (`stages/`). Ustalenia z rozmowy trafiają tam przed implementacją.
2. **Implementacja** — commit(y) bez pusha; bramki zielone, smoke test portalu (`API_MOCKING=enabled`, świeży serwer — stary zatrzymany po porcie) przechodzi. Zmiana schematu bazy aktualizuje diagram w `docs/database.md`.

Koniec etapu: **code review w dwóch osiach** całego etapu (Standards + Spec, równolegle, punkt odniesienia = commit sprzed etapu; Spec = plik etapu + ADR-y) — każda uwaga poprawiona albo wpisana do „Odłożone” z powodem; potem status w tabeli zaktualizowany. Po krokach nie robimy code review (od 2026-10-09, koszt tokenów). Przegląd architektury robimy raz, na samym końcu, po ostatnim etapie: użytkownik uruchamia `/mattpocock-skills:improve-codebase-architecture` (model nie może go wywołać), a plan jest zamknięty, gdy każdy kandydat jest wdrożony, odłożony albo odrzucony. Po etapach — także tych z pełnym numerem — nie robimy żadnego przeglądu architektury, nawet wąskiego.

## Etapy

| Etap | Cel | Status | Szczegóły |
| --- | --- | --- | --- |
| 0. Monorepo | pnpm + Turborepo, `apps/portal`, pakiety współdzielone | zrobione | historia gita |
| 0.5 Porządki | czas lokalny, seam odczytu Terminów, wybór Terminu na mapie | zrobione | historia gita |
| 0.6 Gotowość do etapu 1 | interfejs źródła Terminów w pakiecie, Kategoria jako dane, przykładowy Katalog | zrobione | [stages/0.6-gotowosc-do-etapu-1.md](stages/0.6-gotowosc-do-etapu-1.md) |
| 1. Backend + baza | `apps/api` (Hono + Drizzle) serwuje Terminy z Postgresa, portal czyta przez HTTP (ADR-0008) | zrobione | [stages/1-baza-i-katalog.md](stages/1-baza-i-katalog.md) |
| 1.5 Obserwowalność | ślady, metryki, logi i błędy z aplikacji i workera | — | [stages/1.5-obserwowalnosc.md](stages/1.5-obserwowalnosc.md) |
| 2. Tożsamość | konta `Attendee`, `Organizer`, `Moderator`, `Guest` (ADR-0004, 0005) | — | — |
| 3. Studio | `apps/studio`: Organizator dodaje Wydarzenia, Terminy, Miejsca, Zgłoszenia; ustawia też Oznaczenie szkolne (`forSchools`, etap 3.5) | — | — |
| 3.5 Strona dla szkół | podstrona portalu: Kalendarz miesiąca zamiast Zapytania, afisz wybranego tygodnia, tylko Wydarzenia z Oznaczeniem szkolnym | zrobione (na MSW i przykładowych danych; Oznaczenie szkolne ustawi Studio w etapie 3) | [stages/3.5-strona-dla-szkol.md](stages/3.5-strona-dla-szkol.md) |
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
- Filtr Doby wydarzeń (z `forSchools`) jest w kilku miejscach: handler MSW, test zgodności w `occurrences.integration.test.ts`, pomocnicza funkcja `sampleEvents.test.ts` — po jednej linii, a backend liczy go w SQL.
- Brak wspólnego generatora Wpisów programu do testów — nowe wymagane pole kontraktu zmienia kilkanaście obiektów testowych; robimy przy następnym takim polu.
- Zmiana kontraktu z nowym wymaganym polem: wdrażamy najpierw API, potem portal (etap 7).
- Reguła produkcyjna portalu patrzy tylko na `VERCEL_ENV`: samodzielny `next start` z `API_MOCKING=enabled` uruchomiłby mock (także worker w przeglądarce) — etap 7.
- `CORS_ORIGIN` to jeden origin (nie obsłuży adresów podglądu Vercela), a brak w produkcji oznacza `localhost` — etap 7.
- Brak testu `EventsMap`: lot do Terminu bez punktu jest potwierdzany tylko w kodzie adaptera, sprawdzony w Chrome — wymaga osobnego zestawu testów mapy.
- Lista aplikacji niedostępnych dla pakietów w lincie jest wpisana ręcznie obok `DEPENDENCY_MAP` — przy nowej aplikacji trzeba dopisać ją w dwóch miejscach.
- `apps/api/src/config.ts` składa komunikaty inline zamiast nazwanej `problemsOf` jak w portalu — kosmetyka.
- Postgres z `docker-compose.yml` nasłuchuje na wszystkich interfejsach (`5432:5432`), nie tylko `127.0.0.1` — lokalne hasło deweloperskie.
- Wspólny kod konfiguracji (klasa błędu, `blankAsUnset`, komunikaty bez wartości) jest w portalu i w API — wydzielamy przy trzeciej aplikacji.
- `console.*` w API (start, seed, błędy `/occurrences`) i w przeglądarce (start workera MSW) i brak identyfikatora korelacji w odpowiedzi 500 — dochodzą z loggerem w etapie 1.5.
- Baza nie pilnuje formatu danych: format id i sluga, niepusta etykieta, niepuste `name` i `city` Miejsca (także w kontrakcie i modelu), powtórzone Kategorie w kontrakcie, `NaN` we współrzędnych i cenach, ceny z więcej niż 2 miejscami po przecinku (`numeric(10,2)` je zaokrągla) — dziś dane wchodzą tylko przez seed ze sprawdzonego modelu; wracamy, gdy Studio zacznie zapisywać (etap 3).
- Tabele bez `created_at` / `updated_at` — dochodzą z pierwszymi zapisami w Studio (etap 3).
- Strona `/dla-szkol` nie ma linku ze strony głównej — do projektu UI.
- Cechy szkolne Wydarzenia (wiek, klasy) i filtry strony dla szkół — po researchu (etap 3.5, „Otwarte”).
- Obwódka fokusu dni na skrajnych kolumnach Kalendarza miesiąca może być przycięta — sprawdzamy w Chrome na końcu planu.
- Publiczne API Organizatorów — zastąpione Kanałem; wracamy, gdy pojawi się potrzeba zapisu z zewnątrz.

## Testowanie

MCP Chroma użyj tylko na samym końcu - po realizowaniu całego planu.
