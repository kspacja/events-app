---
status: accepted
---

# Telemetria na OpenTelemetry, błędy w Sentry

Portal i API zbierają ślady, metryki i logi przez OpenTelemetry i wysyłają je protokołem OTLP pod adres z `OTEL_EXPORTER_OTLP_ENDPOINT`. Backendu telemetrii jeszcze nie wybieramy: bez tej zmiennej nic nie wychodzi, a wybór dostawcy to zmiana konfiguracji, nie kodu. Błędy raportujemy do Sentry — tylko błędy, ślady zostają w OpenTelemetry — po ustawieniu DSN.

Powód: OpenTelemetry jest neutralny wobec dostawcy i wspierany przez Next.js i Node; przy małym ruchu na start nie chcemy wiązać się z backendem, zanim zobaczymy potrzeby. Sentry daje najwygodniejsze raporty błędów przeglądarki (mapy źródeł, grupowanie), czego zwykły backend śladów nie robi dobrze.

- Próbkowanie 50% śladów, zależnie od rodzica, żeby ślad portal → API był cały albo wcale.
- W telemetrii i raportach nie ma e-maili, adresów IP ani identyfikatorów Gościa (RODO).
- Nagrywanie sesji (Microsoft Clarity) działa tylko na przykładowych danych (MSW) i dopiero po zgodzie użytkownika — to obserwacja testowych użytkowników, nie telemetria produkcji.

## Considered Options

- **Grafana Cloud od razu** — odłożone: dobry kandydat na backend, ale wybór czeka na realny ruch.
- **Sam Sentry (błędy i ślady)** — odrzucony: ślady Sentry wiązałyby instrumentację z dostawcą; logi i metryki ma słabsze.

## Consequences

- Sentry uruchamiamy bez jego własnej konfiguracji OpenTelemetry, żeby nie dublował SDK.
- Do lokalnego sprawdzania śladów wystarczy eksporter do konsoli albo kolektor OTLP w Dockerze.
- Worker (etap 5) dostaje tę samą konfigurację; kontekst śladu przechodzi przez outbox.
