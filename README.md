# Portal wydarzeń

Strona startowa portalu z wydarzeniami: widok tygodnia, wyszukiwanie zdaniem („Pokaż mi …”) i mapa z pinami.
Next.js (App Router), React, TypeScript, CSS Modules, MapLibre (OpenFreeMap), MSW jako backend.

## Wymagania

- Node.js 22+
- pnpm 11 (`corepack enable` wystarczy, wersja jest w `packageManager`)

## Uruchomienie lokalne

```bash
pnpm install
cp apps/portal/.env.example apps/portal/.env.local
pnpm dev
```

Repozytorium to monorepo (pnpm workspaces + Turborepo). `pnpm dev` z korzenia uruchamia wszystkie aplikacje; samą stronę: `pnpm --filter @events/portal dev`.

Strona: [http://localhost:3000](http://localhost:3000).

### Co dzieje się po drodze

| Krok | Co robi | Dlaczego |
| --- | --- | --- |
| `pnpm install` → `postinstall` (w `apps/portal`) | kopiuje worker MapLibre z `apps/portal/node_modules/maplibre-gl/dist` do `apps/portal/public/maplibre/` | Turbopack psuje domyślną ścieżkę workera, więc mapa ładuje go z `public/` (`setWorkerUrl`). Folder jest w `.gitignore`. |
| `pnpm dev` → `predev` | to samo kopiowanie, na wypadek zmiany wersji `maplibre-gl` | bez tych plików mapa jest pusta, a w konsoli pojawia się `Worker failed to load` |
| start serwera → `src/instrumentation.ts` | uruchamia mock API (MSW) w procesie Node | nie ma prawdziwego backendu; MSW przechwytuje `fetch` z server components |

`pnpm build` ma analogiczny `prebuild`.

### Zmienne środowiskowe (`apps/portal/.env.local`)

| Zmienna | Wartość | Znaczenie |
| --- | --- | --- |
| `EVENTS_API_URL` | `http://api.events.local` | adres API, z którego portal pobiera Terminy. Wymagany, musi być poprawnym adresem http(s). Brak wartości domyślnej. |
| `API_MOCKING` | `enabled` | uruchamia MSW, który w procesie odpowiada pod `EVENTS_API_URL`. Bez tego strona próbuje połączyć się z prawdziwym API i pokazuje błąd. |

Konfiguracja jest walidowana przy starcie serwera, w hooku instrumentacji (`apps/portal/src/config/runtimeConfig.ts`). Błędna konfiguracja nie zatrzymuje serwera (Next 16): serwer działa dalej i odpowiada 500, a w logu jest czytelny komunikat z nazwami zmiennych (bez ich wartości). Na Vercel błąd ujawni się więc w czasie działania (po deployu), nie podczas builda.

Reguła produkcyjna: gdy `VERCEL_ENV=production`, wartość `API_MOCKING=enabled` jest odrzucana (500 z komunikatem), żeby błędny deploy nie serwował po cichu przykładowych danych. Reguła nie opiera się na `NODE_ENV`, bo lokalny `next start` też jest „produkcyjny”.

Mock serwuje przykładowe dane (`@events/repo`: Kategorie, Miejsca, Wydarzenia i Terminy) względem bieżącego tygodnia (i 4 następnych), więc dane zawsze są „aktualne”. Mock tylko wybiera Terminy z Dób wydarzeń w zakresie; nie odtwarza logiki backendu. `@events/repo` to model Wydarzeń bez frameworka; w etapie 1 dostanie adapter Postgresa.

## Skrypty

Bramki (z korzenia, przez Turborepo): `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.

| Komenda | Opis |
| --- | --- |
| `pnpm dev` | serwer deweloperski |
| `pnpm --filter @events/portal dev` | tylko portal |
| `pnpm build` / `pnpm --filter @events/portal start` | build produkcyjny i uruchomienie portalu (MSW działa też tutaj, jeśli `API_MOCKING=enabled`) |
| `pnpm typecheck` | portal: `next typegen` + `tsc --noEmit` (typegen generuje typy tras Nexta, bez niego `tsc` pada na świeżym checkoucie); pakiety: `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest we wszystkich pakietach (portal: jsdom + MSW z tymi samymi handlerami co aplikacja) |
| `pnpm --filter @events/contract test` | testy samego kontraktu |
| `pnpm --filter @events/time test` | testy czasu lokalnego |
| `pnpm --filter @events/repo test` | testy modelu Wydarzeń (przykładowe dane, złączenie we Wpisy programu) |

## Adresy do sprawdzenia

- `/` — bieżący tydzień
- `/?when=today` · `/?when=tomorrow` · `/?when=weekend`
- `/?from=2026-10-03&to=2026-10-08` — własny przedział (maks. 31 dni; zły zakres wraca do bieżącego tygodnia z komunikatem)
- `/?time=morning|noon|afternoon|evening|night` — pora dnia (noc 22:00–04:00)
- `/?timeFrom=21:00&timeTo=04:00` — własne godziny (`timeTo` opcjonalne, domyślnie 04:00)

Doba wydarzeń kończy się o 04:00: wydarzenie z niedzieli 01:30 należy do soboty.

## Typowe problemy

- **Pusta mapa, `Worker failed to load`** — brak plików w `apps/portal/public/maplibre/`. Folder jest generowany (nie ma go w repozytorium, jest w `.gitignore`); `pnpm install` i `pnpm dev` go odtwarzają, a ręcznie: uruchom `node scripts/copy-maplibre-worker.mjs` w `apps/portal`.
- **„Nie udało się wczytać wydarzeń”** — brak `apps/portal/.env.local` albo `API_MOCKING` nie jest `enabled`. Po zmianie env zrestartuj serwer.
- **Zmiany w danych mocka nie są widoczne** — Next trzyma odpowiedzi API w `apps/portal/.next/cache/fetch-cache` (5 min, przeżywa rebuild). Usuń `apps/portal/.next/cache/fetch-cache` i zrestartuj serwer.
- **`typecheck` zgłasza błąd w `.next/dev/types/...`** — nieaktualne typy po `next dev`. Usuń `apps/portal/.next` i uruchom ponownie.

## Struktura

- `apps/portal` — aplikacja Next.js (`@events/portal`); dalsze aplikacje (studio, moderation, worker) dojdą w `apps/`
- `packages/time` (`@events/time`) — czas lokalny (Europe/Warsaw): dzień kalendarzowy, doba wydarzeń kończąca się o 04:00, DST; źródła TS, bez builda
- `packages/contract` (`@events/contract`) — wspólny kontrakt: model odczytu Wpisu programu (`/listing`), transport HTTP (`/occurrences-http`), interfejs źródła Terminów z błędem i kolejnością (`/source`); źródła TS, bez builda
- `packages/repo` (`@events/repo`) — model Wydarzeń (Kategorie, Miejsca, Wydarzenia, Terminy) i przykładowe dane dla mocka; źródła TS, bez builda
- `packages/ui` (`@events/ui`) — tokeny CSS (`@events/ui/tokens.css`); fonty zostają w layoucie portalu
- `packages/typescript-config` — wspólne `tsconfig` (strict) i wariant dla Nexta
- `packages/eslint-config` (`@events/eslint-config`) — wspólny ESLint: granice importów (bez importów w głąb `src` pakietu i bez ścieżek względnych między pakietami/aplikacjami; pakiety bez Reacta/Nexta i bez importu aplikacji) oraz reguły wymagające typów
- `docs/adr`, `docs/contexts`, `CONTEXT-MAP.md` — decyzje i mapa kontekstów
- `HANDOFF.md`, `*.dc.html` — referencja UI (nie kod produkcyjny)
- `docs/plans` — plan wdrożenia architektury (`architecture-roadmap.md`) i pliki etapów (`stages/`)

### Wnętrze `apps/portal`

- `src/app` — strona startowa, `loading`, `error`
- `src/lib/format.ts` — formatowanie dat i godzin po polsku (na bazie `@events/time`); obok `logger.ts`
- `src/features/events/source` — port `OccurrenceSource` i adapter HTTP (server-only); dowolny zakres, adapter sam dzieli zapytania po ≤31 dni
- `src/features/events/schedule.ts` — „Program”: reguła aktywnego wydarzenia, tygodnie, licznik, punkty mapy
- `src/features/events/components` — siatka dni, karty, mapa
- `src/features/search/searchQuery.ts` — kontrakt URL: odczyt zapytania i link po zmianie filtra
- `src/features/search/filters.ts` + `components/FilterChip.tsx` — chipy zdania jako definicje filtrów (data, pora)
- `src/mocks` — dane i handlery MSW
