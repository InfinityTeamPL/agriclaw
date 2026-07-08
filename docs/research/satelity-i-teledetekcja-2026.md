# Satelity i teledetekcja w AgriClaw — audyt + research rynku (2026)

**Data:** lipiec 2026 · **Metoda:** audyt kodu (`src/lib/satellite/*`) + deep-research (5 kątów, 25 twierdzeń potwierdzonych adwersaryjnie 3-0, 0 obalonych, źródła w większości recenzowane).

**Werdykt w jednym zdaniu:** darmowy szkielet Copernicus/NASA, którego już używamy, jest właściwym wyborem i można go wycisnąć **dużo mocniej, zanim za cokolwiek zapłacimy** — największy niewykorzystany zasób to Sentinel-1 (radar) do wilgotności gleby na poziomie pola; płatna wysoka rozdzielczość ma sens tylko punktowo i lepiej kupować ją na żądanie niż w subskrypcji.

---

## 1. Co mamy dziś (audyt kodu)

Wszystko przez **jednego dostawcę — Copernicus Data Space Ecosystem (CDSE) Sentinel Hub Process API** (OAuth2, token cache'owany), plus Planet i Open-Meteo osobno.

| Źródło | Co liczymy | Rozdz. / rewizyta | Plik | Status |
|---|---|---|---|---|
| **Sentinel-2 L2A** (optyka) | NDVI, NDRE, NDWI, SAVI — 4 indeksy w 1 zapytaniu; true-color; heatmapy PNG | 10 m (NDVI), 20 m (NDRE B05/SWIR B11); ~5 dni | `copernicus.ts` | ✅ rdzeń |
| maska chmur **SCL** | per-piksel odrzuca chmury/cień/cirrus/śnieg; wybór najmniej zachmurzonej sceny | — | `copernicus.ts` | ✅ |
| **Sentinel-1 GRD** (radar) | VV/VH [dB] + RVI, terrain-corrected — widzi przez chmury | ~10 m; ~6 dni | `copernicus.ts` | ✅ (tylko obraz/RVI, bez wilgotności) |
| **Landsat 8/9** (termika) | temperatura powierzchni (LST °C) | 100 m→30 m; 8 dni combined | `copernicus.ts` | ✅ |
| **Planet PSScene** | tylko darmowe thumbnaile 3 m (RGB podgląd; pełne GeoTIFF kosztują kredyty — nie używamy) | 3 m; dziennie | `planet.ts` | 🟡 opcjonalne, płytkie |
| **SMAP** (wilgotność gleby) | — | 9–36 km | `smap.ts` | 🔴 **wyłączone** (zwraca null) |
| **Open-Meteo** | pogoda, ET0 (FAO), wilgotność gleby 0–7 cm (model ECMWF), okna oprysku | model ~11 km | `weather.ts` | ✅ (zastępuje SMAP) |

**Mocne strony kodu:** maska SCL, fuzja radar+optyka (krytyczna dla PL — ~200 dni chmur/rok), red-edge (NDRE) pod azot, oszczędność quoty (4 indeksy/zapytanie), wybór najmniej zachmurzonej sceny.
**Słabe strony:** (1) brak cache warstw — każde wejście na mapę = świeże zapytanie CDSE; (2) Sentinel-1 używany tylko jako obraz/RVI, **nie liczymy z niego wilgotności gleby**; (3) wilgotność gleby to model pogodowy, nie pomiar; (4) jeden dostawca = jeden punkt awarii.

---

## 2. Kluczowe ustalenia z researchu (wszystkie potwierdzone 3-0)

### Wilgotność gleby: Sentinel-1, nie SMAP
- Decyzja o **wyłączeniu SMAP była słuszna**: natywne produkty 36 km (L2_SM_P) / 9 km (L2_SM_P_E) = 81 km²/piksel = setki pól; nawet fuzja Sentinel-1/SMAP to 3 km — wciąż za grubo na pojedyncze pole/VRA.
- **Sentinel-1 (który już pobieramy!) daje wilgotność na poziomie pola** (~15 m piksel, RMSE 0,098 cm³/cm³) — bije SMAP-AM (0,139), SMAP-PM (0,160) i SMOS (0,129).
- Fuzja **Sentinel-1 VV + Sentinel-2 NDVI** metodą „consecutive-day" → RMSE ~0,059 vs 0,087 dla prostej detekcji zmian, **bez kalibracji per-lokalizacja**.
- Zastrzeżenie: dokładność zależy od metody i korekcji wegetacji, spada pod gęstym łanem / na mokrej glebie → traktować jako **sygnał względny/trend**, nie absolutną wartość objętościową.
- Źródła: Baghdadi 2017 (MDPI Sensors), Agric. Water Manag. 2023, PMC12115452 (2025), smap.jpl.nasa.gov.

### Ewapotranspiracja (ET) z darmowej termiki
- Fuzja **ECOSTRESS (~70 m, rewizyta 1–5 dni) + Landsat (~100 m termika, 16 dni) + VIIRS (375 m, ~dziennie)**, wyostrzona (DMS + STARFM) → **dzienna ET 30 m**, MAE 0,52–0,69 / RMSE 0,69–0,94 mm/dobę.
- ⚠️ ECOSTRESS PT-JPL ma **systematyczny dodatni bias** (zawyża ET) → używać jako trend po korekcie, nie jako absolutną liczbę zużycia wody.
- Kosztowne inżyniersko (wyostrzanie termiki + fuzja czasowa). Źródło: Irrigation Science 2022 (USDA-ARS/GRAPEX), Agric. Water Manag. 2022.

### Rozdzielczość: Sentinel-2 10 m bije PlanetScope 3 m
- Kontrintuicyjne, ale potwierdzone: **bogactwo spektralne + radiometria Sentinel-2 (red-edge + SWIR) przewyższa wyższą rozdzielczość 3 m PlanetScope** w szacowaniu plonu i zmienności wewnątrz pola.
- Heliyon 2023 (soja): S2 R² 0,73–0,90 > PlanetScope 0,70–0,87 > Landsat 30 m 0,43–0,76. Powód: więcej pasm + SWIR, których PlanetScope nie ma.
- Wniosek: **utrzymać Sentinel-2 jako główny silnik NDVI/NDRE** — nie zakładać, że „drożej = lepiej".

### Kiedy płatna wysoka rozdzielczość ma sens
- Tylko do konkretnych zadań: **ostre granice stref w polu (VRA)** i **wypełnianie luk chmurowych** na nieregularnych, często zachmurzonych polach.
- PlanetScope wymaga **sezonowej rekalibracji radiometrycznej do Sentinel-2** (regresja liniowa + histogram matching), zanim jego NDVI/NDRE będzie wiarygodny.
- **Kupować na żądanie, nie w subskrypcji:** SkyFi (odsprzedaje Planet/Satellogic/ICEYE/Umbra/Vantor/Geosat) — bez subskrypcji i minimum: **archiwum optyczne od ~15 $/scenę, tasking od ~200 $/scenę** (ceny bazowe, model za km²).

### Platforma/API (decyzja architektoniczna)
- **CDSE Sentinel Hub free tier = 10 000 Processing Units/miesiąc** (1 PU = kafel 512×512, 3 pasma, ≤16-bit; reset miesięczny, bez przenoszenia).
- Dane komercyjne (very-high-res) wyceniane: misja × km² × liczba akwizycji (każda dodatkowa akwizycja ~podwaja koszt).
- ⚠️ **Google Earth Engine free tier jest prawnie niedostępny dla komercyjnego SaaS** — wymaga płatnej licencji. → nasz darmowy szkielet to słusznie CDSE/Sentinel Hub (albo AWS Open Data / Microsoft Planetary Computer); GEE odpada.

---

## 3. Tabela porównawcza źródeł

| Źródło | Typ | Rozdz. | Rewizyta | Pasma/uwagi | Koszt / dostęp |
|---|---|---|---|---|---|
| **Sentinel-2** | optyka | 10 m (RE/SWIR 20 m) | ~5 dni | 13 pasm, 3× red-edge + SWIR — najlepszy all-round | darmowe (CDSE) |
| **Sentinel-1** | radar C | ~10 m | ~6 dni | VV/VH; przez chmury; **wilgotność gleby na polu** | darmowe (CDSE) |
| **Landsat 8/9** | optyka+termika | 30 m (termika 100 m) | 16 dni (8 combined) | LST, ET | darmowe |
| **ECOSTRESS** | termika | ~70 m | 1–5 dni | ET (bias dodatni) | darmowe (NASA) |
| **VIIRS** | optyka/termika | 375 m | ~dziennie | fuzja ET | darmowe |
| **SMAP** | radiometr | 9–36 km | 2–3 dni | za grube na pole | darmowe (ale bezużyteczne per-pole) |
| **PlanetScope** | optyka | 3 m | ~dziennie | brak SWIR; wymaga rekalibracji do S2 | płatne (~15 $/scena archiwum via SkyFi) |
| **SkySat / tasking** | optyka | 0,5 m | na żądanie | strefy VRA, luki chmur | ~200 $/scena (SkyFi) |
| **Airbus Pléiades Neo** | optyka | 0,3 m | na żądanie | najwyższa rozdz. | płatne, wyższe progi |
| **ICEYE / Capella / Umbra** | radar SAR | <1 m | na żądanie | SAR na żądanie | płatne (SkyFi) |

---

## 4. Rekomendacje priorytetyzowane dla AgriClaw

**Za darmo, wysoki zwrot (zrobić przed jakąkolwiek płatnością):**
1. **Wilgotność gleby z Sentinel-1** (fuzja S1 VV + S2 NDVI, metoda consecutive-day) — reaktywować funkcję „wilgotność" na realnym pomiarze satelitarnym zamiast modelu pogodowego. Największy niewykorzystany zasób; dane już pobieramy. Podawać jako trend/względny sygnał (uczciwie, zgodnie z zasadą „nie udawaj pomiaru").
2. **Cache warstw** (kafle NDVI/heatmapy) — konieczny przed skalą; dziś każde wejście na mapę pali PU/limit CDSE.
3. **ET z termiki** (Landsat/ECOSTRESS) jako trend do doradztwa nawodnieniowego — z korektą biasu ECOSTRESS; wariant pełnej fuzji 30 m odłożyć (kosztowny inżyniersko).

**Za co warto zapłacić — ale punktowo, na żądanie:**
4. **Wysoka rozdzielczość (SkyFi ~15 $/archiwum, ~200 $/tasking)** tylko do: ostrych granic stref VRA i wypełniania luk chmurowych na trudnych polach. Nie subskrypcja. Jeśli PlanetScope — najpierw rekalibracja do S2.

**Architektura:**
5. Zostać na **CDSE/Sentinel Hub** jako darmowym szkielecie; **nie ruszać Google Earth Engine** (nielegalny dla komercyjnego SaaS bez płatnej licencji). Rozważyć AWS Open Data / Planetary Computer jako drugie źródło (redundancja + niższy koszt jednostkowy przy skali).

---

## 5. Koszt na skali — MODEL (nie cytat, do zweryfikowania pomiarem)

> Research potwierdził ceny jednostkowe (10 000 free PU/mies., skalowanie per-PU, SkyFi 15/200 $), ale **nie podał gotowej liczby na pole/miesiąc** — poniżej własny szacunek, do potwierdzenia realnym zużyciem PU.

- 1 pełna analiza pola (multi-index 4-band FLOAT32 512² + true-color + heatmapa 1024²) ≈ **5–10 PU** (FLOAT32/32-bit i większe kafle liczą się drożej niż bazowy 1 PU).
- **100 gospodarstw** (~3 pola × odświeżanie tygodniowe) ≈ 6 000–12 000 PU/mies. → **na granicy/tuż powyżej darmowego 10k**. Z cache'owaniem → **realnie za darmo**. To pokrywa Beta 100.
- **3 000 gospodarstw** → ~180 000+ PU/mies. → **daleko poza free** → płatna subskrypcja Sentinel Hub (rząd setek € /mies.) albo self-host z AWS Open Data/Planetary Computer + agresywny cache. Koszt danych staje się realną pozycją w P&L dopiero tutaj.

**Wniosek kosztowy:** do Beta 100 dane są praktycznie darmowe (warunek: cache). Przy skali komercjalizacji trzeba świadomie wybrać model (subskrypcja SH vs self-host) — to decyzja na etap 1 000+ gospodarstw, nie teraz.

---

## 6. Ryzyka i zastrzeżenia
- Dokładności (wilgotność, plon, ET) pochodzą z badań jednostanowiskowych/jednosezonowych (soja HU, ryż IT, pszenica IN, winnice CA) — ustalają wykonalność i ranking, **nie gwarantują dokładności na polach PL** → potrzebna walidacja lokalna (to samo w sobie jest tematem badawczym do AGROSTRATEG/WP3).
- Wilgotność z S1 zależna od metody i wegetacji; ET z ECOSTRESS z biasem → oba jako trend.
- Ceny komercyjne (SkyFi, Sentinel Hub) są zmienne w czasie — potwierdzić przy zakupie.

## 7. Źródła (primary, o ile nie zaznaczono)
- SMAP rozdzielczości — smap.jpl.nasa.gov/data
- Wilgotność S1: Baghdadi 2017 (PMC5621168), Agric. Water Manag. 2023 (S0378377423002871), PMC12115452 (2025)
- ET termika: Irrigation Science 2022 (10.1007/s00271-022-00799-7); bias ECOSTRESS: Agric. Water Manag. 2022 (S0378377422002530)
- Rozdzielczość S2 vs PlanetScope: Heliyon 2023 (PMC10319221); rekalibracja: MDPI RS 2024 (16/21/3921)
- Ceny na żądanie: skyfi.com/en/pricing
- Platforma/PU: dataspace.copernicus.eu (PU calculator), sentinel-hub.com/faq, cloud.google.com/earth-engine/pricing
