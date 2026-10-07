# AgriClaw — przegląd UI/UX, 7 października 2026

## Stan i zakres

Audyt wykonano na bazie `c92db6d`, w osobnym worktree i na gałęzi `codex/fields-monitoring-ux`. Główny checkout pozostawiono drugiemu agentowi. Jego bieżących zmian nie kopiowano ani nie nadpisywano.

Projekt ma już mapy Sentinel-2 (NDVI, NDRE, NDWI, SAVI), historię i backfill, radar i termikę, pogodę i okna oprysku, BBCH, scouting GPS ze zdjęciami i AI, księgę polową z PDF, zgodność ARiMR, push oraz AgroAgenta. Kolejne usprawnienia powinny łączyć te funkcje w krótszą drogę od obserwacji do działania.

## Zrealizowane poprawki

- **Katalog pól:** panel pokrycia rzeczywistymi pomiarami z ostatnich 14 dni. Filtry: wszystkie, ostatnie 14 dni, do sprawdzenia, demo. „Do sprawdzenia” opisuje dane, a nie diagnozę uprawy.
- **Wiarygodność:** źródło i data zapisanej wartości NDVI. Najnowsza rzeczywista scena `sentinel-2` ma pierwszeństwo przed kompozytem `sentinel-2-history` i symulacją `mock`. Archiwum nie podaje syntetycznej daty jako daty sceny. Błędne daty i wartości spoza [-1, 1] nie wyglądają jak aktualny pomiar.
- **Obsługa:** sortowanie zaczyna od pól bez pomiaru i ze starszymi danymi. Wyszukiwanie po nazwach pól i upraw, również bez znaków diakrytycznych. Widoczne etykiety, stan wyników dla czytnika ekranu, reset filtrów i użyteczny ekran bez wyników. Zapamiętywany widok i kolejność; wyszukiwane nazwy nie są przechowywane.
- **Telefon:** data pomiaru pozostaje widoczna. Układ sprawdzono przy 320 px; nazwy mogą się zawijać, NDVI ma osobną kolumnę. Podstawowe filtry i przełączniki mają obszary dotyku co najmniej 44 px oraz widoczny fokus.
- **Scouting:** popup korzysta z DOM i `textContent`, zamiast składać HTML z notatek. Walidacja zdjęć zachowuje JPEG/PNG/WebP base64 i bezpieczne URL, odrzuca SVG i niebezpieczne schematy. Intensywność ma polskie opisy.
- **Pobieranie:** lista odczytów pobiera tylko wartości potrzebne do monitoringu.

Próg 14 dni jest jawnym filtrem wieku danych, nie agronomicznym stwierdzeniem, że odczyt wystarcza do decyzji. Miniatura może przedstawiać nowszą warstwę niż zapisana wartość NDVI; interfejs to wyjaśnia. Nie dodano automatycznych zabiegów ani nowych zaleceń agronomicznych.

## Kierunek wizualny

Zachowano tożsamość AgriClaw: jasne tło, humusowy atrament, spektralną zieleń i kartograficzne miniatury granic pól. Amber oznacza potrzebę sprawdzenia danych, fiolet odróżnia demo. Space Grotesk pozostaje krojem nagłówków, IBM Plex Sans tekstu, a liczby używają cyfr tabelarycznych. Wyróżnia się jeden element: pasek pokrycia pomiarami z bezpośrednimi filtrami. Usunięto kaskadę animowanych wejść kart.

## Propozycje rozwoju — jeszcze niewdrożone

| Kierunek | Doświadczenie | Zakres pierwszej wersji |
| --- | --- | --- |
| Mapa przed/po | Suwak między dwiema datami; wspólny kadr, legenda, data i jakość obu scen | Średni. Endpoint warstw musi obsłużyć wybór sceny; kontrola transferu i pamięci telefonu. |
| Plan działań na dziś | Trzy priorytety z alertów, każdy prowadzi do obserwacji, mapy lub szkicu zabiegu | Mały/średni. Powiązania, deduplikacja, odkładanie i zamykanie spraw; jawne reguły priorytetów. |
| AgroAgent rozumiejący miejsce | Zaznaczenie strefy → pytanie o ten obszar; odpowiedź odsyła do danych i obserwacji | Średni. Geometria i istniejące dane są dostępne; statystyki rastra dla dowolnej strefy wymagają dodatkowego przetwarzania. |
| Pakiet terenowy offline | Przygotowanie pól przed wyjazdem, lokalne szkice zdjęć i obserwacji, kolejka wysyłania | Duży. IndexedDB, konflikty, limity pamięci, rozdzielenie użytkowników i ponawianie. Synchronizacja w tle potrzebuje alternatywy w interfejsie. |
| Oś historii połączona z mapą | Pomiary, scouting, pogoda i zabiegi na jednej osi; zmiana daty aktualizuje mapę | Średni. Wspólny model zdarzeń i dat; korelacji nie należy przedstawiać jako dowodu działania zabiegu. |

Podstawy techniczne: [MapLibre Compare](https://github.com/maplibre/maplibre-gl-compare), [wybór obiektów mapy](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#queryrenderedfeatures), [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), [Background Sync i zgodność przeglądarek](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API).

Proponowana kolejność: plan działań → porównanie map → kontekst miejsca dla AgroAgenta → pełny tryb terenowy.

## Problemy poza zakresem tej zmiany

- `TodayBriefing.tsx` może pokazać „Wszystkie pola w normie” przy braku analiz i zerowej liczbie alertów.
- Niedostępność prognozy oprysku może wyglądać jak brak dobrego okna pogodowego.
- `/offline` obiecuje lokalne analizy, choć service worker nie zapisuje API i dashboardu; brak IndexedDB.
- Modal scoutingu potrzebuje pełnej obsługi dialogu i klawiatury.
- Część roadmapy wymienia jako brakujące funkcje już istniejące.

## Weryfikacja

- **323 testy, 35 plików — wszystkie przeszły.** W tym 16 testów źródeł/świeżości, 19 testów popupów oraz 7 scenariuszy katalogu pól.
- Po końcowym dopracowaniu wyglądu i tekstów ponownie przeszło 7 scenariuszy katalogu.
- TypeScript przeszedł z klientem Prisma wygenerowanym osobno z bieżącego schematu. Nie nadpisano wspólnych zależności drugiego agenta; nie wykonano migracji ani połączenia z produkcyjną bazą.
- Podgląd przeglądarkowy renderuje rzeczywisty `FieldsList` na przykładowych danych; nawigacja jest uproszczona do linków. Sprawdzono filtrowanie, wyszukiwanie, puste wyniki, zmianę widoku i 320 px. To nie zastępuje zalogowanego przepływu z bazą.
- Pełnego produkcyjnego buildu i przepływów z bazą nie weryfikowano.
