# Arkiv ETHRome — raport z pretestu

**Wynik: misja 02 „Built to expire” wykonana na Tiramisu.** Powstał Hacker Pulse: tablica dostępności stanowisk. Opis stanowiska żyje dłużej, a obecność wygasa po 15 blokach. Status offline wynika z braku encji w odpowiedzi Arkiva, nie z timera ani usunięcia.

## Dowód

- Stanowisko zapisane poprawnie; obecność zapisana poprawnie.
- Blok **226457**: zapytanie zwraca obecność.
- Blok **226470**: nadal ją zwraca.
- Blok **226471**: to samo zapytanie jej nie zwraca; stanowisko pozostaje.
- Receipt i niezależny odczyt encji zgodnie wskazały expiresAt = **226471**.
- Zapisano 14 snapshotów oraz receipts: [pełny dowód](evidence/live-run.json).
- Koszt dwóch poprawnych zapisów: **0.000222752000445504 testowego GLM**.
- Koszt wraz z jedną odrzuconą transakcją: **0.000272562000545124 testowego GLM**.
- Z wpłaconych 0.05 GLM pozostało **0.049727437999454876 GLM**. Nie wykonano zwrotnego przelewu.

## Najważniejsze zgłoszenia dla zespołu Arkiv

1. **Priorytet wysoki: rozjazd walidacji nazw atrybutów.** SDK dopuszcza `stationId`, sieć odrzuca transakcję za wielką literę `I`. Treść błędu jednocześnie wymienia A–Z jako dozwolone. Użytkownik traci gas mimo przejścia walidacji SDK. Obejście `station_id` potwierdzono udanymi zapisami.
2. **Priorytet średni: brak spójnego quickstartu dla eventowego SDK.** MCP rekomenduje 0.8.0-dev.4, ale jego README blokuje jako historyczne (instrukcja ^0.6.0). Odczyt źródeł pozwolił kontynuować, lecz nowemu uczestnikowi utrudnia start.
3. **Priorytet niski: workflow MCP jest po hiszpańsku** przy angielskiej stronie i materiałach.
4. **Priorytet średni: nieaktualny opis expiresAt w komentarzu SDK.** Komentarz mówi o przybliżeniu, implementacja pobiera wartość z eventu; w naszej próbie receipt i odczyt były zgodne. Nie stwierdzono błędu samego wygasania.

Szczegóły, odtworzenie, zakres i dowody: [friction.md](friction.md).

## Demonstracja — około minuty

1. Otwórz Hacker Pulse.
2. Kliknij **View before**: widok zapisanej odpowiedzi sieci, blok 226457, stanowisko Available.
3. Kliknij **View after**: blok 226471, Offline, opis stanowiska nadal widoczny.
4. Pokaż niezmienione zapytanie oraz **Open verified run JSON** lub **Export evidence**.
5. **Live** wraca do aktualnych odczytów. Aby powtórzyć na swoim portfelu: Connect wallet → Add station → Go available · 15 blocks.

Zrzuty [przed](evidence/screenshots/before.png) i [po](evidence/screenshots/after.png) pokazują jawnie oznaczony zapisany wynik sieci. Nie udają nowego przebiegu live.

## Zakres weryfikacji

Siedem testów lokalnych, kontrola TypeScript, lint własnego kodu i produkcyjny build przeszły. Lint pomija niezmienione komponenty dostarczone przez szablon. Potwierdzono odczyt SDK, zapis z lokalnego portfela, naturalne wygaśnięcie, zgodność expiry, przetrwanie stanowiska i brak delete. Przetestowano odczyt w przeglądarce oraz kontrolki View before / View after / Live. Metamask w aplikacji wymaga jeszcze interaktywnej próby użytkownika; faucet, access keys, WebSocket i testy obciążeniowe nie były przedmiotem tej misji. Reguły kwalifikacji R1–R5 pozostają robocze; nie zgłoszono projektu oficjalnie ani nie opublikowano repo jako publicznego.
