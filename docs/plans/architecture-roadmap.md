# Plan wdrożenia architektury

Realizacja ADR-0001…0007 etapami. Każdy etap kończy się działającą aplikacją i zielonymi bramkami (`pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`).

## Proces (obowiązuje każdy krok)

1. Krok = jeden logiczny commit (albo kilka, jeśli trzeba), bez pusha.
2. **Po każdym kroku: code review w dwóch osiach** (`/code-review` — Standards + Spec, równolegle), punkt odniesienia = commit sprzed kroku. Spec = ten plan, ADR-y i ustalenia z rozmowy.
3. Ustalenia z review poprawiamy przed rozpoczęciem następnego kroku (albo świadomie odkładamy z uzasadnieniem).
4. **Po każdym etapie: przegląd architektury** (`/improve-codebase-architecture`) — kandydaci do pogłębienia modułów przed kolejnym etapem.
5. Zmiany widoczne dla użytkownika sprawdzamy w przeglądarce.

## Etapy

| Etap | Zakres | Status |
| --- | --- | --- |
| 0. Monorepo | pnpm + Turborepo, `apps/portal`, `packages/contract`, `packages/ui`, `packages/typescript-config` | zrobione |
| 0.5 Porządki po przeglądzie | poprawki z code review; rozdzielenie `contract`/`time` i jedno źródło Kategorii (zrobione), seam odczytu Terminów, cel przewinięcia z Programu, moduł wyboru Wydarzenia na mapie | w toku |
| 1. Baza + Katalog | Postgres + pgvector (Docker lokalnie), Drizzle (ADR), schematy per kontekst, `packages/catalog` (`Event`, `Occurrence`, `Venue`, `Category`, `Price`, `Submission`), seed z mocka, portal czyta z bazy | — |
| 2. Tożsamość | Better Auth: `Attendee` (magic link), `Organizer`, `Moderator` (zaproszenia), `Guest` | — |
| 3. Studio | `apps/studio`: Wydarzenia, Terminy, Miejsca, zdjęcia (R2), Zgłoszenia, Zmiany drobne/istotne | — |
| 4. Moderacja | `apps/moderation`: kolejka Zgłoszeń, decyzje | — |
| 5. Rekomendacje | `packages/recommendations`, `apps/worker` (outbox, embeddingi, `TopicCluster`), Reakcje, `ColdStart`, scalanie i retencja Reakcji Gościa | — |
| 6. Import i API | import CSV, publiczne API z kluczami w `studio` | — |
| 7. Wdrożenie | Vercel, Neon, Railway/Fly, CI | — |
