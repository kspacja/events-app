---
status: accepted
---

# Reakcje Gościa bez konta

Odbiorca może przeglądać portal i dawać Reakcje bez zakładania konta, jako Gość rozpoznawany po identyfikatorze urządzenia (cookie). Reakcje Gościa zapisujemy na serwerze, więc rekomendacje działają dla niego od razu, bez bariery przed Zimnym startem.

- Gdy Gość założy konto albo się zaloguje, jego Reakcje przechodzą na konto. Przy konflikcie, np. Polubienie na telefonie i Odrzucenie na laptopie dla tego samego Wydarzenia, wygrywa NOWSZA Reakcja, według znacznika czasu.
- Reakcje Gościa, który nigdy nie założy konta, usuwamy po 90 dniach od jego ostatniej wizyty. To minimalizacja danych (RODO), a przy okazji baza nie puchnie.

## Considered Options

- **Reakcje tylko z kontem** — odrzucone: wymaganie konta to bariera jeszcze przed Zimnym startem.
- **Reakcje Gościa tylko w localStorage** — odrzucone: Gość nie dostałby rekomendacji, a na innym urządzeniu Reakcje by przepadły.

## Consequences

- Potrzebna jest logika przenoszenia Reakcji na konto (z rozstrzyganiem konfliktów) oraz zadanie czyszczące stare Reakcje Gości, uruchamiane przez `apps/worker`.
