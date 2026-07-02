# Feature Matrix — 10 Platform Precision-Agriculture vs AgriClaw

**Research date:** 2026-04-18 · **Zaktualizowano:** 2026-07-02 (kolumna ACW zgodna z kodem po audycie)
**Scope:** John Deere Operations Center, Climate FieldView (Bayer), EOSDA Crop Monitoring, OneSoil, Taranis, xarvio FIELD MANAGER (BASF), SatAgro (PL), AGRIVI, eAgronom, CropIn + AgriClaw (my stan).

> Aktualizacja 2026-07: kolumna ACW pokazywała „N" dla wielu funkcji już zaimplementowanych.
> Zweryfikowane w kodzie/na produkcji jako działające: Sentinel-1 radar SAR, Landsat thermal,
> Planet 3m, historyczne obrazy + backfill do 10 lat, alerty przymrozek/upał, modele chorobowe,
> spray window, scouting foto+GPS, księga polowa + eksport CSV/PDF (IJHARS), compliance GAEC,
> kalkulator azotu, bilans wodny, import działek GUGiK ULDK, foto-diagnoza AI, maska chmur SCL.
> Nadal brak (luki): VRA/ISOXML export, plan nawozowy ARiMR, urzędowa baza ŚOR MRiRW, pełny
> offline PWA (IndexedDB), pełny inbound WhatsApp webhook, auto-detekcja pól, własne stacje IoT.

Legenda:
- Y = funkcja dostępna w standardzie (Free/Basic lub higher tier)
- P = dostępna tylko w płatnym / wyższym planie (Paid / Enterprise)
- A = dostępna przez add-on / marketplace / integracje
- N = brak funkcji / nie udokumentowana publicznie
- ? = niejasne z dostępnej dokumentacji publicznej

Kolumny: **JD** = John Deere Ops Center · **FV** = Climate FieldView · **EOS** = EOSDA Crop Monitoring · **OS** = OneSoil · **TAR** = Taranis · **XAR** = xarvio Field Manager · **SAT** = SatAgro · **AGR** = AGRIVI · **eAG** = eAgronom · **CRO** = CropIn · **ACW** = AgriClaw (obecny stan)

---

## 1. Satellite & Imagery

| Feature | JD | FV | EOS | OS | TAR | XAR | SAT | AGR | eAG | CRO | ACW |
|---|---|---|---|---|---|---|---|---|---|---|---|
| NDVI (Sentinel-2 / equivalent) | A (via partners) | P | Y | Y | Y (plus drone) | Y | Y | Y | Y | Y | **Y** |
| NDRE (nitrogen) | A | P | Y | Y | Y | Y | Y | P | P | Y | **Y** |
| NDWI / NDMI (water stress) | A | P | Y | P | Y | Y | Y | P | N | Y | **Y** |
| SAVI / MSAVI (bare soil correction) | N | N | Y | Y | N | Y | Y | N | N | Y | **Y** |
| EVI | N | N | N | N | N | N | N | N | N | N | N |
| GNDVI | N | N | N | N | N | N | N | N | N | N | N |
| LAI (Leaf Area Index) | N | N | N | N | Y (drone-derived) | Y | N | N | N | Y | N |
| True-color RGB imagery | P | Y | Y | Y | Y (leaf-level) | Y | Y | P | P | Y | **Y** |
| High-res imagery (Planet/Maxar, ≤3m) | A | N | P | P | Y (drone 0.3mm) | P | P (Premium) | P | N | P | **Y (Planet 3m PSScene)** |
| Sentinel-1 radar SAR (przez chmury) | N | N | N | N | N | N | N | N | N | N | **Y (przewaga)** |
| Hyperspectral | N | N | N | N | N | N | N | N | N | N | N |
| Thermal imaging | N | N | N | N | N | N | N | N | N | N | **Y (Landsat 8/9, gdy dostęp)** |
| Maska chmur per-piksel (SCL) | ? | ? | Y | ? | Y | Y | Y | ? | ? | Y | **Y (SCL + leastCC)** |
| Historyczne obrazy (multi-season) | Y | P | Y (5 lat) | Y (>6 mies) | Y (lifetime Elite+) | Y | Y (od 2002 r.) | Y | Y | Y | **Y (backfill do 10 lat)** |

## 2. Weather & Meteorology

| Feature | JD | FV | EOS | OS | TAR | XAR | SAT | AGR | eAG | CRO | ACW |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Prognoza pogody (7-14 dni) | P | Y | Y (14 dni) | Y | Y | Y | Y | Y | Y (?) | Y | **Y (Open-Meteo 7d)** |
| ET0 (evapotranspiration FAO) | N | N | Y | N | N | Y | N | N | N | N | **Y** |
| Historyczne dane meteo | P | P | Y (od 1979) | Y | Y | Y | Y (od 2002) | Y | Y | Y | Y (Open-Meteo archive) |
| Integracja z IMGW/DWD/ECMWF | A | A | Y (ECMWF) | ? | N | Y (DWD) | Y (IMGW+) | A | A | ? | Y (Open-Meteo = ECMWF) |
| Własne stacje meteo (IoT) | Y | A | Y | N | N | Y | Y (Premium) | Y | Y (telematyka) | Y | N |
| Alerty o suszy | P | Y | Y | Y | Y | Y | Y | Y | N | Y | **Y (rule-based, faza-aware)** |
| Alerty o przymrozku | N | N | Y | N | N | Y | Y | Y | N | Y | **Y (frost.ts + alert)** |
| Alerty o chorobach (model) | A (partners) | Y | Y (risk maps) | N | Y (AI detection) | **Y (BBCH + disease models)** | Y (alarmy) | Y (pest alerts) | N | Y | **Y (7 modeli chorobowych)** |
| Hourly spray window | P | Y | N | N | N | **Y (spray timer)** | N | Y | N | Y | **Y (spray-window scoring)** |

## 3. Field Management

| Feature | JD | FV | EOS | OS | TAR | XAR | SAT | AGR | eAG | CRO | ACW |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Pola z PostGIS / polygon editor | Y | Y | Y | Y (auto-detect) | Y | Y | Y | Y | Y | Y | **Y (MapLibre + Turf)** |
| Auto-detect pola z satelity | N | N | Y | **Y (57 krajów)** | N | Y | N | N | N | Y | N |
| Import granic (ISOXML/SHP) | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | N |
| Eksport granic (ISOXML/SHP) | Y | Y | Y | Y | N | Y | Y | Y | Y | Y | N |
| Scouting / field notes z GPS | Y | Y (pins) | Y | Y (offline) | Y | Y (Scouting Trips) | Y | Y | Y | Y | **Y (scouting + GPS)** |
| Scouting offline (telefon w polu) | Y | P | Y | Y | P | Y | Y | Y | Y | Y | P (PWA sw.js; brak pełnego IndexedDB) |
| Foto w polu z notatką | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | **Y (foto base64; TODO Blob)** |
| Historia pola (multi-season) | Y | Y | Y (5 lat) | Y | Y | Y | Y (od 2002) | Y | Y | Y | **Y (NDVI history + backfill)** |

## 4. Prescription / Variable Rate

| Feature | JD | FV | EOS | OS | TAR | XAR | SAT | AGR | eAG | CRO | ACW |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Mapy zmienności NDVI-based VRA | Y | **Y (flagship)** | Y | Y (Pro) | Y | **Y (fungicides, fertilizer)** | **Y (flagship)** | Y | P | Y | N |
| Skrypty siewu (VR seeding) | Y | **Y (Seed Scripts)** | Y | Y | N | Y | Y | Y | N | Y | N |
| N-prescription (variable N) | Y | Y | Y | Y | P | **Y (N-map)** | Y | Y | Y (plan NPK) | Y | N |
| Optymalizacja próbek gleby | Y | P | P | P | N | Y | **Y** | Y | P | Y | N |
| Export ISOXML/shapefile dla maszyn | Y | Y | Y | Y | N | Y | **Y (flagship)** | Y | Y | Y | N |

## 5. Machine & IoT Integration

| Feature | JD | FV | EOS | OS | TAR | XAR | SAT | AGR | eAG | CRO | ACW |
|---|---|---|---|---|---|---|---|---|---|---|---|
| JDLink / JD Operations Center | **Y (native)** | Y | Y | Y | Y | Y | Y | **Y (full JD)** | Y | Y | N |
| Climate FieldView Drive | Y | **Y (native)** | A | A | A | Y (John Deere coop) | Y | A | A | A | N |
| ISOBUS / CAN bus | Y | Y | P | P | N | Y | Y | Y | Y | P | N |
| CLAAS Telematics | Y | Y | A | A | N | Y | Y | Y | Y | A | N |
| AGCO Fuse | Y | Y | A | N | N | Y | ? | Y | Y | A | N |
| IoT sensory (soil, weather) | Y | A | Y | A | N | Y | Y (Premium) | Y | Y | Y | N |
| Telematyka pojazdów | Y | Y | A | N | N | Y | A | Y (integration) | **Y (native)** | Y | N |
| Integracja z pompami / irygacja | P | A | A | N | N | A | Y (beta: gospodarka wodna) | Y | N | Y | N |

## 6. AI / Disease & Weed Detection

| Feature | JD | FV | EOS | OS | TAR | XAR | SAT | AGR | eAG | CRO | ACW |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Identyfikacja chorób z zdjęcia (photo ID) | A | A | P | N | **Y (AI leaf-level)** | Y | N | Y (photo) | P | Y (22+ DL models) | N |
| Identyfikacja chwastów (photo ID) | N | N | N | N | **Y (AI leaf-level)** | Y (One Smart Spray: >95%) | N | Y (pest ID) | N | Y | N |
| Identyfikacja szkodników | N | N | N | N | **Y** | Y | N | Y | N | Y | N |
| Niedobory składników (nutrient deficiency) | N | N | Y (indirect via NDRE) | N | **Y (leaf-level)** | Y | Y | Y | P | Y | N |
| Crop stand count (plant count) | N | Y (limited) | N | N | **Y (flagship)** | N | N | P | N | Y | N |
| AI chat (LLM-based agronomist) | N | N | N | N | **Y (Ag Assistant™ - gen AI)** | N | N | N | N | N | **Y (OpenClaw-per-farmer agent, unique)** |
| Voice interface | N | N | N | N | **Y (Ag Assistant audio)** | N | N | N | N | N | N (planned?) |

## 7. Drone / UAV Integration

| Feature | JD | FV | EOS | OS | TAR | XAR | SAT | AGR | eAG | CRO | ACW |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Upload NDVI orthomosaic z drona | A (DroneDeploy) | **Y (DroneDeploy partner)** | Y | P | **Y (native, 0.3mm)** | P | N | A | N | A | N |
| Automatyczne stitching | A | A | A | A | **Y (native)** | A | A | A | N | A | N |
| Drone mission planning | N | N | N | N | **Y (6 missions/season)** | N | N | N | N | N | N |
| AGRAS spraying drone compat | A | N | N | N | N | N | N | N | N | N | N |

## 8. Farming Documentation (EU Compliance)

| Feature | JD | FV | EOS | OS | TAR | XAR | SAT | AGR | eAG | CRO | ACW |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Księga polowa / e-farm diary | Y (events) | Y (Record Based Scouting) | Y (Field Activity Log) | N | Y | Y | Y (Diary/Events) | **Y** | **Y (flagship)** | Y | N |
| Rejestr zabiegów PPP (śr. ochrony roślin) | P | P | P | N | Y | **Y (flagship)** | Y | **Y (zgodne z EU)** | **Y (flagship)** | Y (GlobalGAP) | N |
| Rejestr nawożenia NPK | P | Y | Y | P | N | Y | Y | **Y** | **Y (flagship)** | Y | N |
| Zgodność z EU CAP / ekoschematy | N | N | P | N | N | Y | **Y (Expert: GAEC)** | Y | **Y (flagship for EU)** | P | N |
| Zgodność GlobalGAP / HACCP / ISO | N | N | N | N | Y | Y | N | **Y (ISO 9001, GlobalGAP, HACCP)** | Y | **Y (GlobalGAP native)** | N |
| Traceability (farm-to-fork, QR codes) | N | N | N | N | N | N | N | Y | Y | **Y (Cropin Trace, flagship)** | N |
| Raporty dla urzędów PL/ARiMR | N | N | N | N | N | N | P | N | **Y (PL native)** | N | N |
| Raporty dla ubezpieczyciela | N | Y (Yield Analysis) | Y (customizable) | N | Y | Y | Y (Expert) | Y | Y | Y | N |
| Eksport dla doradcy / agronoma | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | N |

## 9. Planning / Crop Management

| Feature | JD | FV | EOS | OS | TAR | XAR | SAT | AGR | eAG | CRO | ACW |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Planowanie rotacji upraw | N | P | Y | N | N | Y | P | **Y (AGRIVI flagship)** | **Y (flagship)** | Y | N |
| Crop calendar / BBCH tracking | P | Y | Y | Y (growing degree-days) | Y | **Y (BBCH native)** | Y | Y | Y | Y | N |
| Yield prediction (ML) | Y (historical) | Y (Yield Analysis) | Y (14-day ML) | P | Y | Y | Y (beta) | Y | Y | **Y (22+ DL models, flagship)** | N |
| Crop modeling (deep learning) | N | P | Y | N | Y | Y | N | Y | N | **Y (flagship: 500 crops, 10k varieties)** | N |
| Pole leaderboard / ranking | Y | Y (top/bottom fields) | Y (Field Leaderboard) | Y | Y | Y | N | Y | N | Y | N |

## 10. Business & Ops

| Feature | JD | FV | EOS | OS | TAR | XAR | SAT | AGR | eAG | CRO | ACW |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Zarządzanie pracownikami / zleceniami | Y (Team tool) | P (Account Sharing) | Y (Task Assignment) | N | Y | Y | P | **Y (full HR)** | Y | Y | N |
| Magazyn (nasiona, nawozy, plony) | Y | P | P | N | N | P | P | **Y** | **Y (flagship)** | Y | N |
| Finanse / koszt produkcji per ha | Y | Y (Yield Analysis by Application) | Y | N | Y | Y | **Y (Expert: mapowanie rentowności)** | **Y (full accounting)** | **Y (budget + costs)** | Y | N |
| Marketplace / sprzedaż plonów | N | Y (Grain Futures via partners) | N | N | N | N | N | P | P | N | N |
| Carbon credits / ekoschemat węglowy | N | N | Y (add-on) | N | Y (Conservation services) | P | **Y (Expert)** | Y | **Y (flagship: Verra registered)** | Y | N |
| Maszyny — allocation / maintenance | **Y (flagship)** | P | N | N | N | P | N | Y | Y (telematyka) | Y | N |

## 11. Mobile / UX / Platform

| Feature | JD | FV | EOS | OS | TAR | XAR | SAT | AGR | eAG | CRO | ACW |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Native iOS app | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | N |
| Native Android app | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | N |
| PWA / responsywny web | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | **Y (flagship for AgriClaw)** |
| Desktop app (Windows/Mac) | Y | N | Web | Web | Web | Web | Web | Y | Web | Web | Web |
| Offline mode (pełne w polu) | Y (Connect Mobile) | P (cab app) | **Y (mobile app)** | **Y (mobile app)** | P | Y (scouting) | Y (mobilka) | Y | Y (?) | Y | N (planowane) |
| WhatsApp / Telegram notyfikacje | N | N | A | N | N | N | N | A | N | Y (Cropin Connect: 29+ lang) | **Y (planowane, flagship dla rolnika PL)** |
| Push notifications | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | P |
| Polski natywny UI | N (EN/DE) | P (PL od niedawna) | Y | Y | N | Y | **Y (native PL)** | Y | **Y (native PL)** | Y (29+ lang) | **Y (flagship)** |

## 12. Developer / Integration

| Feature | JD | FV | EOS | OS | TAR | XAR | SAT | AGR | eAG | CRO | ACW |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Public REST API | **Y (developer.deere.com)** | Y (Plus tier: External API) | Y (API access) | A | A | ? | Y (eksport danych) | **Y (ERP integration)** | A | Y (Data Hub) | Y (agri-skills HTTP endpoints) |
| API dla scout/weather/satellite | Y | Y | Y | P | N | ? | Y | Y | A | Y | **Y (for agent)** |
| Webhooks | Y | Y | P | N | N | N | N | Y | N | Y | N |
| OAuth2 / SSO | Y | Y | Y | ? | Y | Y | Y | Y | Y | Y | Y (NextAuth: Google + Credentials) |
| White-label dla kooperatyw / sklepów | Y | Y (dealer branding) | Y (Enterprise) | P | **Y (Pro+: white label)** | Y (AgBusiness edition) | P | Y (co-op features) | Y (food+banking sector) | Y (agribusiness) | N |
| Open source | N | N | N | N | N | N | N | N | N | N | P (proprietary jak stated, ale agent via OpenClaw OSS) |

## 13. Signature / Unique Features (co każdy robi UNIKALNIE dobrze)

| Platform | Flagship unique feature |
|---|---|
| **John Deere Ops** | Najgłębsza integracja z maszynami JD — real-time telemetry co 5s, Work Planner distribution wireless, Gen4/G5 display native. PRO service: self-repair diagnostics |
| **Climate FieldView** | FieldView Drive hardware + Seed Scripts (średnio +319 kg/ha) · ekosystem 60+ partnerów maszyn · prescription flagship |
| **EOSDA** | 10 indeksów wegetacji gotowych · 14-dniowa predykcja plonu · soft API dla partnerów · 5 lat historii · auto-sync z JD Ops |
| **OneSoil** | Najlepszy UX free-tier · auto-detect pola z satelity w 57 krajach · zero ads · najlepszy mobile scouting |
| **Taranis** | Leaf-level 0.3mm drone imagery · Ag Assistant™ gen-AI agronom (audio/text/image) · najgłębsze AI detection (500M+ data points) |
| **xarvio (BASF)** | Spray timer (unique) · disease model (Septoria, Fusarium, rdza) · One Smart Spray (>95% weed detection) · financial guarantee (Healthy Fields) |
| **SatAgro** | POLSKI native · IMGW + GAEC ekoschematy · mapowanie rentowności · umowy 3-5 lat z gwarancją ceny |
| **AGRIVI** | Full ERP: finanse + HR + kooperatywa + 42 features w 150 krajach · ISO/HACCP/GlobalGAP native |
| **eAgronom** | Verra-registered carbon credits (pierwsza w EU dla EST/LV/LT/PL) · EU CAP compliance native · 3,000+ farms, 14 countries |
| **CropIn** | Data Hub (80% mniej data-eng) · 22+ DL models · 500 crops, 10k varieties · 29+ języków · Cropin Trace (farm-to-fork QR) |
| **AgriClaw (now)** | Dedicated AI agent per-farmer (OpenClaw Hetzner VM) · Polski native · NDVI/NDRE/NDWI/SAVI multi-index single request · WhatsApp-first design |

## Źródła (selektywnie, full list w `pricing-comparison.md`)

- [Data Management | Operations Center | John Deere](https://www.deere.com/en/technology-products/precision-ag-technology/data-management/operations-center/)
- [FieldView Pricing](https://climate.com/pricing), [FieldView Basic Plan](https://climate.com/en-us/pricing/basic-plan.html)
- [EOSDA Crop Monitoring](https://eos.com/products/crop-monitoring/), [Account & Pricing](https://eos.com/user-guide/crop-monitoring/account-and-pricing/)
- [OneSoil](https://onesoil.ai/en), [OneSoil Scouting guide](https://blog.onesoil.ai/en/onesoil-scouting-app)
- [Taranis Service Plans](https://www.taranis.com/service-plans/), [Taranis](https://www.taranis.com/)
- [xarvio Field Manager](https://xarvio-itl02.basf.com/global/en/products/field-manager.html), [xarvio Germany Preise](https://ag.xarvio.com/germany/field-manager/preise)
- [SatAgro](https://satagro.pl/), [Help docs](https://satagro.net/help/first-steps/)
- [AGRIVI](https://www.agrivi.com/), [360 Farm Enterprise](https://www.agrivi.com/products/360-farm-enterprise/)
- [eAgronom](https://www.eagronom.com/), [PL FMS](https://www.eagronom.com/pl/program-do-zarzadzania-gospodarstwem)
- [Cropin](https://www.cropin.com/), [Cropin Grow](https://www.cropin.com/cropin-grow-smartfarm-plus/)
- [John Deere Developer Portal](https://developer.deere.com/)
