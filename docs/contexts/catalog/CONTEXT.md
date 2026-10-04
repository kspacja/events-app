# Katalog

Źródło prawdy o Wydarzeniach: co się dzieje, gdzie i kiedy.

## Language

**Wydarzenie** (`Event`):
Coś, na co można pójść — koncert, spektakl, cykl jazzowych piątków; ma jednego lub wiele Terminów.
_Avoid_: event, impreza, ogłoszenie

**Termin** (`Occurrence`):
Konkretne wystąpienie Wydarzenia w danym dniu, o danej godzinie i w danym Miejscu.
_Avoid_: wystąpienie, occurrence, data

**Miejsce** (`Venue`):
Lokal lub przestrzeń, w której odbywa się Termin; należy do Organizatora, który je wprowadził.
_Avoid_: lokalizacja, adres, organizator (w znaczeniu z PoC)

**Kategoria** (`Category`):
Pozycja z zarządzanej listy rodzajów Wydarzeń (np. muzyka, film), którą Organizator przypisuje Wydarzeniu; lista zmienia się w czasie.
_Avoid_: typ, tag, Klaster tematyczny

**Cena** (`Price`):
Informacja o koszcie wstępu na Termin: bezpłatny albo kwota od–do; jej brak oznacza, że Organizator jej nie podał.
_Avoid_: bilet, koszt

## Publikacja

**Zgłoszenie** (`Submission`):
Wersja Wydarzenia przekazana Moderatorowi do decyzji: nowe Wydarzenie albo Zmiana istotna opublikowanego.
_Avoid_: draft, wniosek, prośba

**Zmiana drobna** (`MinorChange`):
Zmiana opublikowanego Wydarzenia, która wchodzi od razu bez moderacji (np. godzina Terminu, cena).
_Avoid_: poprawka, edycja

**Zmiana istotna** (`MajorChange`):
Zmiana opublikowanego Wydarzenia, która wymaga Zgłoszenia (np. tytuł, opis, zdjęcie, miejsce); do decyzji Moderatora widoczna jest poprzednia wersja.
_Avoid_: duża zmiana, edycja

**Import** (`Import`):
Dodanie wielu Wydarzeń naraz przez Organizatora — z pliku albo przez API; każde importowane Wydarzenie przechodzi przez Zgłoszenie tak samo jak z formularza.
_Avoid_: upload, synchronizacja, scraping
