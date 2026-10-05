# Etap 1 — Backend i baza

**Cel:** `apps/api` (Hono + Drizzle) serwuje Terminy z Postgresa przez HTTP (ADR-0008), a portal czyta je tym samym adapterem HTTP, którego dziś używa z MSW.

## Decyzje (podjęte)

- Backend jako osobny serwis HTTP — ADR-0008.
- Drizzle ORM jako narzędzie do bazy — do zapisania jako ADR-0009 na starcie etapu.
- Lokalnie Postgres z pgvector w Docker Compose (obraz `pgvector/pgvector`); potrzebny tylko do pracy nad backendem — front działa na MSW.
- Osobny schemat Postgresa na kontekst (ADR-0002) w `apps/api`.
- Model Wydarzeń wg słownika (`docs/contexts/catalog/CONTEXT.md`): `Event`, `Occurrence`, `Venue` (należy do Organizatora), `Category` (lista zarządzana), `Price` (przy Terminie, opcjonalna), `Submission`.
- Pakiet `@events/catalog` zmienia nazwę na `@events/events`.
- `@events/contract` zostaje osobnym pakietem: schematy Wpisu programu i API (zod). Bez zestawu testów zgodności i bez formalnych „obietnic” portu.
- Portal czyta tylko przez HTTP; w dev i testach MSW `setupServer`. Źródło w pamięci i `OCCURRENCE_SOURCE` znikają.
- Mock MSW jest prosty: zwraca przykładowe dane dla zakresu, bez odtwarzania całej logiki backendu. Ryzyko rozjazdu mocka z backendem łapią testy integracyjne `apps/api` na prawdziwej bazie.
- Seed z przykładowych danych z etapu 0.6.

## Kroki (szkic)

0. Porządki: zmiana nazwy `@events/catalog` → `@events/events`; usunięcie źródła w pamięci, `OCCURRENCE_SOURCE` i `composition` z portalu; usunięcie zestawu testów zgodności i reguł lintu, które go dotyczą; uproszczenie handlera MSW.
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
- Nazwa kontekstu w słowniku: „Katalog” zostaje czy zmienia się na „Wydarzenia” (`events`), zgodnie z nazwą pakietu?

## Kryterium ukończenia

Portal na danych z Postgresa przez `apps/api` wygląda i działa jak na mocku (smoke + Chrome); nowa Kategoria dodana w bazie pojawia się bez zmian w kodzie; front nadal uruchamia się bez bazy, na MSW.
