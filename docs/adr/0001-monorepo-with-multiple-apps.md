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

Pakiety: `packages/catalog`, `packages/recommendations`, `packages/identity`, `packages/contract` (schematy zod i typy), `packages/ui`.

## Considered Options

- **Jedna aplikacja Next.js z `/panel` i `/moderation`** — odrzucona: miesza rodzaje kont i poziomy ryzyka w jednym wdrożeniu. Na przykład błąd w publicznym portalu mógłby otworzyć drogę do moderacji.
- **Osobne repozytoria** — odrzucone: wymagałyby wersjonowania wspólnego kontraktu, trzech konfiguracji CI i ręcznej synchronizacji typów. Przy 1–2 osobach to za duży narzut.

## Consequences

- Wybrane narzędzie do workspace'ów: pnpm workspaces + Turborepo.
- Obecna aplikacja events-app została przeniesiona do `apps/portal`.
- `packages/contract` zawiera na razie także reguły czasu lokalnego i doby wydarzeń (wspólny kernel). To stan tymczasowy: osobny krok wydzieli je z kontraktu.
