---
status: accepted
---

# Drizzle ORM jako dostęp do bazy w backendzie

`apps/api` rozmawia z Postgresem przez Drizzle ORM: schemat tabel w TypeScripcie (osobny schemat Postgresa na kontekst, ADR-0002), zapytania budowane w kodzie, migracje generowane przez `drizzle-kit` z różnicy schematu i zapisywane jako pliki SQL w repozytorium.

Powód: schemat i typy w jednym miejscu, bez kroku generowania klienta; zapytania blisko SQL, więc Doba wydarzeń (granica 04:00) i sortowanie dają się wyrazić wprost; działa z `pg` lokalnie i ze sterownikiem Neona (ADR-0006); obsługuje schematy Postgresa i typ `vector` z pgvector (Rekomendacje, ADR-0003).

## Considered Options

- **Kysely** — odrzucony: bardzo dobry builder zapytań, ale typy bazy trzeba generować albo pisać osobno, a migracje to ręczny kod; więcej pracy przy 1–2 osobach.
- **Prisma** — odrzucona: własny język schematu i generowany klient, słabsze wsparcie dla wielu schematów Postgresa i pgvector, cięższy runtime.
- **Surowy SQL (`pg`)** — odrzucony: najmniej abstrakcji, ale bez typów wyników i bez narzędzia do migracji.

## Consequences

- Migracje z `drizzle-kit generate` trzeba przeglądać przed commitem; zmiany niszczące (DROP, RENAME, NOT NULL) idą etapami (expand → migrate → contract).
- Złożone zapytania (np. ranking Rekomendacji) mogą wymagać wstawek `sql` — wtedy typy wyniku trzeba podać ręcznie.
- Schemat Drizzle żyje w backendzie; pakiety kontekstów nie wystawiają tabel na zewnątrz (lint: schemat jest prywatny).
