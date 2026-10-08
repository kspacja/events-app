# Etap 1 — Backend i baza

**Cel:** `apps/api` (Hono + Drizzle) serwuje Terminy z Postgresa przez HTTP (ADR-0008), a portal czyta je tym samym adapterem HTTP, którego dziś używa z MSW.

## Decyzje (podjęte)

- Backend jako osobny serwis HTTP — ADR-0008.
- Drizzle ORM jako narzędzie do bazy — do zapisania jako ADR-0009 na starcie etapu.
- Lokalnie Postgres z pgvector w Docker Compose (obraz `pgvector/pgvector`); potrzebny tylko do pracy nad backendem — front działa na MSW.
- Osobny schemat Postgresa na kontekst (ADR-0002) w `apps/api`.
- Model Wydarzeń wg słownika (`docs/contexts/catalog/CONTEXT.md`): `Event`, `Occurrence`, `Venue` (należy do Organizatora), `Category` (lista zarządzana), `Price` (przy Terminie, opcjonalna), `Submission`.
- Pakiet `@events/catalog` zmienia nazwę na `@events/repo` (`packages/repo`).
- Kontekst w słowniku nazywa się „Wydarzenia” (`events`), nie „Katalog”: `docs/contexts/events/`. ADR-y zostają bez zmian jako zapis historyczny.
- `@events/contract` zostaje osobnym pakietem: schematy Wpisu programu i API (zod). Bez zestawu testów zgodności i bez formalnych „obietnic” portu.
- Portal czyta tylko przez HTTP; w dev i testach MSW `setupServer`. Źródło w pamięci i `OCCURRENCE_SOURCE` znikają.
- Mock MSW jest prosty: zwraca przykładowe dane dla zakresu, bez odtwarzania całej logiki backendu. Ryzyko rozjazdu mocka z backendem łapią testy integracyjne `apps/api` na prawdziwej bazie.
- Seed z przykładowych danych z etapu 0.6.

## Kroki (szkic)

0. Porządki — zakres:
   - `packages/catalog` → `packages/repo` (`@events/repo`); odwołania w portalu, `next.config.ts`, mapie zależności lintu i jej testach, README, lockfile.
   - Z `@events/repo` znikają źródło w pamięci, `listOccurrences` (Doba wydarzeń i sortowanie przechodzą w kroku 4 do SQL), `catalogFromListings` i `brokenCatalog`. Zostaje model (`createCatalog`, typy), `createSampleCatalog` dla seeda i MSW, `SAMPLE_OCCURRENCES_IN_FIRST_WEEK` w `/testing` oraz `toListings` — samo złączenie Katalogu w Wpisy programu, bez filtra i sortowania, dla MSW.
   - Z `@events/contract` znika zestaw testów zgodności (`./source/testing`) i opis „obietnic”; `OccurrenceSource`, `OccurrenceSourceError` i `compareListings` zostają.
   - Portal: bez `composition/`, `OCCURRENCE_SOURCE` i wariantu `memory`; strona tworzy źródło HTTP z `EVENTS_API_URL`. Handler MSW zwraca przykładowe Terminy z Dób wydarzeń w zakresie, bez sortowania. Test adaptera HTTP sprawdza sam adapter.
   - Lint: reguła wejść testowych bez `@events/contract/source/testing`.
   - Słownik: kontekst „Katalog” → „Wydarzenia” (`docs/contexts/events/`, `CONTEXT-MAP.md`).
1. ADR-0009 Drizzle; `docker-compose.yml` z Postgresem i pgvector; szkielet `apps/api` (Hono) z walidowaną konfiguracją (`DATABASE_URL`) i wpisem w `turbo.json`.
2. Schemat Drizzle Wydarzeń + migracje.
3. Seed z przykładowych danych.
4. `GET /occurrences` w `apps/api` zgodny ze schematem z `@events/contract` (Doba wydarzeń 04:00, sortowanie) + testy integracyjne na prawdziwej bazie.
5. Portal w dev z `EVENTS_API_URL` na lokalne `apps/api` i bez `API_MOCKING`; Kategorie z bazy.

## Otwarte pytania

- Testy integracyjne `apps/api`: Testcontainers czy baza z Docker Compose?
- `Venue.organizerId` przed etapem 2 (Organizator jeszcze nie istnieje): kolumna dopuszczająca `null` czy Organizator techniczny dla danych przykładowych?
- Kolory nowych Kategorii: tylko `--category-fallback`, czy kolor jako dana Kategorii?
- Seed z `createSampleCatalog(now)` liczy daty względem dnia uruchomienia, więc po zapisie w bazie się starzeje: stała data, cykliczne ponowne seedowanie czy generowanie Terminów przy starcie dev?

## Kryterium ukończenia

Portal na danych z Postgresa przez `apps/api` wygląda i działa jak na mocku; nowa Kategoria dodana w bazie pojawia się bez zmian w kodzie; front nadal uruchamia się bez bazy, na MSW.
