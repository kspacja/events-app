# Portal wydarzeń

Strona startowa portalu z wydarzeniami: widok tygodnia, wyszukiwanie zdaniem („Pokaż mi …”) i mapa z pinami.
Next.js (App Router), React, TypeScript, CSS Modules, MapLibre (OpenFreeMap), MSW jako backend.

## Wymagania

- Node.js 22+
- npm

## Uruchomienie lokalne

```bash
npm install
cp .env.example .env.local
npm run dev
```

Strona: [http://localhost:3000](http://localhost:3000).

### Co dzieje się po drodze

| Krok | Co robi | Dlaczego |
| --- | --- | --- |
| `npm install` → `postinstall` | kopiuje worker MapLibre z `node_modules/maplibre-gl/dist` do `public/maplibre/` | Turbopack psuje domyślną ścieżkę workera, więc mapa ładuje go z `public/` (`setWorkerUrl`). Folder jest w `.gitignore`. |
| `npm run dev` → `predev` | to samo kopiowanie, na wypadek zmiany wersji `maplibre-gl` | bez tych plików mapa jest pusta, a w konsoli pojawia się `Worker failed to load` |
| start serwera → `src/instrumentation.ts` | uruchamia mock API (MSW) w procesie Node | nie ma prawdziwego backendu; MSW przechwytuje `fetch` z server components |

`npm run build` ma analogiczny `prebuild`.

### Zmienne środowiskowe (`.env.local`)

| Zmienna | Wartość | Znaczenie |
| --- | --- | --- |
| `API_MOCKING` | `enabled` | włącza MSW. Bez tego strona próbuje pobrać dane z `EVENTS_API_URL` i pokazuje błąd. |
| `EVENTS_API_URL` | `http://api.events.local` | adres API. Przy MSW to adres fikcyjny, przechwytywany przez mock. |

Mock generuje wydarzenia względem bieżącego tygodnia (i 4 następnych), więc dane zawsze są „aktualne”.

## Skrypty

| Komenda | Opis |
| --- | --- |
| `npm run dev` | serwer deweloperski |
| `npm run build` / `npm start` | build produkcyjny i jego uruchomienie (MSW działa też tutaj, jeśli `API_MOCKING=enabled`) |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` (typegen generuje typy tras Nexta, bez niego `tsc` pada na świeżym checkoucie) |
| `npm run lint` | ESLint |
| `npm test` / `npm run test:watch` | Vitest (jsdom + MSW z tymi samymi handlerami co aplikacja) |

## Adresy do sprawdzenia

- `/` — bieżący tydzień
- `/?when=today` · `/?when=tomorrow` · `/?when=weekend`
- `/?from=2026-10-03&to=2026-10-08` — własny przedział (maks. 31 dni; zły zakres wraca do bieżącego tygodnia z komunikatem)
- `/?time=morning|noon|afternoon|evening|night` — pora dnia (noc 22:00–04:00)
- `/?timeFrom=21:00&timeTo=04:00` — własne godziny (`timeTo` opcjonalne, domyślnie 04:00)

Doba wydarzeń kończy się o 04:00: wydarzenie z niedzieli 01:30 należy do soboty.

## Typowe problemy

- **Pusta mapa, `Worker failed to load`** — brak plików w `public/maplibre/`. Uruchom `node scripts/copy-maplibre-worker.mjs`.
- **„Nie udało się wczytać wydarzeń”** — brak `.env.local` albo `API_MOCKING` nie jest `enabled`. Po zmianie env zrestartuj serwer.
- **Zmiany w danych mocka nie są widoczne** — Next trzyma odpowiedzi API w `.next/cache/fetch-cache` (5 min, przeżywa rebuild). Usuń ten folder i zrestartuj serwer.
- **`typecheck` zgłasza błąd w `.next/dev/types/...`** — nieaktualne typy po `next dev`. Usuń `.next` i uruchom ponownie.

## Struktura

- `src/app` — strona startowa, `loading`, `error`
- `src/features/time/localTime.ts` — czas lokalny (Europe/Warsaw): dzień, doba wydarzeń do 04:00, formatowanie, DST
- `src/features/events/api.ts` — źródło wydarzeń (server-only); dowolny zakres, sam dzieli zapytania po ≤31 dni
- `src/features/events/schedule.ts` — „Program”: reguła aktywnego wydarzenia, tygodnie, licznik, punkty mapy
- `src/features/events/components` — siatka dni, karty, mapa
- `src/features/search/searchQuery.ts` — kontrakt URL: odczyt zapytania i link po zmianie filtra
- `src/features/search/filters.ts` + `components/FilterChip.tsx` — chipy zdania jako definicje filtrów (data, pora)
- `src/mocks` — dane i handlery MSW
- `HANDOFF.md`, `*.dc.html` — referencja UI (nie kod produkcyjny)
- `docs/plans` — plan implementacji
