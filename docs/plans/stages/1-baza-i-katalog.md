# Etap 1 — Baza i Katalog

**Cel:** portal czyta Terminy z Postgresa przez `packages/catalog`, za tym samym interfejsem `OccurrenceSource`, który dziś obsługuje HTTP+MSW.

## Decyzje (podjęte)

- Drizzle ORM jako narzędzie do bazy — do zapisania jako ADR-0008 na starcie etapu.
- Lokalnie Postgres z pgvector w Docker Compose (obraz `pgvector/pgvector`).
- Osobny schemat Postgresa na kontekst (ADR-0002); Katalog ma własny schemat i jest jedynym, który go czyta.
- Model Katalogu wg słownika (`docs/contexts/catalog/CONTEXT.md`): `Event`, `Occurrence`, `Venue` (należy do Organizatora), `Category` (lista zarządzana), `Price` (przy Terminie, opcjonalna), `Submission`.
- Seed z przykładowego Katalogu z etapu 0.6 (krok B).
- Adapter Katalogu przechodzi zestaw testów zgodności `@events/contract/source/testing`; MSW zostaje w testach adaptera HTTP.

## Kroki (szkic)

1. ADR-0008 Drizzle; `docker-compose.yml` z Postgresem i pgvector; `DATABASE_URL` w konfiguracji (walidacja z etapu 0.6, krok C) i w `turbo.json`.
2. Schemat Drizzle Katalogu + migracje.
3. Seed z przykładowego Katalogu.
4. Adapter Katalogu za `OccurrenceSource` + testy zgodności na prawdziwej bazie.
5. Portal wybiera adapter Katalogu w dev/produkcji; Kategorie z bazy.

## Otwarte pytania

- Testy integracyjne: Testcontainers czy baza z Docker Compose?
- `Venue.organizerId` przed etapem 2 (Organizator jeszcze nie istnieje): kolumna dopuszczająca `null` czy Organizator techniczny dla danych przykładowych?
- Kolory nowych Kategorii: tylko `--category-fallback`, czy kolor jako dana Kategorii?

## Kryterium ukończenia

Portal na danych z Postgresa wygląda i działa jak na mocku (smoke + Chrome); adapter Katalogu przechodzi testy zgodności; nowa Kategoria dodana w bazie pojawia się bez zmian w kodzie.
