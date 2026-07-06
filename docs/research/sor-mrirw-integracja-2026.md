# Rejestr środków ochrony roślin w Polsce — dostępność danych (stan: lipiec 2026)

Raport na potrzeby integracji AgriClaw (guardrail zaleceń agenta AI — kontynuacja refactoru
„wsparcie decyzji", PR #14). Research: deep-web z weryfikacją na plikach źródłowych, 2026-07-06.

---

## 1. Źródło kanoniczne

**Wydawca:** Ministerstwo Rolnictwa i Rozwoju Wsi (MRiRW). Rejestr prowadzony na podstawie ustawy z 8 marca 2013 r. o środkach ochrony roślin. Jedyne prawnie wiążące źródło o dopuszczeniach ŚOR w Polsce.

| Zasób | URL | Co zawiera |
|---|---|---|
| Rejestr ŚOR (pliki XLSX) | https://www.gov.pl/web/rolnictwo/rejestr-rodkow-ochrony-roslin | Główny plik XLSX + wersja EN + paczka etykiet |
| Wyszukiwarka ŚOR | https://www.gov.pl/web/rolnictwo/wyszukiwarka-srodkow-ochrony-roslin | Wyszukiwanie po uprawie/agrofagu/substancji |
| Etykiety, zezwolenia, decyzje | https://www.gov.pl/web/rolnictwo/etykiety-srodkow-ochrony-roslin | PDF-y etykiet, alfabetycznie |

**Format i częstotliwość:** XLSX (~0,42 MB), aktualizacja kwartalna (art. 57 rozp. 1107/2009); na dane.gov.pl wydania miesięczne. **Wersjonowanie:** pełne — 262 wersje od 2018 (najnowsza 261.0 z 26.06.2026).

## 2. API i formaty — dane.gov.pl (właściwy kanał integracji)

REST API `api.dane.gov.pl` (v1.4). Dwa datasety:

### Dataset 981 — „Rejestr środków ochrony roślin"
- https://dane.gov.pl/pl/dataset/981 · zasoby: `https://api.dane.gov.pl/1.4/datasets/981/resources?sort=-created`
- 66 zasobów XLSX, wydanie miesięczne. Stały wzorzec pliku: `https://api.dane.gov.pl/resources/{id},{slug}/file`
- **Licencja: CC BY 4.0** (wymagana atrybucja). Uwaga: `modified` datasetu bywa mylące — patrzeć na `created` zasobów.

### Dataset 550 — „Wyszukiwarka środków ochrony roślin" ⭐ REKOMENDOWANY
- https://dane.gov.pl/pl/dataset/550 · 392 zasoby · **licencja CC0 1.0 (public domain, bez atrybucji)**
- Model **relacyjny**, 8 plików na wydanie, klucz `id_sor` (GUID): rejestr podstawowy (XLSX), rejestr zastosowań (XLSX), rejestr kart (CSV) + 5 słowników CSV (substancje aktywne, uprawy, agrofagi, grupy stosowania, rodzaje preparatów).
- Przykład (wydanie 26.06.2026): rejestr zastosowań → `https://api.dane.gov.pl/resources/2168279,rejestr-zastosowan-26062026-r/file`
- CSV odpytywalne wiersz-po-wierszu przez `/1.4/resources/{id}/data?page=...` (bez pobierania całości). **Kodowanie CSV: Windows-1250** → transkodować do UTF-8.

## 3. Zakres pól (zweryfikowane na plikach z 26.06.2026)

**rejestr kart** (1 wiersz = zezwolenie): `id_sor`, wnioskodawca, producent, `OstDecyzja`, `DataWydZezw`, **`Zawartosc_SBCZ`** (substancja czynna + zawartość), zwroty H/P (`KlToks_*`), `Zastosowanie` (prof./nieprof.), **`TerminDopuszczenia`** (ważność zezwolenia), **`TerminDopSprzedazy`**, `etykieta`, opakowania.

**rejestr zastosowań** (1 wiersz = zastosowanie): `id_sor`, **`uprawa`**, **`agrofag`**, **`dawka`** (tekst wolny, np. „Maksymalna dawka: 0,65 l/ha; Zalecana: 0,33-0,65 l/ha"), **`termin`** (tekst + fazy BBCH), `maloobszarowe`, `metody_stosowania`, `laczne_stosowanie`.

| Pole potrzebne agentowi | Jest? | Gdzie |
|---|---|---|
| Nazwa handlowa | ✅ | rejestr podstawowy |
| Substancja czynna | ✅ | `Zawartosc_SBCZ` + słownik |
| Uprawy / agrofagi | ✅ | rejestr zastosowań + słowniki |
| Dawki | ✅ (tekst wolny!) | `dawka` — wymaga parsowania |
| Terminy/fazy BBCH | ✅ (tekst wolny!) | `termin` |
| **Okres karencji** | ⚠️ **BRAK w danych strukturalnych** | tylko etykieta PDF |
| Ważność zezwolenia | ✅ | `TerminDopuszczenia` |

## 4. Etykiety PDF — linkowanie

PDF per produkt pod `https://www.gov.pl/attachment/{UUID}` — **UUID losowy, brak wzorca**. Kolumna `etykieta` wskazuje tylko podstronę alfabetyczną (10 podstron: `/web/rolnictwo/a-b1` … `/s-t1`). Aby mieć link produkt→PDF: **scraping 10 podstron → mapa nazwa→UUID**, odświeżana kwartalnie. Brak oficjalnego API etykiet.

## 5. Źródło uzupełniające — EU Pesticides Database (wycofane substancje!)

- Portal: https://food.ec.europa.eu/plants/pesticides/eu-pesticides-database_en — status zatwierdzenia substancji czynnych w UE (rozp. 1107/2009), MRL.
- **API:** DG SANTE Developer Portal — https://developer.datalake.sante.service.ec.europa.eu/ (wymaga klucza + `api-version`).
- Wartość: substancja **non-approved/expired w UE** = ostrzeżenie nawet gdy polski `TerminDopuszczenia` jeszcze trwa (okresy wyprzedaży). Dokładnie ten mechanizm wyłapałby chlorotalonil, który usunęliśmy ręcznie w PR #14.

## 6. Jak integrują inni

- **Agroradar24 „Środki Ochrony Roślin Polska"** — aplikacja zbudowana w całości na datasecie 550, oficjalny showcase na dane.gov.pl → dowód wykonalności modelu.
- SatAgro/Agrivi: brak publicznych śladów integracji z rejestrem — **przewaga do wzięcia**.
- Kontekst: **od 1.01.2026 obowiązkowa elektroniczna ewidencja stosowania ŚOR** — walidacja zabiegów względem rejestru staje się realną potrzebą rynkową (i punktem do wniosku AGROSTRATEG).

## 7. Plan integracji dla AgriClaw (3 kroki)

**Krok 1 — Import (job miesięczny):** wykryj najnowsze wydanie datasetu 550 (`?sort=-created`), pobierz 8 plików, transkoduj CSV Win-1250→UTF-8, załaduj do tabel z kluczem `id_sor`, wersjonuj wydania (audyt zaleceń). Równolegle status substancji z EU DB (DG SANTE).

**Krok 2 — Walidacja zaleceń agenta (guardrail):** przed rekomendacją produktu: (a) `TerminDopuszczenia ≥ dziś` i `TerminDopSprzedazy` nie minął; (b) istnieje wiersz zastosowań dla pary uprawa+agrofag; (c) dawka agenta ⊆ zakres z `dawka` (parsowanie regex l/ha, kg/ha, zakresy); (d) faza BBCH zgodna z `termin`; (e) karencja: **zawsze flaga „sprawdź na etykiecie"** — nie zmyślać; (f) substancja non-approved w UE → ostrzeżenie.

**Krok 3 — Link do etykiety:** scraping 10 podstron → cache mapy nazwa→`attachment/{UUID}`, odświeżanie kwartalne; w każdej rekomendacji bezpośredni link do PDF (fallback: podstrona alfabetyczna). Etykieta = jedyne wiążące źródło karencji i środków ostrożności.

## Ryzyka
1. Karencja tylko w PDF — agent musi odsyłać, nie generować.
2. Dawki/terminy = tekst wolny — parsowanie z testami na próbce.
3. UUID etykiet niestabilne — scraping + cache + monitoring.
4. Licencje: baza = 550 (CC0); przy 981 wymagana atrybucja MRiRW.
5. Windows-1250 w CSV.
6. Świeżość: automat + monitoring nowych wydań (zaległy import = ryzyko rekomendacji wycofanego środka).
