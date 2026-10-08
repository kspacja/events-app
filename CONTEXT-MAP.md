# Mapa kontekstów

Dokumentacja domeny jest po polsku, kod po angielsku: każde pojęcie w słownikach ma swoją nazwę w kodzie w nawiasie, np. **Odbiorca** (`Attendee`).

## Konteksty

- [Odkrywanie](./docs/contexts/discovery/CONTEXT.md) — Odbiorca przegląda i filtruje Terminy w kalendarzu i na mapie
- [Rekomendacje](./docs/contexts/recommendations/CONTEXT.md) — dobiera Odbiorcy Wydarzenia na podstawie jego Reakcji
- [Wydarzenia](./docs/contexts/events/CONTEXT.md) — Organizator dodaje Wydarzenia, Moderator je dopuszcza do publikacji
- [Tożsamość](./docs/contexts/identity/CONTEXT.md) — konta Odbiorców, Organizatorów i Moderatorów

## Relacje

- **Wydarzenia → Odkrywanie**: Odkrywanie pokazuje tylko opublikowane Wydarzenia i ich Terminy
- **Wydarzenia → Rekomendacje**: opublikowane Wydarzenie trafia do Rekomendacji, które przypisują mu Klaster tematyczny
- **Odkrywanie → Rekomendacje**: Reakcje Odbiorcy z portalu zasilają Rekomendacje
- **Tożsamość → wszystkie**: pozostałe konteksty znają osoby tylko przez identyfikator konta
