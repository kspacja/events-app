# Portal wydarzeń — handoff dla Claude Code

Ten folder to **referencja wizualna**, nie kod produkcyjny. Pliki `.dc.html` używają
składni edytora Claude Design (`<x-dc>`, `<sc-for>`, `<sc-if>`, `{{...}}`) — nie kopiuj ich
1:1, odtwórz układ i zachowanie w docelowym stacku.

## Pliki

- `desktop.dc.html` — widok desktop (afisz tygodnia + wyszukiwarka zdaniowa + mapa)
- `mobile.dc.html` — widok mobile (te same dane, tydzień przewijany w poziomie)

Dane wydarzeń i logika filtrowania są w bloku `<script type="text/x-dc">` na dole każdego
pliku (tablica `EV` i funkcja `match`). To dobry punkt startowy dla modelu danych.

## Wyszukiwarka zdaniowa

Zdanie: „Pokaż mi [kategoria] [miejsce], [zakres dni] [pora dnia].”
Każdy fragment to filtr (w produkcji: rozwijany wybór / bottom sheet na mobile; w prototypie
kliknięcie przełącza na kolejną opcję). Brak punktu startowego i trybu podróży — to wyszukiwanie,
nie planowanie.

- Kategoria: wszystko / muzyka / kino / jedzenie / ruch i spacery / warsztaty
- Miejsce: całe miasto / dzielnice
- Zakres: tydzień / weekend / dni powszednie
- Pora: każda / wieczorem (≥17:00) / w ciągu dnia (<17:00)
- Licznik wyników + „Wyczyść”

## Desktop

- Nagłówek: zdanie-wyszukiwarka (32px) po lewej, mapa ok. 520×340 z numerowanymi pinami
  po prawej, pod spodem czarna linia 4px.
- Siatka 7 kolumn (pon–nd), duży numer dnia (64px), od piątku numer w kolorze akcentu.
- Dni poza zakresem: szare tło, ale kolumna zostaje (stały rytm siatki).
- Każde wydarzenie: obrazek (104px wys., radius 12px) z numerem zgodnym z pinem na mapie,
  godzina · kategoria, tytuł, miejsce.

## Mobile

- Zdanie (22px) zawija się w kilka linii; fragmenty min. 40–44px wysokości.
- Mapa domyślnie ukryta, przycisk „Mapa” w prawym górnym rogu.
- Tydzień przewijany **poziomo** (scroll-snap), kolumna 168px → min. 2 dni na ekranie
  + zajawka trzeciego. Wydarzenia w kolumnie **pionowo**.
- Pokazywane są tylko dni z wybranego zakresu.
- Każde wydarzenie ma obrazek (112px wys.) z numerem w lewym górnym rogu.
- Obrazki w makiecie to placeholdery — w produkcji zdjęcie wydarzenia (`object-fit: cover`).

## Styl

- Fonty: Bricolage Grotesque (nagłówki, numery dni; 700–800) + DM Sans (tekst; 400–600).
- Kolory: tekst `#1C1B19` / `#4A4844`, akcent `#C2410C` (ciemniejszy `#9A3412`),
  miękki akcent `#FDEDE4`, tła `#FFFFFF` / `#F5F4F1`, linie `#E4E2DD`, woda na mapie `#BFD7EA`.
- Bez gradientów i emoji; ikony liniowe.
- Dostępność: prawdziwe `<button>`/`<a>`, `aria-label` na przyciskach-ikonach, kontrast ≥4.5:1.
