# Schemat bazy danych

Postgres, jeden schemat na kontekst (ADR-0002). Tabele definiuje Drizzle w `apps/api/src/contexts/<kontekst>/schema.ts` (ADR-0009), migracje są w `apps/api/drizzle/`. Diagram aktualizujemy w każdym kroku, który zmienia schemat.

## Schemat `events` (kontekst Wydarzenia)

```mermaid
erDiagram
    categories ||--o{ event_categories : "Kategoria"
    events ||--|{ event_categories : "Kategorie Wydarzenia"
    events ||--o{ occurrences : "Terminy Wydarzenia"
    venues ||--o{ occurrences : "Miejsce Terminu"

    categories {
        text slug PK "Kategoria; zmiana sluga przechodzi do event_categories"
        text label "nazwa wyświetlana"
    }
    venues {
        text id PK "Miejsce"
        text name
        text address "ulica i numer"
        text city
        double lat
        double lng
    }
    events {
        text id PK "Wydarzenie"
        text title
        text image_url "opcjonalne"
        boolean for_schools "Oznaczenie szkolne, domyślnie false"
    }
    event_categories {
        text event_id PK, FK "ON DELETE CASCADE"
        text category_slug PK, FK "ON DELETE RESTRICT, ON UPDATE CASCADE"
        smallint position ">= 0, UNIQUE z event_id; najniższa = Kategoria główna"
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
- Kategorie: Wydarzenie ma jedną lub więcej Kategorii w `event_categories`, najniższa `position` to Kategoria główna (pozycje nie muszą zaczynać się od 0 ani iść bez dziur, odczyt sortuje po `position`). Baza nie wymusza „co najmniej jednej” — pilnuje tego model (`createEventsData`) i zapis Wydarzenia.
- Indeksy: `occurrences.starts_at` oraz każdy klucz obcy (`event_categories.event_id` pokrywa klucz główny).
- Oznaczenie szkolne: `events.for_schools = true` wyklucza Wydarzenie z programu ogólnego; `GET /occurrences?forSchools=true` zwraca tylko takie.
- Daty: `starts_at` to `timestamptz`; API zwraca je jako czas Europe/Warsaw (`toWarsawIso`).
