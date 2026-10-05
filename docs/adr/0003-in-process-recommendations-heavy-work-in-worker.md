---
status: accepted
---

# Rekomendacje liczone w procesie, ciężka praca w workerze

Ranking dla Odbiorcy (mały model per Odbiorca, np. regresja logistyczna albo kNN na embeddingach, jak w PoC) liczymy na żądanie w aplikacji, przez `packages/recommendations`. Ciężkie operacje, czyli embedding nowych Wydarzeń modelem z PoC (multilingual-e5-small) i wyznaczanie Klastrów tematycznych, wykonuje `apps/worker`, uruchamiany przez outbox (ADR-0002) i według harmonogramu. Przy tej skali taki model liczy się w milisekundach, więc osobna usługa niczego by nie przyspieszyła, a dodałaby kolejną rzecz do utrzymania.

- Odbiorca może wycofać Reakcję w każdej chwili, dlatego model zawsze liczymy od nowa z bieżącego stanu Reakcji. Nie prowadzimy dziennika uczenia, do którego tylko dopisujemy.
- Zimny start dostarcza pierwsze Reakcje, wybierając Wydarzenia tak, by pokryły przestrzeń embeddingów. Pominięcie nie wpływa na model.
- Furtka na przyszłość: `packages/recommendations` jest dostępny tylko przez swój interfejs. Jeśli kiedyś będzie potrzebny Python albo GPU, wydzielimy go do osobnej usługi, zamieniając adapter w procesie na adapter HTTP.

## Considered Options

- **Osobna usługa rekomendacji od pierwszego dnia** — odrzucona: oznacza koszt sieci i wdrożeń bez potrzeby. Zamiast tego zostawiamy furtkę w postaci interfejsu pakietu.
- **Uczenie online/strumieniowe** — odrzucone: nie radzi sobie z wycofywaniem Reakcji, a przy małej liczbie Reakcji na Odbiorcę przeliczenie modelu od zera jest tanie.

## Consequences

- Częstotliwość odświeżania Klastrów tematycznych ustala ADR-0007, a hosting workera ADR-0006.

## Aktualizacja 2026-10-05 (ADR-0008)

„W aplikacji” oznacza teraz w `apps/api`: ranking liczy backend w procesie, a klienci dostają go przez HTTP. Worker to ten sam kod backendu uruchomiony jako osobny proces.
