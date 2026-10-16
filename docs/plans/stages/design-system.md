# Design system i panel motywów

**Cel:** wygląd portalu sterowany kilkoma bazami (spacing, rozmiary fontu, cienie, promienie) i kolorami; motywy testowane w panelu deweloperskim bez utraty oryginału.

## Decyzje (podjęte)

- Oryginał to `packages/ui/src/tokens.css`. Panel nigdy go nie nadpisuje.
- Bazy i skale wyliczane w CSS:
  - spacing: `--space-unit` (4px) × mnożnik, `--space-0-5` … `--space-12`; obecne odstępy wychodzą co do piksela;
  - rozmiary fontu: `--text-base` (14px) × `--text-ratio` (1.125)^n, zaokrąglone do piksela; 13px i 15px przesuwają się o < 1px;
  - cienie: poziomy `sm` / `md` / `lg` i `edge`; `--shadow-color`, `--shadow-strength` (mnożnik przezroczystości), `--shadow-scale` (mnożnik przesunięcia i rozmycia); ujednolicona przezroczystość w obrębie poziomu;
  - promienie: `--radius-unit` (4px) × mnożnik, `--radius-xs` … `--radius-3xl`, `--radius-full`; obecne tokeny (`--radius-card`, `--radius-chip-*`, `--radius-map`) wskazują na kroki skali.
- Kolory wpisane na sztywno w modułach CSS zastępują tokeny; mapa odczytuje paletę ponownie po zmianie motywu.
- Breakpointy zostają w `@media` (CSS nie pozwala tam na zmienne).
- Motyw = nazwa i różnice względem oryginału (JSON) w `packages/ui/src/themes/<slug>.json`. Zapis przez endpoint działający tylko pod `next dev` (w produkcji 404); slug czyszczony, zapis nie wychodzi poza katalog motywów.
- Panel (`apps/portal/src/features/theme-lab/`) tylko pod `next dev`: suwaki baz, kroje z kilku fontów Google (doładowywane tylko w dev), kolory semantyczne, lista motywów (Oryginał / zapisane), zapis, duplikat, usunięcie, reset, eksport CSS. Wybrany motyw nakładany przed pierwszym renderem.
- Motyw staje się domyślnym wyglądem produkcji ręcznie: eksport CSS do `tokens.css` (+ zmiana `next/font` w `layout.tsx`, jeśli zmienia krój).

## Kroki

A. Tokeny i skale w `tokens.css`; moduły CSS przechodzą na tokeny; nowe tokeny kolorów; mapa odświeża paletę.
B. Panel motywów i endpoint zapisu (tylko dev).

## Kryterium ukończenia

Bramki zielone, smoke test portalu; oryginał wygląda jak przed zmianą (poza opisanymi przesunięciami); motyw zapisany z panelu przetrwa restart serwera.
