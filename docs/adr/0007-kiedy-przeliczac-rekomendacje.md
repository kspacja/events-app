---
status: accepted
---

# Kiedy przeliczać Rekomendacje

Embedding każdego Wydarzenia `apps/worker` liczy zaraz po publikacji, więc ranking dla Odbiorcy obejmuje nowe Wydarzenie bez czekania na ponowne wyznaczenie Klastrów tematycznych. Same Klastry tematyczne wyznaczamy od zera co N nowych publikacji, ale nie rzadziej niż co T dni, żeby nie zestarzały się w spokojniejszych okresach.

N i T są konfigurowalne, nie zaszyte w kodzie:

- worker czyta je z konfiguracji z wartościami domyślnymi N = 200 i T = 7 dni, które można nadpisać zmiennymi środowiskowymi (np. `RECLUSTER_EVERY_N_PUBLICATIONS`, `RECLUSTER_MAX_INTERVAL_DAYS`);
- zmiana wymaga tylko restartu workera, bez wdrażania aplikacji;
- przeniesienie ich do tabeli ustawień edytowanej w `apps/moderation` to możliwe rozszerzenie, na razie nieprzesądzone.

## Considered Options

- **Wyłącznie nocne przeliczanie Klastrów tematycznych** — odrzucone.
- **Przypisanie do najbliższego Klastra tematycznego przy publikacji plus nocna pełna przebudowa** — odrzucone na rzecz przeliczania według liczby publikacji.

## Consequences

- Do najbliższego przeliczenia nowe Wydarzenie nie ma Klastra tematycznego, więc Zimny start nie może go jeszcze wybrać.
