---
status: accepted
---

# Formularze w Studio i Moderacji na Mantine

Aplikacje wewnętrzne — `apps/studio` i `apps/moderation` — budują interfejs na Mantine: komponenty z `@mantine/core` (i pokrewnych, np. `@mantine/dates`), stan i walidacja formularzy przez `@mantine/form`. Walidacja korzysta ze schematów zod z `@events/contract` (przez resolver zod), więc formularz i API sprawdzają dane tą samą regułą. Każdy formularz w tych aplikacjach idzie tą drogą.

Portal zostaje przy własnych komponentach na CSS Modules i tokenach `@events/ui`.

Powód: Studio i Moderacja to głównie formularze i tabele dla kilku osób; gotowe pola (daty, godziny, wybór z listy, wiele wartości) oszczędzają najwięcej pracy przy 1–2 osobach. Jedna biblioteka na komponenty i stan formularza zamiast składania dwóch. Wspólne schematy zod usuwają podwójną walidację.

## Considered Options

- **react-hook-form + komponenty Mantine** — odrzucone: dwie biblioteki do spięcia, a `@mantine/form` robi to samo dla komponentów Mantine.
- **Własne komponenty na CSS Modules jak w portalu** — odrzucone: dużo pracy przy polach dat i list, a wygląd aplikacji wewnętrznych nie jest wyróżnikiem.

## Consequences

- Dwa systemy stylów w repozytorium: Mantine w aplikacjach wewnętrznych, CSS Modules w portalu. Kolory i krój Mantine dostają wartości z tokenów `@events/ui` przez motyw Mantine, żeby marka była jedna.
- Schematy wejścia formularzy żyją w `@events/contract` obok schematów odczytu.
- Mantine dochodzi jako zależność tylko aplikacji wewnętrznych; lint pilnuje, żeby portal i pakiety jej nie importowały.
