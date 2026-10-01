# Demo AgriClaw — 5 minut dla jury

Wejście: `agripol.xyz/login?demo=1` (konto demo, bez rejestracji). Telefon w ręku + laptop na ekranie.
Wszystko poniżej sprawdzone na koncie demo (10.2026). Czego NIE obiecywać: WhatsApp, offline, zdjęć Planet 3 m.

## 0:00 — Hak (30 s)
„Rolnik nie potrzebuje kolejnego dashboardu. Potrzebuje wiedzieć, **co zrobić jutro** — i **dlaczego** tak radzimy."
→ Strona główna: satelita Copernicus, legalne środki, e-ewidencja 2027.

## 0:30 — Panel „Dziś" (60 s)
- Nagłówek: „N pól wymaga uwagi", pogoda, **najlepsze okno oprysku**.
- Pod każdym alertem linia **„dlaczego: …"** — przesłanka i próg (np. dni bez deszczu / próg). *To odróżnia nas od „czarnej skrzynki".*
- Mów: „Radę można podważyć, bo widać, na czym stoi. Decyzja zostaje u rolnika."

## 1:30 — Pole i satelita (60 s)
- Wejdź w **Pole za stodołą (Zamość)** (pszenica, siew 15.09).
- Data pod mapą = **prawdziwy przelot Sentinel-2** (30.09), nie godzina kliknięcia; NDVI, NDRE, NDWI, SAVI z jednego zdjęcia 10 m.
- Mów: „Pszenica 2 tygodnie po siewie ma NDVI 0,46 — **to norma na wschodach**. Inne aplikacje krzyczą »stres« i radzą mocznik w październiku. My mówimy: *policz rośliny na m², nie decyduj o azocie*."
- Pasek „Trend": brak fałszywego „−0,44" (porównujemy tylko w obrębie sezonu).

## 2:30 — Diagnoza ze zdjęcia + legalność (60 s)
- Diagnoza z kamery: zdjęcie liścia → choroba, **pewność**, co robić; przy niepewności model mówi to wprost.
- Środek ochrony sprawdzony w **rejestrze ŚOR (dane.gov.pl)**: wycofany/brak dopuszczonych → czerwona flaga „nie stosuj".
- Mów: „Gemini 3.8 Flash wybrany benchmarkiem: 8/8 na naszym zestawie (docs/research/benchmark-modeli-diagnozy-2026-10.md)."

## 3:30 — Papiery: księga i zgodność (60 s)
- **Księga polowa**: wpis zabiegu, PDF dla IJHARS jednym kliknięciem. Podstawa prawna: art. 67 rozp. 1107/2009; od **1.01.2027 ewidencja elektroniczna**.
- **Zgodność ARiMR**: demo ma pszenicę 76% na 62,2 ha → **naruszenie GAEC 7** i konkret: „przesuń co najmniej 0,8 ha".
- Mów: „Nie tylko »masz problem« — mówimy **ile hektarów** zmienić, żeby dopłaty były bezpieczne."

## 4:30 — Agent i telefon (30 s)
- AgroAgent: „Pole za stodołą — dać azot dolistnie?" → odpowiada z fazą wschodów, bez mocznika, z pytaniem kontrolnym.
- Telefon: Ustawienia → **Włącz powiadomienia** → „Wyślij testowe" (push działa bez WhatsApp/SMS).

## Pytania, które padną
| Pytanie | Odpowiedź |
|---|---|
| Skąd dane? | Sentinel-2/-1 (Copernicus), Landsat (NASA/USGS), Open-Meteo, rejestr ŚOR (MRiRW). |
| Dlaczego nie 3 m? | Sentinel 10 m jest darmowy i wystarcza do kondycji pola; Planet 3 m wymaga płatnej licencji — plan po grancie. |
| Czy AI zastępuje agronoma? | Nie: każda rada ma przesłanki i progi; zalecenia ŚOR zawsze „do potwierdzenia z etykietą". |
| Model biznesowy / finansowanie | docs/funding (AGROSTRATEG, CASSINI, ścieżki regionalne Lubelskie). |

## Przed pokazem (2 min)
1. Zalogowany telefon, powiadomienia włączone, test wysłany.
2. `gh workflow run cron-fallback.yml` — świeże rekomendacje (po scaleniu #49 pole „na wschodach" nie świeci alarmem).
3. Wi-Fi + hotspot w zapasie (mapy i CDSE wymagają sieci).
