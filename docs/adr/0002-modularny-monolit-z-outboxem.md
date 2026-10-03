---
status: accepted
---

# Modularny monolit: jeden Postgres, schemat na kontekst, outbox

W pierwszym roku skala jest mała (kilka miast, do ok. 10 tys. Wydarzeń miesięcznie, do ok. 50 tys. Odbiorców), a zespół liczy 1–2 osoby. Dlatego konteksty Odkrywanie, Rekomendacje, Katalog i Tożsamość budujemy jako pakiety jednego modularnego monolitu na wspólnej bazie Postgres, a nie jako mikroserwisy. Pakiety wywołują się nawzajem w tym samym procesie, przez swój interfejs.

- Każdy kontekst ma w Postgresie własny schemat. Inne konteksty odwołują się do kont i Wydarzeń wyłącznie przez identyfikator.
- Pracę asynchroniczną (np. „Wydarzenie opublikowane” → policzenie embeddingu → przypisanie Klastra tematycznego) przekazujemy przez tabelę outbox/zdarzeń w Postgresie, którą czyta `apps/worker`.
- Embeddingi trzymamy w Postgresie przez pgvector.

## Considered Options

- **Mikroserwisy z bazą na kontekst i brokerem wiadomości** — odrzucone jako armata na wróbla przy tej skali i wielkości zespołu. Doszłyby wywołania sieciowe, transakcje rozproszone i narzut operacyjny, a nic byśmy na tym nie zyskali.

## Consequences

- To wymaga dyscypliny: poza interfejsem kontekstu nie ma joinów między schematami. Pilnujemy tego regułami lint/importów, bo wspólna baza sama tego nie wymusi.
- Outbox w Postgresie zastępuje broker. Jeśli kiedyś wydzielimy kontekst do osobnej usługi, granice schematów i komunikacja przez identyfikatory już będą gotowe.
