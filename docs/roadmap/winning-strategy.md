# AgriClaw — Winning Strategy & Feature Backlog
**Stan: 2026-04-18**

Dokument roboczy — żywa mapa drogowa. Tu zapisujemy wszystko co musimy zbudować żeby rozniesc konkurencję.

---

## 1. Szybki snapshot: Co JEST vs Co NIEMA

### MAMY (działa end-to-end)
- ✅ Auth (Google OAuth + Credentials, JWT)
- ✅ Postgres + PostGIS
- ✅ Sentinel-2 NDVI/NDRE/NDWI/SAVI przez CDSE (10m, 4 indeksy)
- ✅ Open-Meteo pogoda + ET0 + drought risk
- ✅ Rekomendacje rule-based (PL, po polsku)
- ✅ AgroAgent chat via OpenClaw Gateway (SSE streaming)
- ✅ 6 skilli dla agenta (fields, satellite, weather, whatsapp)
- ✅ Map ESRI World Imagery 30cm + EOX S2 Cloudless
- ✅ Diagnoza z kamery (Gemma 4 via OpenRouter)
- ✅ PWA (offline, manifest, SW)
- ✅ Landing + Dashboard (onboarding, fields, map editor, analysis, chat, settings)
- ✅ Cron daily + health check
- ✅ Agent provisioning (Hetzner mock)

### MUST-HAVE (do płatnego launch)
- [ ] **Księga polowa** (rejestr zabiegów PPP, wymagany prawnie w UE >10 ha)
- [ ] **Sentinel-1 Radar** (SAR przez chmury — Polska ma 200 dni/rok zachmurzenia!)
- [ ] **Integrated Pest Management** — baza substancji czynnych MRiRW
- [ ] **PDF raporty** (dla ubezpieczyciela, doradcy, ARiMR)
- [ ] **Multi-user per farm** (właściciel + agronom + synowie)
- [ ] **Eksport CSV/Shapefile** (dla maszyn, agronoma)
- [ ] **Email verification flow**
- [ ] **Password reset**
- [ ] **Rate limiting na WSZYSTKICH API** (teraz tylko signup)
- [ ] **Sentry + analytics**
- [ ] **Vercel production deploy**
- [ ] **WhatsApp Business verification** (Meta Cloud)
- [ ] **Backup/PITR** (Neon production)
- [ ] **Production env validation** (Zod schema)

### WYRÓŻNIAJĄCE (blue ocean — nikt albo mało kto ma)
- [ ] **AgroAgent z pamięcią gospodarstwa 2+ sezony** — głos PL + WhatsApp
- [ ] **Planet Labs PlanetScope 3m daily** (premium tier, subscribers only)
- [ ] **Drone upload + auto-stitching + NDVI** (1-2cm precyzji)
- [ ] **Sentinel-1 radar detect** (wykrycie wycięcia / szkody mechanicznej)
- [ ] **Thermal stress detection** (Landsat 8/9 TIRS)
- [ ] **Field segmentation by 1 klik** (SAM/Gemma 4 od Meta — auto-rysuje granicę)
- [ ] **Historia 5 lat NDVI** (backfill Sentinel-2 od 2015)
- [ ] **Crop yield prediction ML** (foundation model IBM Prithvi / NASA)
- [ ] **Giełda plonów P2P** (marketplace)
- [ ] **Kalkulator kosztu produkcji per ha / per tona plonu**
- [ ] **Ubezpieczenie pogodowe parametric** (integracja z reinsurerem)
- [ ] **IoT integration** — czujniki glebowe (Sensoterra, Stevens Hydra, Davis)
- [ ] **Variable Rate Nitrogen prescription** — mapa azotu dla rozsiewacza ISOBUS

---

## 2. Katalog satelit — co świat ma dla rolnictwa (2026)

### DARMOWE (budujemy na tym)

| Sensor | Rozdz. | Rewizyta | Pasma | Użycie w AgriClaw |
|---|---|---|---|---|
| **Sentinel-2 L2A** | **10 m** | 5 dni | 13 pasm (443-2190 nm) | ✅ NDVI/NDRE/NDWI/SAVI |
| **Sentinel-1 GRD** | 10 m | 6 dni | SAR C-band (5.4 GHz) | ❌ DODAĆ — widzi przez chmury |
| **Sentinel-3 OLCI** | 300 m | 1-2 dni | 21 pasm | Optyczne, za grube dla pola |
| **Sentinel-5P TROPOMI** | 3.5×5.5 km | 1 dzień | NO2, SO2, CH4 | Monitoring oprysków regionalnie |
| **Landsat 8/9 TIRS** | 100 m (30m res.) | 8 dni combined | Thermal | ❌ DODAĆ — temperatura liścia |
| **Landsat 8/9 OLI** | 30 m | j.w. | 9 pasm | Backup dla S-2 (gorsze) |
| **MODIS Terra/Aqua** | 250-500 m | 1-2× dziennie | 36 pasm | Historia suszy 2000+ |
| **Copernicus DEM** | 30 m | static | elevation | Nachylenie, zlewnia wody |
| **SMAP L3** | 9 km | 2-3 dni | microwave | Za grube dla pola (Open-Meteo lepsze) |
| **NASA GPM IMERG** | 10 km | 30 min | precipitation | Walidacja opadów |

### KOMERCYJNE (premium tier)

| Sensor | Rozdz. | Rewizyta | Cena szacunkowa | Decyzja |
|---|---|---|---|---|
| **Planet PlanetScope** | **3 m** | **codziennie** | ~$1-3/ha/rok | 🎯 DODAĆ Q3 2026 (premium) |
| Planet SkySat | 50 cm | on-demand | $10-30/ha | Opcjonalnie — audyt szkód |
| **Airbus Pléiades Neo** | **30 cm** | on-demand | 3-8 $/km² | Luxury, na żądanie |
| Maxar WorldView-3 | 30 cm | on-demand | wysoki min spend | Enterprise tylko |
| Satellogic | 70 cm | daily | tańszy | Alternatywa |
| **Capella SAR** | **25 cm** | ~6 h | niski subscription | 🎯 ROZWAŻYĆ — szkody po burzach |
| ICEYE SAR | 25 cm | daily | j.w. | j.w. |
| **Pixxel Hyperspectral** | 5 m | ~2 dni | nowe 2026 | 🎯 ROZWAŻYĆ — stres biotyczny bardzo wcześnie |
| SatVu thermal | 3.5 m | high revisit | nowe | Thermal dla stresu |
| Albedo (VLEO) | **10 cm** | 2025+ | wysoki | Luxury |

### POLSKIE OFICJALNE
| Źródło | Co daje | Status |
|---|---|---|
| **GUGiK ortofotomapy** | **25 cm** dla całej PL | ❌ DODAĆ — uzupełnienie historii pola |
| **eGEOPROJECTS** | Mapy glebowe | ❌ DODAĆ — wycena terenu |
| **ARiMR granice pól** | Referencyjne granice ze złożonych wniosków | ❌ DODAĆ — auto-import ze wniosku |
| **IMGW** | Pogoda historyczna + ostrzeżenia PL | ❌ DODAĆ — alerts |
| **IUNG-PIB** | Modele gleb, bilanse N | ❌ DODAĆ — rekomendacje agronomiczne |

### DRONY (user-contributed data)
| Dron | Cena hardware | Dane | Integracja |
|---|---|---|---|
| **DJI Mavic 3M Multispectral** | ~8000 zł | 5-band 20MP | 🎯 upload + auto-stitch + NDVI |
| DJI Agras T25 | ~60000 zł | Opryskiwacz + mulispec | Partner pricing |
| Parrot Anafi AG | ~13000 zł | Multispectral | j.w. |
| senseFly eBee Ag | ~40000 zł | Professional | j.w. |

**Plan:** Faza 5 — **Drone Upload Endpoint**. User wrzuca zip z Mavic 3M → backend stitchuje → generuje NDVI → porównuje z Sentinel-2.

---

## 3. Nasze przewagi konkurencyjne (moat)

### Strukturalne (trudne do skopiowania)
1. **AgroAgent z pełną pamięcią gospodarstwa** — konkurencja ma dashboardy; my mamy rozmowę po polsku z kontekstem 2+ sezonów
2. **Open source + self-hostable** — rolnik nie zamknięty, może wziąć swoje dane i odejść
3. **WhatsApp first, telefon jest pilotem** — SatAgro/EOS mają web dashboardy; my idziemy tam gdzie rolnik już jest
4. **Księga polowa automatyczna** — kalendarz i mapa same wypełniają rejestr zabiegów
5. **Polska jako #1 język** — SatAgro jest po polsku ale interfejs jest techniczny; my mamy ton agronoma-sąsiada

### Techniczne (wymagają wykonania)
6. **Multi-index fusion** — Sentinel-2 + Sentinel-1 radar + Landsat thermal + Open-Meteo + user drones = jedna rekomendacja
7. **Gemma 4 on-device** — zdjęcie liścia z kamery → diagnoza offline (przez PWA model cache)
8. **Auto-field segmentation jednym kliknięciem** — SAM2/Gemma 4 zamiast rysowania poligonu
9. **Parametric insurance integration** — alert + automatyczny trigger wypłaty od ubezpieczyciela

### Cenowe
10. **Free tier dla <5 ha** — drobny rolnik dostaje wszystko za darmo (monetyzujemy premium dla >20 ha)
11. **Per-hectare subscription taniej 30-50% niż EOS/Climate FieldView**

---

## 4. Co konkurencja ROBI LEPIEJ (i musimy dogonić)

| Firma | Czego im zazdrościmy | Plan action |
|---|---|---|
| **SatAgro** | Polska księga polowa + integracja ARiMR | Zbudować w Q2 2026 |
| **John Deere Ops Center** | Integracja maszyn ISOBUS | ISO-XML export Q3 2026 |
| **Climate FieldView** | Integracja z nasionami / nawozami (dealer network) | Polish partnerships (Osadkowski, Bayer PL) Q4 2026 |
| **EOS Crop Monitoring** | Scouting (foto w polu + notatki) | Zbudować Q2 2026 |
| **Taranis** | AI detection chorób z wysokiej rozdzielczości | Mamy Gemma — potrzebujemy treningu na PL danych |
| **xarvio FieldManager** | Prescription nawożenia azotem per zone | NDRE → N rec w Q3 2026 |
| **CropIn** | Historia plonów 5+ sezonów | Backfill S-2 Q2 2026 |
| **OneSoil** | Crop classification z AI | Nasz AgroAgent + S-2 time series → Q3 |

---

## 5. Roadmap 2026 (priorytety)

### Q2 2026 (kwiecień-czerwiec) — FOUNDATION LAUNCH
**Cel:** Pierwszych 50 płacących rolników, kompletny dla PL market.

1. **Księga polowa** (8 dni)
   - Schema: Zabieg (pole, data, typ, środek, dawka, operator, pogoda)
   - API: CRUD + import z ARiMR eWniosek
   - UI: kalendarz + formularz wypełnienia
   - Export PDF + CSV dla IJHARS
2. **Scouting** (3 dni)
   - Upload zdjęcia + notatka + geolokalizacja w polu
   - Diagnoza przez Gemma automatyczna
   - Historia scoutingu per pole
3. **Raporty PDF** (3 dni)
   - Template dla ubezpieczyciela (szkody)
   - Template dla doradcy agronomicznego
   - Template dla ARiMR (zestawienie zabiegów)
4. **Sentinel-1 radar** (4 dni)
   - Fetch przez CDSE Process API
   - Interpretacja: detect wycięcia, zalania, wyleganie
   - Fallback gdy Sentinel-2 ma >30% chmur
5. **Multi-index UI** (2 dni)
   - 4 karty na dashboardzie pola (NDVI / NDRE / NDWI / SAVI)
   - Sparkline historia każdego
   - Interpretacja agronomiczna (z lib/satellite/indices.ts)
6. **Production hardening** (5 dni)
   - Email verify + password reset
   - Sentry + Plausible
   - Rate limit na każdym API
   - Zod env validation
   - Vercel production deploy
7. **WhatsApp Business Cloud** (5 dni)
   - Meta verification
   - Template messages PL
   - Webhook 2-way conversation
8. **Ortofotomapy GUGiK** (2 dni)
   - Dodać jako layer w MapLibre (25 cm PL)
   - Szybszy niż ESRI dla zoom >17 w Polsce

**Total Q2: ~32 dni pracy** = 6-7 tygodni przy solo + agent

### Q3 2026 (lipiec-wrzesień) — PREMIUM LAUNCH
**Cel:** Launch premium tier (~30 zł/ha/rok), 500 rolników.

1. **Planet Labs PlanetScope integration** (7 dni)
   - API subscription (NICFI program free dla tropiku + komercyjne dla reszty)
   - UI tier gate
   - 3m daily NDVI dla premium
2. **Drone upload + stitching** (14 dni)
   - Endpoint dla ZIP z Mavic 3M
   - OpenDroneMap pipeline serverless
   - Auto-NDVI z multispectral bands
3. **Variable Rate Nitrogen prescription** (10 dni)
   - NDRE → N prescription zones
   - Export ISO-XML TaskFile dla ISOBUS maszyn
   - Shapefile dla starszych
4. **Yield prediction ML** (12 dni)
   - NASA Prithvi foundation model
   - Historia S-2 + plon z księgi polowej
   - Prognoza 30 dni przed zbiorem
5. **Auto-field segmentation** (5 dni)
   - SAM2 (Meta) albo Gemma 4 segmentation
   - Klik na mapie → granica pola w 2 sek
6. **Thermal stress Landsat 8/9 TIRS** (4 dni)
   - Temperatura powierzchni liścia
   - Alert wczesny stres termiczny

**Total Q3: ~52 dni pracy**

### Q4 2026 (październik-grudzień) — SCALE
**Cel:** 2000 rolników, integracje partnerskie, pierwszy grant EU.

1. **Parametric weather insurance** (14 dni)
   - Partnerstwo z reinsurerem (Swiss Re Corporate Solutions)
   - Alert + auto-roszczenie w razie suszy/przymrozku
2. **Marketplace plonów** (14 dni)
   - Rolnik wystawia wolumen pszenicy/rzepaku
   - Kupujący (młyny, skupy) subskrybują
   - Escrow + auto-fakturowanie
3. **ISOBUS integracje** (14 dni)
   - John Deere Operations Center API partnership
   - CNH AFS Connect, AGCO Fuse
   - Upload danych z maszyny → AgriClaw księga polowa
4. **IoT sensory glebowe** (10 dni)
   - Sensoterra LoRaWAN partnership
   - Stevens Hydra 3 integration
   - Real-time soil moisture per point
5. **Marketplace nawożenia i środków** (10 dni)
   - Partnerstwo z Osadkowski, Bayer PL
   - Wystawki rekomendowanych środków z AgroAgent
   - Prowizja 5-10% (revenue share)

**Total Q4: ~62 dni pracy**

---

## 6. Technical debt + security

- [ ] Migracje Prisma zamiast `db:push` (production safety)
- [ ] Next.js 16 upgrade (Cache Components, proxy.ts)
- [ ] pnpm workspace zamiast single package (monorepo dla mobile app w Fazie 5)
- [ ] E2E Playwright tests dla critical paths
- [ ] Lighthouse CI (performance budget)
- [ ] OpenTelemetry tracing
- [ ] Rate limit per-user (obecnie per-IP)
- [ ] CSP headers + security.txt
- [ ] Encryption at rest dla sensitive fields (phoneNumber, apiKey)
- [ ] Audit log dla admin actions
- [ ] GDPR data export + deletion flows
- [ ] Backup strategy (Neon PITR + weekly dump do Vercel Blob)
- [ ] DR runbook (disaster recovery playbook)

---

## 7. Decyzja: co budujemy NAJPIERW (następne 7 dni)

**Top 5 Quick Wins (kolejne commity):**
1. **Sentinel-1 radar integration** — Polska ma dużo chmur, Sentinel-2 często niedostępny. Radar działa zawsze. Różnicuje nas vs OneSoil/SatAgro.
2. **Ksiega polowa v0** — schema + formularz + export CSV. Prawny obowiązek UE, każdy rolnik >10 ha MUSI to mieć.
3. **Multi-index UI** (NDVI/NDRE/NDWI/SAVI widget) — dane już mamy w DB, tylko UI. 2h pracy.
4. **Scouting (foto w polu)** — diagnoza kamera już istnieje, dodaj historia per pole + pinezka na mapie.
5. **Ortofotomapy GUGiK** — 25 cm dla PL, dodać jako MapLibre source alongside ESRI.

---

## 8. Rzeczy do zbadania (research gaps — agenty lecą)

- [ ] `docs/research/satellite-catalog-2026.md` — agent a-X leci (katalog satelitarny)
- [ ] `docs/research/eu-pl-regulations-2026.md` — agent a-Y leci (regulacje UE+PL)
- [ ] `docs/research/field-register-spec.md` — agent a-Y leci (spec księgi polowej)
- [ ] `docs/competition/global-competition-2026.md` — wcześniejszy research agent (jeszcze leci)
- [ ] `docs/competition/poland-market-grants-2026.md` — j.w.
- [ ] `docs/competition/feature-matrix.md` — j.w.
- [ ] `docs/competition/agriclaw-gap-analysis.md` — j.w.
- [ ] `docs/competition/roadmap-recommendation.md` — j.w.

Po dociągnięciu researchu — zaktualizuję ten dokument i wydzielę konkretne tiketyImplementacyjne.

---

## 9. North Star Metric + business model

**NSM:** Liczba aktywnych gospodarstw × średnia liczba zabiegów zarejestrowanych miesięcznie. To łączy retencję (rolnik wraca) + głębokość użycia (ufa apce żeby wpisywać zabiegi = księga polowa).

**Model cenowy (do walidacji):**
- **Hobbyista** (0-5 ha): darmowy forever. 1 agent AI, podstawowy NDVI, księga polowa podstawowa.
- **Standard** (5-50 ha): 15 zł/ha/rok. Pełne NDVI/NDRE/NDWI/SAVI + radar S-1, eksport ARiMR, WhatsApp alert.
- **Premium** (50-500 ha): 25 zł/ha/rok. Planet 3m daily, drone upload, prescription, multi-user.
- **Enterprise** (>500 ha + kooperatywa): ~20 zł/ha/rok + minimum 10k zł/rok. White label, API dostęp, SLA.

Przykład: gospodarstwo 100 ha na Standard = 1500 zł/rok = 125 zł/mies. W Climate FieldView to $1.50/ha/mies = ~540 zł/mies dla 100 ha (4× drożej).

---

## 10. Log aktualizacji tego dokumentu

- 2026-04-18: draft początkowy. Snapshot obecnego stanu + roadmap Q2-Q4 + 10 moatów + katalog satelit.
- [następny update po research agents] — dociągnięcie konkretnych liczb rynku + cen konkurencji.
