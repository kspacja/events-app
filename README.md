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
| `API_MOCKING` | `enabled` | włącza MSW. Bez tego strona próbuje pobrać dane z `EVENTS_API_URL` i pokazuje błąd. |
| `EVENTS_API_URL` | `http://api.events.local` | adres API. Przy MSW to adres fikcyjny, przechwytywany przez mock. |

Mock generuje wydarzenia względem bieżącego tygodnia (i 4 następnych), więc dane zawsze są „aktualne”.

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
| `pnpm --filter @events/contract test` | testy samego kontraktu i czasu lokalnego |

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
- `packages/contract` (`@events/contract`) — wspólny kontrakt: schematy zod wydarzeń (`/events`) i czas lokalny (`/time`); źródła TS, bez builda
- `packages/ui` (`@events/ui`) — tokeny CSS (`@events/ui/tokens.css`); fonty zostają w layoucie portalu
- `packages/typescript-config` — wspólne `tsconfig` (strict) i wariant dla Nexta
- `docs/adr`, `docs/contexts`, `CONTEXT-MAP.md` — decyzje i mapa kontekstów
- `HANDOFF.md`, `*.dc.html` — referencja UI (nie kod produkcyjny)
- `docs/plans` — plan implementacji

### Wnętrze `apps/portal`

- `src/app` — strona startowa, `loading`, `error`
- `@events/contract/time` — czas lokalny (Europe/Warsaw): dzień, doba wydarzeń do 04:00, formatowanie, DST
- `src/features/events/api.ts` — źródło wydarzeń (server-only); dowolny zakres, sam dzieli zapytania po ≤31 dni
- `src/features/events/schedule.ts` — „Program”: reguła aktywnego wydarzenia, tygodnie, licznik, punkty mapy
- `src/features/events/components` — siatka dni, karty, mapa
- `src/features/search/searchQuery.ts` — kontrakt URL: odczyt zapytania i link po zmianie filtra
- `src/features/search/filters.ts` + `components/FilterChip.tsx` — chipy zdania jako definicje filtrów (data, pora)
- `src/mocks` — dane i handlery MSW
