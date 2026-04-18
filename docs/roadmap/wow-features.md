# WOW features — co zaskoczy polskiego rolnika

Priorytet = realna wartość, nie pokazuje "posiadamy dane sprzed 2 lat".

## 1. Import pól z ARiMR eWniosek Plus (1 klik zamiast rysowania)

**Dlaczego zaskoczy:** Każdy rolnik składa **JPO** (Jednolity Pakiet Obszarowy) co roku — już MA swoje pola narysowane przez geodetów, podaje je ARiMR. Zamiast kazać mu je rysować od nowa (to co robi SatAgro, eAgronom), ściągamy automatycznie.

**Jak:**
- ARiMR **LPIS WFS** (public): `https://www.arimr.gov.pl/geoserver/wfs`
  - Layer `arimr:lpis_dzialki_referencyjne` (działki referencyjne LPIS)
- Alternatywa: **eWniosek Plus** API (wymaga upoważnienia rolnika — OAuth)
- Geoportal.gov.pl ewidencja gruntów: `https://mapy.geoportal.gov.pl/` WFS

**UX:** Rolnik wpisuje numer gospodarstwa ARiMR → lista wszystkich działek → zaznacza które to rolne pola → polygon już narysowany 1:1 z systemem płatności

**Impact:** To jest **największy friction remover** w onboardingu. Skraca czas z 20 min klikania z 2 min. SatAgro tego nie robi.

## 2. Historia Sentinel-2 **od 2015** — time-lapse NDVI

**Dlaczego zaskoczy:** Rolnik zobaczy **jak jego pole wyglądało przez 10 lat** — w którym roku plonował lepiej, kiedy była susza 2018, kiedy zalanie 2022.

**Jak:**
- Backfill Sentinel-2 L2A od 2015 dla każdego pola (1 request/miesiąc = 120 requestów/pole/10 lat — mieści się w CDSE free tier)
- Generowanie **animowanego GIF** year-by-year
- Heat map "NDVI średni w maju 2015 vs 2020 vs 2025"
- Korelacja z plonami (user wprowadza dt/ha → widzi linie trendu)

**Impact:** Social shareable ("zobacz moje pole w animacji"), rolnik zauważa wzorce (ten narożnik ZAWSZE słabiej plonuje — zmień uprawę?)

## 3. Drone Upload + Auto-Stitching → **1-2 cm precyzji**

**Dlaczego zaskoczy:** Rolnik ma **DJI Mavic 3M** (~8 tys. zł) albo **DJI Agras T40** (~60 tys. zł). Po obsłudze pola drogiem dostaje setki zdjęć. Zamiast ręcznie klejić w Pix4D, wrzuca ZIP do nas → mamy gotowe NDVI w 5 min.

**Jak:**
- Backend przyjmuje ZIP z EXIF GPS
- OpenDroneMap w Vercel Sandbox (ephemeral microVM) do stitching
- Multispectral NDVI z pasm RED/NIR (Mavic 3M ma 5-band kamerę)
- Overlay na mapie jako wysoka-res warstwa

**Impact:** Rolnicy z dronami to ~20% polskich gospodarstw >100ha — premium segment, chętnie płacą.

## 4. Crop Yield Prediction ML — **prognoza plonu na 30 dni przed zbiorem**

**Dlaczego zaskoczy:** Rolnik chce wiedzieć **ile sprzedać forward na giełdzie towarowej** (MATIF Paris, Warszawska Giełda Rolna). Jeśli wie że będzie 6.5 t/ha pszenicy, może sprzedać 3 t forward kiedy cena jest dobra.

**Jak:**
- **Prithvi-EO-2.0** (NASA+IBM foundation model, open-source, 600M params)
- Input: Sentinel-2 time series + pogoda + uprawa + BBCH faza
- Output: predykcja plonu dt/ha z 10-15% dokładnością (benchmark literatura)
- Prompt AgroAgent: "Twoja pszenica: ~6.8 t/ha (±0.7). Rynek dziś 1150 zł/t."

**Impact:** Bezpośrednie pieniądze w kieszeni — hedging cen, planowanie logistyki zbiorów.

## 5. BBCH Stage Tracking + alerty na moment interwencji

**Dlaczego zaskoczy:** Rośliny mają **fazy rozwoju BBCH 00-99** (np. pszenica BBCH 30 = "strzelanie w źdźbło" = **moment dokarmiania azotem**). Rolnik albo patrzy gołym okiem, albo leci z doradcy. My automatycznie.

**Jak:**
- **GDD (Growing Degree Days)** z Open-Meteo temperatury
- Tabele rozwoju per uprawa (wheat/corn/rapeseed) — GDD→BBCH
- AgroAgent mówi: "Twoja pszenica weszła wczoraj w BBCH 31. Okno azot+regulator przez kolejne 7 dni. Dawka 30-40 kg N/ha."

**Impact:** To **core value** agronoma — my robimy automatycznie, zero opłat. Konkurencja wymaga ręcznego wprowadzania fazy.

## 6. Zmiany tygodniowe z Sentinel-1 radar — **detekcja szkód**

**Dlaczego zaskoczy:** Radar widzi przez chmury i wykrywa **zmiany struktury pola** tydzień-po-tygodniu. Automatyczne alerty:
- "Pole 3: nagły spadek VH o 4.2 dB 15.05 → możliwe wyleganie po burzy"
- "Pole 7: anomalia w SW rogu — sprawdź fizycznie (zwierzęta? pojazd?)"
- "Pole 2: ślad szkodnika/grzyba w paśmie 50m od lasu"

**Jak:**
- Weekly S-1 GRD fetch
- Pixel-wise diff z poprzedniego tygodnia
- Threshold + clustering → alert z pinezką

**Impact:** Ubezpieczenie szkód suszowych/powodziowych TUW/PZU wymaga dokumentacji. Nasz alert z zdjęciami satelitarnymi = **automatyczny raport szkody**.

## 7. Carbon Farming — sekwestracja CO2 → **Verra credits → pieniądze**

**Dlaczego zaskoczy:** UE płaci za rolnictwo zrównoważone. Verra kredyty węglowe to **~150-250 zł/ha/rok** dodatkowego przychodu. Zagraniczne eAgronom (Estonia) już to robi w Polsce, zabiera rynek.

**Jak:**
- Rolnik deklaruje praktyki: bezorkowa, rotacja, międzyplony, ograniczenie N
- My **mierzymy przez satelitę**: pokrywa gleby zimą (Sentinel-2 NDVI grudzień-marzec), brak orki (Sentinel-1 szorstkość), biomasa
- Rejestrujemy w Verra przez partnera (np. Carbon Leap, BASF e3)
- Rolnik dostaje certyfikaty → sprzedaje na rynku CO2

**Impact:** Nowy revenue stream dla rolnika + my bierzemy 10-15% z kredytów. To **recurring premium** dla gospodarstw >50ha.

---

## Inne satelity warte dodania (priorytet w roadmapie)

### Priorytet P0 (darmowe, wartościowe, Q2 2026)
- **Landsat 8/9 TIRS** (thermal, 100 m) — **temperatura liścia** = wczesny stres cieplny (już przed NDVI pokazuje problem)
- **ECOSTRESS** (ISS, NASA) — thermal 70m, 2-5 dni, **evapotranspiration** faktyczna (vs model Open-Meteo)
- **MODIS Terra/Aqua** — 250m daily, **indeks suszy SPEI** historyczny od 2000
- **NASA GPM IMERG** — real-time opady co 30 min (uzupełnia Open-Meteo)

### Priorytet P1 (darmowe, niche, Q3)
- **Sentinel-3 OLCI** — 300m daily, **chlorofil w stawach/rzekach** obok pola (zasolenie rzek → zła woda irrygacyjna)
- **Sentinel-5P TROPOMI** — atmosfera NO2/SO2, **lokalny monitoring jakości powietrza** (dla eco-schematów)
- **VIIRS (NOAA-20, Suomi NPP)** — night lights + fire detection → pożary ścierniska
- **NASA SMAP L4** — soil moisture 9km root-zone (już mamy, warto L4 zamiast L3)
- **NISAR** (NASA-ISRO, launch Jul 2025, pierwsze dane Q1 2026) — L-band SAR, lepsze niż Sentinel-1 dla biomasy

### Priorytet P2 (płatne, premium tier)
- **Planet PlanetScope** — 3m daily (~$1-3/ha/rok)
- **Planet SkySat** — 50cm on-demand (~$10-30/ha)
- **Capella Space SAR** — 25cm daily (high-value crops)
- **Pixxel Firefly** hyperspectral — 5m, stres biotyczny bardzo wcześnie
- **Hydrosat VanZyl** — thermal 50m daily (irrigation scheduling)
- **Maxar WorldView** — 30cm on-demand (dokumentacja szkód dla ubezpieczeń)

### Polskie oficjalne (nie analityczne, ale przydatne)
- **GUGiK ortofotomapa 25cm** — TYLKO do rysowania granic / referencji historycznej. Odświeżana co 2-3 lata — **nie pokazuj jako "aktualna"** bo myli.
- **ARiMR LPIS WFS** — granice działek referencyjnych (patrz Feature #1 wyżej)
- **IUNG-PIB** modele gleby (mapa typów gleb PL 1:100k) — dla rekomendacji N
- **IMGW** stacje meteo (~300 punktów) — walidacja Open-Meteo
- **GDOŚ Natura 2000** — obszary chronione (eko-schematy wymagają)

---

## Rekomendacja sekwencji Q2-Q3 2026

**Q2 (teraz → czerwiec):**
1. **ARiMR LPIS import** (4 dni) — killer onboarding
2. **Historia Sentinel-2 10 lat** (5 dni) — engagement boost
3. **BBCH tracker** (3 dni) — core value
4. **Landsat thermal** (2 dni) — darmowe, dodatek

**Q3 (lipiec → wrzesień):**
5. **Drone upload + stitching** (10 dni) — premium lock-in
6. **Crop yield prediction** (7 dni) — revenue differentiator
7. **S-1 weekly change detection** (5 dni) — alerty szkód
8. **Planet PlanetScope** premium tier (7 dni) — paid upgrade path

**Q4 (pażdziernik → grudzień):**
9. **Carbon farming / Verra** (14 dni) — nowy revenue
10. **Integracje ISOBUS** (JD, CNH, AGCO) (10 dni)
11. **Giełda plonów marketplace** (14 dni)
