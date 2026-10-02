# Plan — Portal wydarzeń: strona startowa z wyszukiwaniem po datach

**Status:** Draft • **Owner:** krzysztof.ciach • **Stack:** Next.js (App Router) + React + TypeScript, CSS Modules, maplibre-gl + react-map-gl, OpenFreeMap Bright, MSW, Vitest + Testing Library • **Date:** 2026-10-02

## Goal
Pierwsza wersja portalu z wydarzeniami: strona startowa `/` z widokiem tygodnia (domyślnie bieżący tydzień, liczony dynamicznie) i mapą MapLibre z numerowanymi pinami zgodnymi z kartami. Zdanie „Pokaż mi …” jest formą wyszukiwania; w tej wersji interaktywny jest tylko chip daty — presety „dziś”, „jutro”, „w tym tygodniu”, „w weekend” i własny przedział dat. Interfejs portalu jest po polsku; kod, API i parametry URL po angielsku. Dane pobiera server component natywnym `fetch` Nexta z API mockowanego przez MSW. Wygląd wg `HANDOFF.md` i makiet `.dc.html`.

## Scope
**In:**
- Szkielet Next.js (App Router, `src/`, TS strict, ESLint), CSS Modules, tokeny z handoffu, fonty Bricolage Grotesque + DM Sans przez `next/font`.
- Mock API w MSW (`setupServer` w Node, startowany w `instrumentation.ts`). Dane z kilku miast; daty generowane względem bieżącego tygodnia, żeby mock nigdy się nie „przeterminował”.
- Model zakresu dat: presety `today` / `tomorrow` / `week` / `weekend` + własny przedział `from`–`to`. Stan w URL (`?when=today` albo `?from=YYYY-MM-DD&to=YYYY-MM-DD`), czytany przez server component z `searchParams`. Brak parametrów = bieżący tydzień.
- Warstwa danych po stronie serwera (`server-only`): fetch z timeoutem, walidacja odpowiedzi, numeracja, grupowanie po dniach.
- Zdanie-wyszukiwarka: komponent chipa przygotowany pod przyszłe filtry. Chip daty jest interaktywny (popover na desktopie, bottom sheet na mobile, z presetami i dwoma polami daty). Pozostałe chipy (kategoria, miejsce, pora) są statyczne: wyglądają jak w makiecie, ale nie są przyciskami. Licznik wyników z polską odmianą; etykieta zakresu dat (np. „5—11.10”) liczona dynamicznie.
- Siatka dni: desktop pokazuje pełne tygodnie pon–nd obejmujące zakres; dni poza zakresem mają szare tło, ale kolumna zostaje (stały rytm wg handoffu). Na mobile poziomy scroll-snap tylko z dniami z zakresu. Karta wydarzenia: obrazek/placeholder, numer, godzina · kategoria, tytuł, miejsce i miasto. Stan pustego dnia.
- Mapa: client component (react-map-gl/maplibre, styl `https://tiles.openfreemap.org/styles/bright`), numerowane markery, `fitBounds` do wyników (działa przy wydarzeniach z różnych miast). Na mobile ukryta za przyciskiem „Mapa”.
- `loading.tsx`, `error.tsx`, dostępność (prawdziwe przyciski, `aria-*`, focus trap i Esc w popoverze, kontrast ≥4.5:1).
- Testy Vitest + RTL, `CLAUDE.md` projektu.

**Out:**
- Interaktywne chipy kategorii, miejsca i pory; przycisk „Wyczyść” (wróci razem z kolejnymi filtrami).
- Wybór miasta i geolokalizacja; prawdziwy backend i baza; strona szczegółów wydarzenia; konta użytkowników.
- Nawigacja „poprzedni / następny tydzień” (do przedziału dochodzi się przez chip daty).
- Powiązanie hover pin ↔ karta, klastrowanie pinów.
- MSW w przeglądarce (`setupWorker`), bo klient nie robi fetchy.
- E2E, deploy, CI.

## Assumptions
- Język: cały tekst widoczny dla użytkownika po polsku; identyfikatory, typy, endpointy i parametry URL po angielsku. — refute if wrong.
- „W weekend” = sobota–niedziela bieżącego tygodnia; w sobotę i niedzielę liczymy od dziś do niedzieli (bez dni minionych). — refute if wrong.
- „Dziś” i granice tygodnia liczymy w strefie `Europe/Warsaw`, niezależnie od strefy serwera. — refute if wrong.
- Tydzień zaczyna się w poniedziałek. „Jutro” w niedzielę pokazuje poniedziałek następnego tygodnia. — refute if wrong.
- Przedział własny ma maksymalnie 31 dni. Zły lub odwrócony przedział, albo przekroczony limit, wraca do bieżącego tygodnia, a w zdaniu pojawia się krótka informacja. — refute if wrong.
- Bez wyboru miasta chip miejsca pokazuje „wszędzie”, a mapa dopasowuje się do wszystkich wyników. — refute if wrong.
- Własny przedział wybieramy dwoma natywnymi `<input type="date">`, bez biblioteki kalendarza. — refute if wrong.
- Popover i bottom sheet to natywny `<dialog>` (desktop: niemodalny, z pozycją pod chipem; mobile: `showModal()` jako arkusz od dołu). — refute if wrong.
- Daty liczymy na `Date` + `Intl.DateTimeFormat` z `timeZone`, bez nowej zależności. — refute if wrong.
- Numer wydarzenia (1..n) wylicza serwer w obrębie bieżącego widoku. — refute if wrong.
- Mock bez zdjęć; karta obsługuje `imageUrl` (`object-fit: cover`), a bez niego pokazuje kolor kategorii. — refute if wrong.
- Karta to `<article>`, nie link (brak strony szczegółów). — refute if wrong.
- Walidacja odpowiedzi API ręcznym type guardem, bez Zod. — refute if wrong.

## Steps
1. **Scaffold projektu** — `events-app/` (`HANDOFF.md`, `*.dc.html` bez zmian) — _via_ `frontend-developer`
   - `create-next-app` w katalogu tymczasowym, potem przeniesienie plików do `events-app/` (folder nie jest pusty, a `create-next-app` może odmówić). Opcje: TS, App Router, `src/`, ESLint, bez Tailwinda. Potwierdzić skrypt `lint`, dodać `typecheck` (`tsc --noEmit`). Deps: `maplibre-gl`, `react-map-gl`, `msw`, `server-only`; dev: `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/{react,user-event,jest-dom}`. `tsconfig` strict.
2. **Tokeny i fonty** — `src/styles/tokens.css`, `src/app/layout.tsx`, `src/app/globals.css` — _via_ `frontend-developer`
   - Zmienne CSS z sekcji „Styl” handoffu; `next/font/google`; `lang="pl"`.
3. **Model domeny** — `src/features/events/types.ts`, `src/features/search/dateRange.ts` — _via_ `frontend-developer`
   - Typ `Event { id, startsAt (ISO), title, venue { name, city, lat, lng }, category, imageUrl? }`.
   - Typ `DateRange { from, to }` (dni kalendarzowe) i `DatePreset = 'today' | 'tomorrow' | 'week' | 'weekend'`. Polskie etykiety presetów w jednym słowniku UI (`src/features/search/labels.ts`).
   - Czyste funkcje: `resolvePreset(preset, now, tz)`, `parseDateSearchParams(params, now)` (walidacja formatu, kolejności i limitu 31 dni, fallback do tygodnia), `toSearchParams(range | preset)`, `weeksCovering(range)`, `formatRangeLabel(range)`.
4. **Dane mock i handlery MSW** — `src/mocks/data/events.ts`, `src/mocks/handlers.ts`, `src/mocks/node.ts`, `src/instrumentation.ts`, `.env.example` — _via_ `frontend-developer`
   - Szablony wydarzeń z `EV` (Wrocław) plus kilka z 2–3 innych miast, każde z offsetem dnia i godziną. Generator robi z nich daty względem bieżącego tygodnia i następnych 4 tygodni, żeby własne przedziały też miały wyniki.
   - `GET ${EVENTS_API_URL}/events?from=&to=` zwraca wydarzenia z zakresu. Złe parametry albo zakres >31 dni dają `400`.
   - `register()` startuje tylko gdy `NEXT_RUNTIME === 'nodejs'` i `API_MOCKING === 'enabled'`, z `onUnhandledRequest: 'bypass'`.
   - Warunek planu B: jeśli MSW nie przechwytuje serwerowego `fetch` w `next dev` i w `next start`, robimy Route Handler `src/app/api/events/route.ts` z tym samym kontraktem.
5. **Warstwa danych serwera** — `src/features/events/api.ts` (`import 'server-only'`), `src/features/events/days.ts` — _via_ `frontend-developer`
   - `getEvents(range)`: `AbortSignal.timeout(5000)`, `next: { revalidate: 300 }`, type guard. Błąd trafia do `error.tsx` bez szczegółów technicznych (`security.md`).
   - Czyste funkcje: `numberEvents`, `groupByDay(events, days)` (każdy dzień, także pusty), `formatCount` (`Intl.PluralRules('pl')`). Bez `any` (`code-quality-js.md`).
6. **Strona startowa i sekcje (server components)** — `src/app/{page,loading,error}.tsx`, `src/features/events/components/{Header,WeekGrid,DayColumn,EventCard}.tsx` + `*.module.css` — _via_ `frontend-developer`
   - `page.tsx` czyta `searchParams` → `parseDateSearchParams` → przekazuje zakres do sekcji. Strona tylko składa sekcje (`code-quality-js.md`).
   - Desktop: 7 kolumn na tydzień, numer dnia 64px, weekend w akcencie, dni poza zakresem szare, linia 4px pod nagłówkiem. Mobile: tylko dni z zakresu, kolumna 168px, `scroll-snap`.
7. **Zdanie-wyszukiwarka i chip daty** — `src/features/search/components/{SearchSentence,SentenceChip,DateChip,DatePicker}.tsx` + `*.module.css` — _via_ `frontend-developer`
   - `SearchSentence` (server) składa zdanie. `SentenceChip` ma wariant statyczny (span) i interaktywny (button + `aria-haspopup="dialog"`, `aria-expanded`), żeby kolejne filtry dało się dołożyć bez przebudowy.
   - `DateChip` (`'use client'`): presety „dziś”, „jutro”, „w tym tygodniu”, „w weekend” jako przyciski, a pod nimi „własny przedział” z dwoma polami daty (`min`/`max` pilnują limitu, komunikat błędu przez `aria-describedby`). Wybór robi `router.push` z nowymi parametrami. Esc i klik poza zamykają, focus wraca na chip.
   - Pozostałe chipy statyczne: „wszystko”, „wszędzie”, „o każdej porze”. Licznik wyników obok etykiety zakresu.
8. **Mapa (client component)** — `src/features/events/components/{EventsMap,EventsMapLoader,MapToggle}.tsx`, `src/features/events/mapView.ts` — _via_ `frontend-developer`
   - `EventsMapLoader` (`'use client'` — `ssr: false` działa tylko w client component) przez `next/dynamic` z `ssr: false`. Import CSS maplibre. `<Marker>` w stylu pinu z makiety.
   - `boundsFor(events)` dla `fitBounds` (różne miasta, jeden punkt, pusta lista). Do klienta trafia tylko `{no, lat, lng, title}`.
   - `MapToggle`: stan tylko na mobile, `aria-expanded`/`aria-controls`. Atrybucja OSM/OpenFreeMap widoczna.
9. **Konfiguracja Vitest** — `vitest.config.ts`, `vitest.setup.ts`, skrypty `test`/`test:watch` — _via_ `frontend-developer`
   - jsdom, jest-dom, MSW `setupServer` z tymi samymi handlerami, alias `server-only` na pusty moduł, mock `next/navigation` w testach `DateChip`.
10. **Testy** — patrz Tests — _via_ `/test-writer`
11. **CLAUDE.md projektu** — `events-app/CLAUDE.md` — _via_ `/setup-claudemd`
    - Stack, struktura `src/features/{events,search}`, MSW w `instrumentation.ts`, kontrakt URL, komendy, zasady: „UI po polsku, kod/API/URL po angielsku”, „HANDOFF/.dc.html to referencja, nie kod”.
12. **Repozytorium git** — `git init` + pierwszy commit — _via_ `manual` (user), potem `/ship`

## Files
**Add:**
- `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs` — scaffold
- `.env.example` — `EVENTS_API_URL`, `API_MOCKING`
- `src/instrumentation.ts` — start MSW w Node
- `src/mocks/{handlers,node}.ts`, `src/mocks/data/events.ts` — mock API i generator danych
- `src/features/events/{types,api,days,mapView}.ts` — model, fetch, logika widoku
- `src/features/events/components/*.tsx` + `*.module.css` — siatka, karty, mapa
- `src/features/search/dateRange.ts` — presety, parsowanie i walidacja zakresu
- `src/features/search/labels.ts` — polskie etykiety chipów i presetów
- `src/features/search/components/*.tsx` + `*.module.css` — zdanie, chipy, wybór dat
- `src/app/{layout,page,loading,error}.tsx`, `src/app/globals.css`, `src/styles/tokens.css`
- `vitest.config.ts`, `vitest.setup.ts`, testy `*.test.ts(x)` obok kodu
- `CLAUDE.md`

**Modify:**
- None (`HANDOFF.md` i `*.dc.html` bez zmian)

## Tests
- [unit] `src/features/search/dateRange.ts`:
  - `resolvePreset`: „dziś” i „jutro” w strefie `Europe/Warsaw` blisko północy UTC; niedziela → „jutro” to poniedziałek; „weekend” w środę, w sobotę i w niedzielę; tydzień pon–nd także na przełomie miesiąca i roku; zmiana czasu (koniec października).
  - `parseDateSearchParams` (table-driven): brak parametrów → tydzień; preset; poprawny przedział; zły format, `from > to`, >31 dni → fallback i flaga błędu.
  - `weeksCovering`: przedział w jednym tygodniu, na dwóch tygodniach, jeden dzień.
- [unit] `src/features/events/days.ts`: `groupByDay` zwraca każdy dzień zakresu, także pusty, z wydarzeniami posortowanymi po godzinie; `numberEvents` numeruje 1..n chronologicznie i stabilnie.
- [unit] `formatCount`: 0 / 1 / 2–4 / 5 / 12 / 22 / 25 → poprawna odmiana.
- [unit] `mapView.ts`: `boundsFor` dla punktów z różnych miast, jednego punktu i pustej listy.
- [functional] `getEvents` przeciw handlerom MSW: zwraca tylko wydarzenia z zakresu; `400`, `500` i zły kształt dają kontrolowany błąd; timeout przerywa żądanie.
- [component] `DateChip`:
  - otwiera dialog z presetami; wybór „jutro” robi `router.push` z `?when=tomorrow`, „w weekend” z `?when=weekend`;
  - własny przedział z `from > to` pokazuje błąd i nie nawiguje; poprawny nawiguje z `from`/`to`;
  - Esc zamyka i focus wraca na chip; `aria-expanded` zmienia się poprawnie.
- [component] `MapToggle`: przełącza widoczność i `aria-expanded`, ma dostępną nazwę.
- [component] `DayColumn`: pusty dzień w zakresie i dzień poza zakresem pokazują swoje komunikaty; numery kart zgadzają się z pinami.
- Bez testów: `EventsMap` (WebGL nie działa w jsdom; logika w `mapView.ts`), prezentacyjne `EventCard`/`Header`/statyczny `SentenceChip`. Bez snapshotów (`testing.md`).

## Public API impact
- Kontrakt mock API: `GET /events?from=YYYY-MM-DD&to=YYYY-MM-DD` (max 31 dni) → `{ events: Event[] }`. To przyszły kontrakt prawdziwego backendu.
- Kontrakt URL strony startowej: `?when=today|tomorrow|week|weekend` lub `?from=YYYY-MM-DD&to=YYYY-MM-DD`. Linki da się udostępniać, więc zmiana nazw później psuje zapisane linki.

## Risks & migrations
- MSW w `instrumentation.ts` z App Router bywa kruche (HMR, patchowany `fetch`). Kiedy przejść na plan B, opisuje krok 4.
- Strefa czasowa: serwer zwykle działa w UTC, więc bez jawnego `Europe/Warsaw` „dziś” po 22:00/23:00 wskaże zły dzień. Pokrywają to testy jednostkowe `resolvePreset`.
- Strona zależy od `searchParams` i „teraz”, więc jest dynamiczna (bez statycznego prerenderu). `revalidate` na `fetch` cache'uje tylko dane, nie stronę.
- Natywny `<input type="date">` wygląda różnie w przeglądarkach, ale jest dostępny i nie wymaga biblioteki. Ładniejszy kalendarz można dołożyć później (open question).
- `react-map-gl` v8: import z `react-map-gl/maplibre`; wersje przypiąć zgodnie z peer deps.
- OpenFreeMap: darmowe kafelki bez SLA.

## Open questions
- Strefa „dziś”: zawsze `Europe/Warsaw` czy strefa przeglądarki użytkownika (wymaga przekazania jej na serwer, np. cookie)? (domyślnie: `Europe/Warsaw`)
- Limit własnego przedziału: 31 dni czy inny? (domyślnie: 31)
- Zod do walidacji odpowiedzi API (nowa zależność) czy ręczny type guard? (domyślnie: type guard)

## Verification gates
Uruchamiane po kroku 10, żeby `npm test` miał testy do odpalenia.
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- Ręcznie: `npm run build && API_MOCKING=enabled npm start`, potem `/` (sprawdza, czy MSW działa poza trybem dev)
- Ręcznie: `API_MOCKING=enabled npm run dev`, potem `/`, `/?when=today`, `/?when=tomorrow`, `/?when=weekend`, `/?from=…&to=…` (w tym przedział z dwóch tygodni i zły przedział) na 1440px i 390px, plus obsługa chipa daty samą klawiaturą.

## Handoffs
- Implementation: `/develop docs/plans/portal-wydarzen-strona-startowa-2026-10-02.md` (kroki 1–9 → `frontend-developer`)
- Tests: `/test-writer src/features`
- CLAUDE.md: `/setup-claudemd`
- Ship: `/ship`
