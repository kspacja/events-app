# Schemat bazy danych

Postgres, jeden schemat na kontekst (ADR-0002). Tabele definiuje Drizzle w `apps/api/src/contexts/<kontekst>/schema.ts` (ADR-0009), migracje są w `apps/api/drizzle/`. Diagram aktualizujemy w każdym kroku, który zmienia schemat.

## Schemat `events` (kontekst Wydarzenia)

```mermaid
erDiagram
    categories ||--o{ events : "Kategoria Wydarzenia"
    events ||--o{ occurrences : "Terminy Wydarzenia"
    venues ||--o{ occurrences : "Miejsce Terminu"

    categories {
        text slug PK "Kategoria; zmiana sluga przechodzi do events"
        text label "nazwa wyświetlana"
    }
    venues {
        text id PK "Miejsce"
        text name
        text city
        double lat
        double lng
    }
    events {
        text id PK "Wydarzenie"
        text title
        text category_slug FK "ON DELETE RESTRICT, ON UPDATE CASCADE"
        text image_url "opcjonalne"
    }
    occurrences {
        text id PK "Termin"
        text event_id FK "ON DELETE CASCADE"
        text venue_id FK "ON DELETE RESTRICT"
        timestamptz starts_at "indeks"
        price_kind price_kind "free | paid | brak = nie podano"
        numeric price_from "numeric(10,2), tylko paid"
        numeric price_to "numeric(10,2), opcjonalne, >= price_from"
        text price_currency "PLN, tylko paid"
    }
```

- Cena: CHECK `occurrences_price_valid` dopuszcza trzy stany — brak ceny (wszystkie kolumny ceny puste), `free` (kwoty i waluta puste), `paid` (`price_from >= 0`, waluta `PLN`, `price_to` puste albo `>= price_from`). Ta sama reguła jest w `priceSchema` w `@events/contract`.
- Indeksy: `occurrences.starts_at` oraz każdy klucz obcy.
- Daty: `starts_at` to `timestamptz`; API zwraca je jako czas Europe/Warsaw (`toWarsawIso`).
