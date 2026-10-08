# Etap 6 — Import i Kanały

**Cel:** Organizator dodaje wiele Wydarzeń naraz — plikiem CSV albo Kanałem, który portal sam pobiera.

**Zależy od:** etapu 5 — cykliczne pobieranie Kanałów działa w `apps/worker`.

## Zakres

- Import CSV (przez Zgłoszenia, jak formularz).
- Kanał: nasz schemat JSON (wersjonowany) pod adresem podanym przez Zaufanego Organizatora.

## Kanał — ustalenia

- **Pobieranie:** cykliczne, interwał ustawia Organizator (może też wyłączyć). Webhook tylko wymusza pobranie — treść zawsze z Kanału.
- **Webhook:** adres per Kanał z tajnym tokenem w URL (`/kanaly/{id}/ping/{token}`), token do wygenerowania na nowo w Studio. Bez HMAC — ma wystarczyć wklejenie URL-a we wtyczce WordPressa czy Zapierze. Limit: najwyżej jedno pobranie na minutę na Kanał.
- **Moderacja:** Kanał tylko dla Zaufanych Organizatorów; publikacja bez Zgłoszenia, moderacja wybiórcza i post-factum (Moderator ukrywa Wydarzenie albo wstrzymuje Kanał).
- **Źródło prawdy:** Kanał nadpisuje zmiany; Wydarzenie, które zniknęło z Kanału → przyszłe Terminy odwołane.
- **Przypięte pola:** pole poprawione w Studio nie jest nadpisywane przez Kanał; Organizator może przypięcie zdjąć.
- **Identyfikator:** każde Wydarzenie ma stałe `id` nadane i pilnowane przez Organizatora; brak albo duplikat → Wydarzenie odrzucone z komunikatem.
- **Media:** zdjęcie główne kopiujemy do naszego storage (typ, rozmiar, resize, deduplikacja po hashu); pozostałe zdjęcia i wideo, także z opisu, linkujemy przez nasze proxy, tylko z dozwolonych domen.
- **Opis:** prawdopodobnie ograniczony markdown.
- **Limity na start (robocze):** Kanał do 20 MB i 5 000 Wydarzeń, timeout pobrania 60 s, zdjęcie główne do 15 MB.
- **Błędy pobierania:** ponowienia z rosnącym odstępem, zostaje ostatnia poprawna wersja; błąd widoczny w Studio, po kilku nieudanych próbach z rzędu e-mail.

## Otwarte

- Podzbiór markdownu w opisie i co z HTML-em, jeśli przyjdzie.
- Komunikacja z Organizatorem (proste powiadomienia w Studio + e-mail).
- Ostateczne limity.

## Kryterium ukończenia

Kanał Zaufanego Organizatora pobrany cyklicznie i przez webhook publikuje, zmienia i odwołuje Wydarzenia; Przypięte pola przeżywają pobranie; błąd pobrania widzi Organizator.
