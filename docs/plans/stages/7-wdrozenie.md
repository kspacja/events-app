# Etap 7 — Wdrożenie

**Cel:** portal działa pod adresem Vercela. Na razie jako release Preview na samych mockach MSW, bez bazy i bez `apps/api`.

**Zależy od:** etapu 3.5 (zacommitowanego), bo Vercel buduje z commitów, a nie z drzewa roboczego.

## Decyzje (podjęte)

- Release na Vercelu to deployment **Preview** (gałąź `demo`), nie produkcja. `API_MOCKING=enabled` i `EVENTS_API_URL=http://api.events.local` ustawiamy tylko w środowisku Preview.
- Reguła produkcyjna z `runtimeConfig.ts` zostaje bez zmian: `VERCEL_ENV=production` odrzuca `API_MOCKING=enabled` (500). Mock na produkcji wymagałby osobnej flagi i zmiany reguły — osobna decyzja, poza tym etapem.
- Projekt Vercel: Root Directory `apps/portal`, włączone „Include source files outside Root Directory” (pnpm workspace).
- Zmienne w Vercelu, tylko dla Preview: `EVENTS_API_URL`, `API_MOCKING`. Pliki `.env*` lokalne nie trafiają na Vercel.

## Kroki

1. Commit zmian etapu 3.5 (bez pusha, po zgodzie właściciela repo).
2. Projekt Vercel: Root Directory, „Include source files outside Root Directory”, zmienne Preview, gałąź `demo`.
3. Pierwszy deployment Preview; sprawdzenie: strona `/` i `/dla-szkol` pokazują dane z mocka, `/mockServiceWorker.js` zwraca 200.
4. Produkcja: bez zmian w tym etapie.

## Sprawdzone lokalnie

- `pnpm build` portalu z `API_MOCKING=enabled` i `VERCEL_ENV=preview`: przechodzi.
- `next start` z `VERCEL_ENV=production` i `API_MOCKING=enabled`: 500.
- `next start` z `VERCEL_ENV=preview` i `API_MOCKING=enabled`: 200, 7 wydarzeń na stronie.

## Kryterium ukończenia

Adres Preview na Vercelu pokazuje stronę główną i `/dla-szkol` na mockach. Produkcja nie serwuje mocka (reguła działa, co potwierdza próba z `VERCEL_ENV=production`). Baza i `apps/api` nie są potrzebne.
