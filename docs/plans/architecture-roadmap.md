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
| 0.5 Porządki po przeglądzie | poprawki z code review; `@events/time` oddzielone od `contract`, jedno źródło Kategorii, seam odczytu Terminów (`OccurrenceListing`, `OccurrenceSource`), cel przewinięcia z Programu, moduł wyboru Terminu na mapie | zrobione |
| 0.6 Gotowość do etapu 1 | interfejs źródła Terminów w pakiecie + wspólne testy zgodności adapterów; Wpis programu oddzielony od kontraktu HTTP (jednolita reprezentacja czasu); Kategoria jako dane; `packages/catalog` z przykładowym Katalogiem (źródło mocka i seeda); jedno miejsce składania portalu (zwalidowana konfiguracja, wybór źródła); granice kontekstów w lincie; zwężenie interfejsu wyboru Terminu | w toku |
| 1. Baza + Katalog | Postgres + pgvector (Docker lokalnie), Drizzle (ADR), schematy per kontekst, `packages/catalog` (`Event`, `Occurrence`, `Venue`, `Category`, `Price`, `Submission`), seed z mocka, portal czyta z bazy | — |
| 1.5 Obserwowalność (instrumentacja) | OpenTelemetry w `instrumentation.ts` aplikacji i w `worker` (ślady, metryki, logi), ustrukturyzowany logger zamiast obecnego, raportowanie błędów, korelacja żądań i przenoszenie kontekstu śladu przez outbox do workera, podstawowe dashboardy i alerty. Do decyzji (ADR): dostawca/backend telemetrii, raportowanie błędów, próbkowanie, retencja, RODO (bez danych osobowych w telemetrii) | — |
| 2. Tożsamość | Better Auth: `Attendee` (magic link), `Organizer`, `Moderator` (zaproszenia), `Guest` | — |
| 3. Studio | `apps/studio`: Wydarzenia, Terminy, Miejsca, zdjęcia (R2), Zgłoszenia, Zmiany drobne/istotne | — |
| 4. Moderacja | `apps/moderation`: kolejka Zgłoszeń, decyzje | — |
| 5. Rekomendacje | `packages/recommendations`, `apps/worker` (outbox, embeddingi, `TopicCluster`), Reakcje, `ColdStart`, scalanie i retencja Reakcji Gościa | — |
| 6. Import i API | import CSV, publiczne API z kluczami w `studio` | — |
| 7. Wdrożenie | Vercel, Neon, Railway/Fly, CI | — |
