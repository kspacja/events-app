---
status: accepted
---

# Monorepo z kilkoma aplikacjami i wspólnymi pakietami domenowymi

System obsługuje trzy osobne rodzaje kont (Odbiorca, Organizator, Moderator), a każde ma inną powierzchnię ryzyka i inny UX, więc dzielimy go na osobno wdrażane aplikacje. Wszystkie trzymamy w jednym monorepo ze wspólnymi pakietami domenowymi, bo przy 1–2 osobach w zespole osobne repozytoria to głównie koszt utrzymania, a w monorepo TypeScript od razu wyłapuje zmianę, która psuje inną aplikację.

Aplikacje:

- `apps/portal` (Next.js) — dla Odbiorcy, publiczna, cache'owana
- `apps/studio` (Next.js) — dla Organizatora
- `apps/moderation` (Next.js) — dla Moderatora; dostęp tylko z zaproszenia, osobna, niepubliczna domena
- `apps/worker` (Node) — zadania w tle

Pakiety: `packages/catalog`, `packages/recommendations`, `packages/identity`, `packages/contract` (schematy zod i typy), `packages/time`, `packages/ui`; stan docelowy i kolejność ich powstawania opisuje `docs/plans/architecture-roadmap.md`.

## Considered Options

- **Jedna aplikacja Next.js z `/panel` i `/moderation`** — odrzucona: miesza rodzaje kont i poziomy ryzyka w jednym wdrożeniu. Na przykład błąd w publicznym portalu mógłby otworzyć drogę do moderacji.
- **Osobne repozytoria** — odrzucone: wymagałyby wersjonowania wspólnego kontraktu, trzech konfiguracji CI i ręcznej synchronizacji typów. Przy 1–2 osobach to za duży narzut.

## Consequences

- Wybrane narzędzie do workspace'ów: pnpm workspaces + Turborepo.
- Obecna aplikacja events-app została przeniesiona do `apps/portal`.
- Reguły czasu lokalnego i doby wydarzeń (Europe/Warsaw, granica 04:00) mieszkają w `packages/time`, a `packages/contract` trzyma kształty danych (schematy zod i typy) oraz, tymczasowo do Katalogu (etap 1), listę referencyjną kategorii.

Aktualizacja 2026-10-04: lista Kategorii nie jest już w `contract` — Kategoria przychodzi jako dane `{ slug, label }` we Wpisie programu.
