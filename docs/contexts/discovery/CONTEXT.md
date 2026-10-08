# Odkrywanie

Portal, na którym Odbiorca przegląda Terminy w kalendarzu i na mapie.

## Language

**Zapytanie** (`SearchQuery`):
Zdanie „Pokaż mi …” — zestaw filtrów (data, pora dnia, a w przyszłości kategoria i miejsce) wybranych przez Odbiorcę.
_Avoid_: wyszukiwanie, filtr (dla całości)

**Doba wydarzeń** (`EventDay`):
Dzień w kalendarzu portalu, trwający od 04:00 do 04:00 następnego dnia czasu Europe/Warsaw.
_Avoid_: dzień kalendarzowy, doba

**Grupa** (na mapie) (`MapGroup`):
Kilka pobliskich Terminów pokazanych na mapie jako jeden znacznik z liczbą.
_Avoid_: klaster

**Wpis programu** (`OccurrenceListing`):
Termin razem z jego Wydarzeniem i Miejscem, w kształcie, w jakim pokazuje go portal.

**Kalendarz miesiąca** (`MonthCalendar`):
Siatka miesiąca na stronie dla szkół, w której Odbiorca wybiera tydzień pokazany na afiszu; bieżący tydzień jest oznaczony.
_Avoid_: datepicker, kalendarz (dla afisza)

**Znacznik dnia** (`DayMarker`):
Kropki pod numerem dnia w Kalendarzu miesiąca: jedna na Wydarzenie przy 1–4, przy 5+ trzy kropki i licznik reszty; liczony po filtrach.
_Avoid_: badge, licznik
