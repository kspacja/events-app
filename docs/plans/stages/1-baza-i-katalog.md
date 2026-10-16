# Etap 1 — Backend i baza

**Cel:** `apps/api` (Hono + Drizzle) serwuje Terminy z Postgresa przez HTTP (ADR-0008), a portal czyta je tym samym adapterem HTTP, którego dziś używa z MSW.

## Decyzje (podjęte)

- Backend jako osobny serwis HTTP — ADR-0008.
- Drizzle ORM jako narzędzie do bazy — do zapisania jako ADR-0009 na starcie etapu.
- Lokalnie Postgres z pgvector w Docker Compose (obraz `pgvector/pgvector`); potrzebny tylko do pracy nad backendem — front działa na MSW.
- Osobny schemat Postgresa na kontekst (ADR-0002) w `apps/api`.
- Model Wydarzeń wg słownika (`docs/contexts/events/CONTEXT.md`): `Event`, `Occurrence`, `Venue` (należy do Organizatora), `Category` (lista zarządzana), `Price` (przy Terminie, opcjonalna), `Submission`.
- Pakiet `@events/catalog` zmienia nazwę na `@events/repo` (`packages/repo`).
- Kontekst w słowniku nazywa się „Wydarzenia” (`events`), nie „Katalog”: `docs/contexts/events/`. ADR-y zostają bez zmian jako zapis historyczny.
- `@events/contract` zostaje osobnym pakietem: schematy Wpisu programu i API (zod). Bez zestawu testów zgodności i bez formalnych „obietnic” portu.
- Portal czyta tylko przez HTTP; w dev i testach MSW `setupServer`. Źródło w pamięci i `OCCURRENCE_SOURCE` znikają.
- Mock MSW jest prosty: zwraca przykładowe dane dla zakresu, bez odtwarzania całej logiki backendu. Ryzyko rozjazdu mocka z backendem łapią testy integracyjne `apps/api` na prawdziwej bazie.
- `GET /occurrences` pomija i loguje Termin, który łamie kontrakt (np. Wydarzenie bez Kategorii), zamiast odpowiadać 500 na cały zakres.
- Testy integracyjne `apps/api` na osobnej bazie `events_test` w kontenerze z Docker Compose, poza zwykłym `pnpm test` (bez Testcontainers).
- Seed z przykładowych danych z etapu 0.6, liczonych od dnia uruchomienia; gdy się zestarzeją, `db:seed` uruchamiamy ręcznie ponownie (bez seedowania przy starcie dev — od etapu 3 kasowałoby dane Studio).
- `Venue.organizerId` dochodzi dopiero w etapie 2, razem z tabelą Organizatorów (najpierw `null`, potem uzupełnienie i `NOT NULL`); bez Organizatora technicznego.
- Kategoria nie ma koloru w bazie: nowa Kategoria dostaje `--category-fallback`, własny kolor przez token CSS w `@events/ui`. *Zastąpione (design system): kolorów Kategorii już nie ma, karta pokazuje zdjęcie Wydarzenia, a bez zdjęcia — `--color-bg-subtle`.*

## Kroki (szkic)

0. Porządki — zakres:
   - `packages/catalog` → `packages/repo` (`@events/repo`); odwołania w portalu, `next.config.ts`, mapie zależności lintu i jej testach, README, lockfile.
   - Z `@events/repo` znikają źródło w pamięci, `listOccurrences` (Doba wydarzeń i sortowanie przechodzą w kroku 4 do SQL), `catalogFromListings` i `brokenCatalog`. Zostaje model (`createCatalog`, typy), `createSampleCatalog` dla seeda i MSW, `SAMPLE_OCCURRENCES_IN_FIRST_WEEK` w `/testing` oraz `toListings` — samo złączenie Katalogu w Wpisy programu, bez filtra i sortowania, dla MSW.
   - Z `@events/contract` znika zestaw testów zgodności (`./source/testing`) i opis „obietnic”; `OccurrenceSource`, `OccurrenceSourceError` i `compareListings` zostają.
   - Portal: bez `composition/`, `OCCURRENCE_SOURCE` i wariantu `memory`; strona tworzy źródło HTTP z `EVENTS_API_URL`. Handler MSW zwraca przykładowe Terminy z Dób wydarzeń w zakresie, bez sortowania. Test adaptera HTTP sprawdza sam adapter.
   - Lint: reguła wejść testowych bez `@events/contract/source/testing`.
   - Słownik: kontekst „Katalog” → „Wydarzenia” (`docs/contexts/events/`, `CONTEXT-MAP.md`).
1. Szkielet backendu — zakres:
   - ADR-0009 Drizzle ORM (opcje: Drizzle, Kysely, Prisma).
   - `docker-compose.yml` w korzeniu: usługa `db` na `pgvector/pgvector:0.8.7-pg17`, port 5432, wolumen, healthcheck.
   - `apps/api` (`@events/api`): Hono na `@hono/node-server`, dev przez `tsx watch`; konfiguracja walidowana zod przy starcie (`DATABASE_URL` wymagany, tylko kształt adresu; `PORT` z domyślną wartością; komunikaty bez wartości zmiennych); `GET /health`; testy konfiguracji i `/health` przez `app.request`; `.env.example`.
   - `turbo.json` z `DATABASE_URL` w `env`; lint: `api` jako aplikacja w `DEPENDENCY_MAP` i na liście aplikacji niedostępnych dla pakietów; README.
   - Poza zakresem: Drizzle, schemat, połączenie z bazą (krok 2). Wybór sposobu testów integracyjnych odłożony.
2. Schemat Drizzle Wydarzeń + migracje — zakres (kolumny `venues` i `events.category_slug` zmienił krok 2a):
   - `apps/api`: `drizzle-orm`, `pg`, `drizzle-kit`; schemat w `src/contexts/events/schema.ts` w schemacie Postgresa `events`: `categories` (`slug`, `label`), `venues` (`id`, `name`, `city`, `lat`, `lng`), `events` (`id`, `title`, `category_slug`, `image_url`), `occurrences` (`id`, `event_id`, `venue_id`, `starts_at timestamptz`, cena w kolumnach `price_kind`/`price_from`/`price_to`/`price_currency` z CHECK); indeks na `starts_at`.
   - `src/db.ts` z `createDb(databaseUrl)`, `drizzle.config.ts`, migracje SQL w `apps/api/drizzle/`, skrypty `db:generate` i `db:migrate`.
   - `@events/repo`: `Catalog` → `EventsData`, `CatalogData` → `EventsDataInput`, `createCatalog` → `createEventsData`, `CatalogIntegrityError` → `EventsIntegrityError`, `createSampleCatalog` → `createSampleEvents`, `sampleCatalog.ts` → `sampleEvents.ts`.
   - Lint: sterowniki bazy i ORM zablokowane w aplikacjach Next.js (ADR-0008).
   - Weryfikacja: bramki + migracja na bazie z Docker Compose, tabele sprawdzone w `psql`.
   - Poza zakresem: `Submission` (etap 3), migracja `CREATE EXTENSION vector` (z pierwszą kolumną `vector`, etap 5), Organizator (etap 2).
2a. Adres Miejsca i wiele Kategorii — zakres:
   - `venues.address text NOT NULL` (ulica i numer, `city` osobno); `Venue.address` w `@events/repo`, `venue.address` we Wpisie programu; adresy w przykładowych danych. Portal na razie go nie pokazuje.
   - Wydarzenie ma jedną lub więcej Kategorii, pierwsza jest główna: tabela `event_categories` (`event_id`, `category_slug`, `position`; PK `(event_id, category_slug)`, UNIQUE `(event_id, position)`, indeks na `category_slug`; Wydarzenie `CASCADE`, Kategoria `RESTRICT` / `ON UPDATE CASCADE`) zamiast `events.category_slug`; `categories` jako niepusta lista w modelu i kontrakcie; karta bierze kolor i etykietę z Kategorii głównej; słownik zaktualizowany.
   - Migracja `0000` wygenerowana od nowa (niewdrożona), diagram w `docs/database.md`.
3. Seed z przykładowych danych — zakres:
   - `db:seed` w `apps/api`: `createSampleEvents(new Date())`, w jednej transakcji czyści tabele schematu `events` i wstawia dane od nowa (można powtarzać); odmawia, gdy `DATABASE_URL` nie wskazuje na `localhost` / `127.0.0.1` / `::1` (host czytany jak w sterowniku `pg`, z `?host=`; `hostaddr` odrzucany).
   - Czysta funkcja `EventsData` → wiersze tabel (cena w czterech kolumnach, Kategorie jako `event_categories` z `position`) z testami jednostkowymi; README.
   - Weryfikacja: bramki + seed na bazie z Docker Compose, liczby wierszy w `psql`.
4. `GET /occurrences` w `apps/api` zgodny ze schematem z `@events/contract` (Doba wydarzeń 04:00, sortowanie; Kategorie Wydarzenia w kolejności `position`, bez szukania `position = 0`) + testy integracyjne na prawdziwej bazie.
   Zakres:
   - Trasa: `from`/`to` walidowane `occurrencesQuerySchema` (te same komunikaty 400 co MSW), odpowiedź w kształcie `occurrencesResponseSchema`, błąd bazy = 500 bez szczegółów.
   - Odczyt w `contexts/events/occurrences.ts`: Termin w zakresie, gdy `starts_at` ∈ [`from` 04:00, `to`+1 04:00) Europe/Warsaw (granice z `@events/time`, indeks na `starts_at`); sortowanie `starts_at`, potem id; Kategorie wg `position`. Zamiana wierszy na Wpis programu (cena z 4 kolumn, `image_url` null = brak pola, `starts_at` przez `toWarsawIso`).
   - Testy jednostkowe: zamiana wierszy, trasa przez `app.request` z podstawionym źródłem.
   - Testy integracyjne: osobna baza `events_test` w kontenerze z Docker Compose (tworzona i migrowana przed testami, tylko `localhost`), pliki `*.integration.test.ts`, `pnpm --filter @events/api test:integration`; poza zwykłym `pnpm test`, więc bramki nie wymagają Dockera.
5. Portal w dev z `EVENTS_API_URL` na lokalne `apps/api` i bez `API_MOCKING`; Kategorie z bazy.
   Zakres:
   - Przepis „portal na lokalnym API” w `apps/portal/.env.example` i README (`EVENTS_API_URL=http://localhost:3001`, bez `API_MOCKING`); domyślnie zostaje MSW (ADR-0008).
   - Kategorie przychodzą z Wpisów programu; nieznana Kategoria dostaje `--category-fallback` — bez nowego kodu, tylko weryfikacja.
   - Weryfikacja kryterium ukończenia: portal na API po seedzie = portal na MSW (22 karty, te same etykiety); nowa Kategoria dodana w `psql` jako główna widać na karcie z kolorem zastępczym; portal bez bazy działa na MSW.

## Otwarte pytania

- brak

## Kryterium ukończenia

Portal na danych z Postgresa przez `apps/api` wygląda i działa jak na mocku; nowa Kategoria dodana w bazie pojawia się bez zmian w kodzie; front nadal uruchamia się bez bazy, na MSW.
