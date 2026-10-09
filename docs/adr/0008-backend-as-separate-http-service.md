---
status: accepted
---

# Backend jako osobny serwis HTTP

Dane i logikę wszystkich kontekstów trzyma jeden backend, `apps/api` (Hono + Drizzle + Postgres). Portal, Studio, Moderacja i przyszła aplikacja mobilna korzystają z niego wyłącznie przez HTTP. Żadna aplikacja Next.js nie łączy się z bazą.

- Modularny monolit z ADR-0002 zostaje, ale żyje w `apps/api`: konteksty to pakiety wywoływane w procesie backendu, schemat na kontekst, outbox.
- Rekomendacje (ADR-0003) liczy backend. Worker to ten sam kod backendu uruchomiony jako osobny proces: przelicza Rekomendacje i opróżnia outbox, a z resztą systemu rozmawia tylko przez Postgresa (ADR-0006).
- Better Auth (ADR-0004) działa w backendzie; aplikacje Next.js przekazują dalej ciasteczko sesji.
- `@events/contract` trzyma schematy żądań i odpowiedzi API (zod), wspólne dla backendu i klientów.
- Next.js cache'uje odczyty przez `fetch` z `revalidate`.
- Frontendy w dev i testach mockują endpointy API przez MSW `setupServer`; nieobsłużone żądania idą do prawdziwego API. Praca nad frontem nie wymaga bazy ani Dockera.
- Uzupełnienie (etap 3.5): portal czyta też z przeglądarki, bezpośrednio z API (CORS, origin portalu w `CORS_ORIGIN`). W dev odpowiada mu MSW `setupWorker` z tymi samymi handlerami co `setupServer`; adres API i flaga mocka przechodzą do klienta z konfiguracji serwera, bez `NEXT_PUBLIC_`.

Powód: jedna logika dla wszystkich klientów (furtka na aplikację mobilną), fizyczna i czytelna granica do debugowania (Network, `curl`), niezależna praca nad frontem bez bazy — także dla kolejnych osób w zespole.

## Considered Options

- **Aplikacje Next.js czytają bazę w procesie** (pierwotne ADR-0002), cache przez `'use cache'` — odrzucone: prostsze wdrożenie, ale aplikacja mobilna wymagałaby i tak osobnego API, a wydzielanie go po fakcie jest drogie. Frontend nie dałby się też uruchomić bez bazy.
- **NestJS jako framework backendu** — odrzucony jako armata na wróbla przy 1–2 osobach. Hono jest mały, w TypeScripcie, ma walidację zod i generuje OpenAPI.

## Consequences

- Drugi serwis do wdrożenia i utrzymania; każdy render portalu to dodatkowy przeskok sieciowy, który łagodzi cache `fetch`.
- Sesja przechodzi między serwisami (ciasteczko dla aplikacji Next.js, tokeny dla przyszłej aplikacji mobilnej).
- API trzeba wersjonować, gdy pojawi się klient, którego nie da się zaktualizować na siłę (aplikacja mobilna).
- `apps/api` i worker stoją na Railway/Fly (ADR-0006), frontendy na Vercelu, baza w Neonie.
- Częściowo zastępuje ADR-0002 (kto czyta bazę) i ADR-0003 (gdzie liczymy ranking); uzupełnia ADR-0001 i ADR-0006.
