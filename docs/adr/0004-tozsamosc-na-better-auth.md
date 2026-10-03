---
status: accepted
---

# Tożsamość na Better Auth we własnym Postgresie

Konta i logowanie obsługujemy biblioteką Better Auth, a jej dane trzymamy w naszym Postgresie, w schemacie kontekstu Tożsamość (ADR-0002). Better Auth jest na licencji MIT i nie ma limitów kont, więc płatna wersja zarządzana nie jest nam potrzebna. Jedyny realny koszt to wysyłka e-maili: linki logowania wymagają dostawcy, np. Resend albo Amazon SES.

- Są trzy osobne rodzaje kont: Odbiorca, Organizator i Moderator. Osoba, która jest i Odbiorcą, i Organizatorem, ma dwa konta.
- Odbiorca loguje się linkiem wysłanym e-mailem (magic link).
- Organizator rejestruje się sam, bez weryfikacji konta. Moderacji podlegają Wydarzenia (przez Zgłoszenia), a nie konta.
- Moderator powstaje wyłącznie z zaproszenia; nie ma dla niego rejestracji.
- Dostęp Organizatora przez API (Import, integracje z systemami biletowymi) opiera się na kluczach API przypisanych do konta Organizatora. Endpointy to route handlery w `apps/studio`.

## Considered Options

- **Auth.js** — odrzucony: zaproszenia, linki logowania i 2FA wymagałyby więcej ręcznej pracy.
- **Clerk / Auth0** — odrzucone: koszt SaaS rośnie wraz z liczbą kont, a dane kont leżą u dostawcy.
- **Keycloak** — odrzucony: za dużo pracy operacyjnej dla 1–2 osób.
