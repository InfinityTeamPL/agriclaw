# AgriClaw — Globalna Analiza Konkurencji w Precision Agriculture, Satellite Monitoring i AI Advisory
**Stan na: kwiecień 2026**
**Autor:** Infinity Team (competitive intelligence)
**Wersja:** 1.0

---

## Spis treści

1. [Streszczenie zarządcze (Executive Summary)](#1-streszczenie-zarządcze-executive-summary)
2. [Metodologia badania](#2-metodologia-badania)
3. [Obszar A — Big Tech Agri Platforms](#3-obszar-a--big-tech-agri-platforms)
   - 3.1 John Deere Operations Center + See & Spray
   - 3.2 Climate FieldView (Bayer)
   - 3.3 Trimble Agriculture / PTx Trimble
   - 3.4 CNH Industrial / AFS Connect / FieldOps
   - 3.5 AGCO / Fuse Technologies / Precision Planting
4. [Obszar B — Satellite-first Startups & Scaleups](#4-obszar-b--satellite-first-startups--scaleups)
   - 4.1 Satellogic
   - 4.2 Planet Labs (PlanetScope / NICFI / Crop Biomass)
   - 4.3 EOS Data Analytics / EOS SAT
   - 4.4 OneSoil
   - 4.5 Taranis
   - 4.6 Syngenta Cropwise (ex-FarmShots)
   - 4.7 Cropwise Operations (ex-Cropio)
   - 4.8 Agremo
   - 4.9 Prospera Technologies (Valmont/Valley)
   - 4.10 Ceres Imaging / Ceres AI
   - 4.11 Bushel Farm (ex-FarmLogs)
   - 4.12 xarvio FIELD MANAGER (BASF)
   - 4.13 SatAgro (Polska)
   - 4.14 Cropler (Polska)
5. [Obszar C — AI-Agent Startups 2025–2026](#5-obszar-c--ai-agent-startups-20252026)
   - 5.1 Farmer.CHAT (Digital Green + Gooey.AI)
   - 5.2 Kheti Buddy
   - 5.3 Cropin + Cropin Sage (Google Gemini)
   - 5.4 Arable Labs (Mark 3)
   - 5.5 Agrobase (Farmis)
   - 5.6 Farmonaut (Jeevn AI)
   - 5.7 eAgronom
   - 5.8 Nowe rundy finansowe 2025–2026
6. [Obszar D — WhatsApp-First / Emerging Markets](#6-obszar-d--whatsapp-first--emerging-markets)
   - 6.1 DeHaat (Indie)
   - 6.2 AgroStar / BharatAgri / Gramophone
   - 6.3 Apollo Agriculture (Kenia)
   - 6.4 Hello Tractor
   - 6.5 Twiga Foods
   - 6.6 Ignitia
   - 6.7 FarmerAI (Safaricom + Opportunity International)
7. [Macierz pozycjonowania (Positioning Matrix)](#7-macierz-pozycjonowania-positioning-matrix)
8. [TOP 5 brakujących u nas features](#8-top-5-brakujących-u-nas-features)
9. [TOP 3 nasze unikalne przewagi](#9-top-3-nasze-unikalne-przewagi)
10. [Blue Ocean gaps — funkcje których NIKT nie oferuje](#10-blue-ocean-gaps--funkcje-których-nikt-nie-oferuje)
11. [Rekomendacje strategiczne](#11-rekomendacje-strategiczne)
12. [Załącznik A — tabela źródeł](#12-załącznik-a--tabela-źródeł)

---

## 1. Streszczenie zarządcze (Executive Summary)

### Krajobraz konkurencji w kwietniu 2026

Rynek precyzyjnego rolnictwa 2026 to krajobraz dwubiegunowy. Z jednej strony — konsolidacja i powolne tempo innowacji wśród OEM-ów (John Deere, CNH, AGCO), gdzie platformy cyfrowe są głównie "dodatkiem do maszyny". Z drugiej — eksplozja startupów AI-agent (Cropin Sage, Farmer.CHAT, FarmerAI, Taranis Ag Assistant), które próbują zastąpić lub uzupełnić klasycznego agronoma przez LLM-y.

**Najważniejsze trendy (kwiecień 2026):**

1. **Modele LLM + agri-data stają się mainstreamem**. Cropin uruchomił Sage z Gemini (lipiec 2024), Syngenta dodała Cropwise AI, Taranis ma Ag Assistant, a Digital Green operuje Farmer.CHAT na 830k+ użytkowników ([źródło: Digital Green](https://digitalgreen.org/farmer-chat/)).
2. **WhatsApp/SMS wygrywa jako UI dla smallholder farmers** w Azji i Afryce. FarmerAI (Safaricom + Opportunity International) ([źródło: TechAfrica News](https://techafricanews.com/2025/02/11/ai-meets-agriculture-as-safaricom-and-opportunity-international-unveil-farmerai/)), Ignitia SMS (2M farmerów), Farmer.CHAT WhatsApp — zachodnie platformy (FieldView/Deere) całkowicie ignorują ten kanał.
3. **Big Tech odchodzi od modelu "darmowe platformy"**. Deere w lipcu 2025 wprowadził Operations Center **PRO** (płatna subskrypcja) ([źródło: Farm Equipment](https://www.farm-equipment.com/articles/21052-john-deere-introduces-operations-center-pro-for-ag-retailers)). FieldView Plus = $299/rok, Premium = $799/rok ([źródło: Nerdisa](https://nerdisa.com/climate/)).
4. **Rynek agritech finansowania w 2026 wciąż jest słaby** — $771M w funduszach equity do kwietnia 2026, spadek 2% YoY wobec 2025, ale mediana dealu wzrosła — inwestorzy są selektywni ([źródło: Tracxn](https://tracxn.com/d/sectors/agritech/__8-OCx7Zf21c5QYzq6iONRd31GtL5haydTw9qIEP-m3o)).
5. **Europa/Polska to white space dla WhatsApp-first AI agronomów**. SatAgro obsługuje "1%+ polskich upraw" ([źródło: SatAgro](https://satagro.pl/)), eAgronom ma ~300k ha w Polsce ([źródło: Agronomist](https://agronomist.pl/articles/poland-the-eagronom-platform)), xarvio ma 130k rolników globalnie — ALE żaden nie oferuje rozmowy przez WhatsApp w języku polskim z pełnym kontekstem pola, pogody i historii.

### Gdzie AgriClaw wpisuje się w ten krajobraz?

AgriClaw (agentic WhatsApp-first AI agronom dla Polski) **trafia w lukę**, która jest wyjątkowo przestrzenna:
- Zachodnie platformy (FieldView/Deere/Trimble) są zbyt drogie, zbyt OEM-centryczne i bez WhatsApp/PL.
- Indyjskie/afrykańskie AI chatboty (Farmer.CHAT, FarmerAI) są geograficznie ograniczone i nie znają polskich upraw (rzepak, pszenica ozima, burak cukrowy, kukurydza na kiszonkę).
- Polskie alternatywy (SatAgro, Cropler, eAgronom) są albo web-only, albo hardware-heavy, albo bez agentic AI.

**Blue ocean:** Agentic AI w języku polskim, WhatsApp-first, rule-based + LLM recommendations na mikroskali pola, z integracją CDSE Sentinel-2 za darmo (nie Planet/WorldView za grube miliony).

---

## 2. Metodologia badania

Badanie wykonano w kwietniu 2026 w oparciu o:
- **WebSearch** (Google/Bing): ~30 zapytań po angielsku i polsku
- **Źródła publiczne**: TechCrunch, AgFunderNews, PR Newswire, strony produktów, Crunchbase, Tracxn, PitchBook, G2, Capterra, TrustRadius
- **Fokus**: dane finansowe (Series/revenue), features, user base, pricing
- **Ograniczenia**: pricing wielu B2B SaaS jest na "request-a-quote" (FieldView Premium, CropX, CropIn Sage), więc oznaczam estymaty. Liczby hektarów pochodzą z marketingu firm (mogą być zawyżone).

---

## 3. Obszar A — Big Tech Agri Platforms

### 3.1 John Deere Operations Center + See & Spray

| Pole | Dane |
|---|---|
| **Nazwa** | John Deere Operations Center |
| **URL** | https://operationscenter.deere.com/ |
| **Kraj** | USA (Moline, IL) |
| **Founded (parent)** | 1837 (Deere & Company) |
| **Operations Center launch** | 2013 |
| **Ostatnia runda** | Publicly traded (NYSE: DE); market cap ~$130B (Q1 2026) |
| **Model cenowy** | **Operations Center**: FREE dla wszystkich ([źródło: Landmark Implement](https://landmarkimp.com/precision-ag/ops-center/)); **Operations Center PRO** (launched 31 lipca 2025): annual subscription (ceny nieujawnione, "starts at several thousand USD" dla retail) ([źródło: Farm Equipment](https://www.farm-equipment.com/articles/21052-john-deere-introduces-operations-center-pro-for-ag-retailers)) |
| **See & Spray** | $1/acre na fallow, $5/acre na in-crop; new dla 2026: "Unlimited Annual License" dla high-use ([źródło: Robotics & Automation News](https://roboticsandautomationnews.com/2025/11/05/john-deere-customers-use-autonomous-see-spray-technology-across-5-million-acres-in-2025/96266/)) |

#### Core value prop
**"One place for all farm data + autonomous weed spraying integrated with Deere equipment."**

#### Kluczowe features
- Real-time monitoring maszyn Deere (update co 30s przez JDLink) ([źródło: Design News](https://www.designnews.com/automation/build-a-better-automated-farm-with-the-john-deere-operations-center))
- Planowanie prac, mapy rodovej, sustainability tools (carbon intensity, soil health, fuel emissions)
- Work orders, prescription maps, variable rate application
- See & Spray: kamery na belach boomowych, AI identyfikuje chwasty, skanowanie 2500 sq ft/s przy 15 mph ([źródło: RDO Equipment](https://www.rdoequipment.com/resources/blogs/overview-of-john-deere-see-and-spray))
- 5 mln acres w See & Spray 2025 → oszczędność ~50% herbicydów ([źródło: AgTech Navigator](https://www.agtechnavigator.com/Article/2025/11/10/john-deere-uses-ai-to-slash-farmers-input-costs/))
- Integracja z 150+ partnerami (FieldView, Bushel, Trimble itd.)

#### Użytkownicy / hektary
Oficjalnie nie ujawnione, ale szacunkowo >1M farmerów na świecie. See & Spray — 5M acres (2 mln ha) w 2025.

#### Źródła danych satelitarnych
**Brak własnej konstelacji satelitarnej.** Integracja z third-party (Planet, EOS, Climate via Field-to-Market). Focus na machine telemetry, nie satelita.

#### Poland / EU obecność
- Mocna obecność dealerska (John Deere Polska Sp. z o.o.) ([źródło: Machinefinder](https://www.machinefinder.com/ww/en-US/dealer-organizations/990157))
- Ośrodek szkoleniowy w Polsce dla dealerów z krajów bałtyckich, Ukrainy, Czech, Słowacji ([źródło: Global Dealer Locator](https://dealerlocator.deere.com/servlet/country=PL?locale=pl_PL))
- Operations Center w języku polskim dostępny
- Brak pełnego polsko-centricznego advisora AI

#### Słabości (user reviews)
- Platforma **wybitnie Deere-centryczna**: farmerzy z mieszanymi flotami (Case, Fendt, Claas) mają pogorszony UX
- Forum Iowa: "Iowa farms are re-evaluating how they use John Deere Operations Center" (luty 2026) — rosnące niezadowolenie z centralizacji danych i opłat PRO ([źródło: KXEL](https://kxel.com/2026/02/04/iowa-farms-are-re-evaluating-how-they-use-john-deere-operations-center/))
- Brak lokalnego AI-agenta (tylko dashboard); brak WhatsApp
- See & Spray wymaga kosztownego ciągnika/samojezdnego z ExactApply

#### Co mają czego MY NIE MAMY
- Integracja z maszynami w czasie rzeczywistym (ISOBUS, CAN bus, telemetria silnika)
- Prescription maps przesyłane bezpośrednio do ciągnika
- See & Spray (computer vision na chwasty)
- Ogromny ekosystem partnerów (150+)
- Lokalni dealerzy ze wsparciem serwisowym

#### Co MY mamy czego ONI NIE MAJĄ
- WhatsApp conversational interface w języku polskim
- Wolność od bindowania do konkretnej marki maszyn
- Niski próg wejścia (brak wymogu zakupu Deere)
- Agentic reasoning (nie tylko prescription, ale "dlaczego i co dalej?")

---

### 3.2 Climate FieldView (Bayer / Monsanto)

| Pole | Dane |
|---|---|
| **Nazwa** | Climate FieldView |
| **URL** | https://climate.com/ |
| **Kraj** | USA (San Francisco — The Climate Corporation, część Bayer Crop Science) |
| **Founded** | 2006 (jako The Climate Corporation); acq Monsanto 2013 ($1.1B); acq Bayer via Monsanto 2018 |
| **Ostatnia runda** | Cześć Bayer AG (DE:BAYN), jednostka Crop Science |
| **Model cenowy** | FieldView Plus = **$299/rok**, FieldView Premium = **$799/rok** (billed annually) ([źródło: Nerdisa review](https://nerdisa.com/climate/)) |

#### Core value prop
**"Centralize planting, harvesting, spraying, scouting data — turn farm info into answers."**

#### Kluczowe features
- Real-time field maps (harvest, plant, spray) rysowane w czasie jazdy
- "Your Farm at a Glance" — summary dashboard ([źródło: Bayer](https://www.bayer.com/en/us/news-stories/fieldview-features))
- Yield Analysis by Application (ROI per fertilizer/pesticide)
- FieldView Drive 2.0 — hardware dongle do ciągnika (Bluetooth)
- Integracja z Deere, Case IH, AGCO; obsługa 50+ marek monitorów
- Planting & Application Reports (nowe dla 2026)

#### Użytkownicy / hektary
**220 million subscribed acres** (ok. 89 mln ha) w USA, Brazylii, Kanadzie, Argentynie, Ukrainie, RPA, Europie ([źródło: MKC Coop](https://www.mkcoop.com/mkc-blog/march-2025/maximize-your-digital-farming-with-climate-fieldvi)).

#### Źródła danych satelitarnych
Hybrid — własne dane hyperlocal weather, integracja z Sentinel-2, wcześniej nabyty Sentera (drony), Planet Labs licencjonowane. Brak własnej konstelacji.

#### Poland / EU obecność
- **Europa via VitalFields**: dostępny w Niemczech, **Polsce**, Austrii, Estonii, Rumunii, Szwajcarii ([źródło: Feedstuffs](https://www.feedstuffs.com/agribusiness-news/climate-corp-expands-into-europe))
- FieldView główna platforma: Niemcy, Francja, Ukraina
- Niedoinwestowany polski rynek — VitalFields jest cieniem FieldView

#### Słabości (G2, TrustRadius, Combine Forum)
- **App crashes często** (szczególnie na nowych Androidach) ([źródło: Apple App Store](https://apps.apple.com/us/app/climate-fieldview/id797902820))
- "Terrible support, empty promises" — użytkownicy czekali 6+ miesięcy na follow-up
- Interface trudny, loading data confusing
- **Nie można edytować/usuwać pól z telefonu**
- Dokładność opadów rozbieżna z rain gauges o 3-5/10 cala
- **Obawy o prywatność danych** ("What is Climate doing with farmer data?") ([źródło: G2 Reviews](https://www.g2.com/products/climate-fieldview/reviews))

#### Co mają czego MY NIE MAMY
- Integracja z 50+ monitorami w ciągnikach (Deere, Case, AGCO)
- Variety trials / hybrid comparison (Bayer ma własne nasiona)
- Field View Drive hardware (plug-and-play telemetria)
- Skala danych — 220M acres = największy dataset na świecie

#### Co MY mamy czego ONI NIE MAJĄ
- Języ k polski z pełnym kontekstem (lokalne choroby, schematy EKOSCHEMATY, ARiMR)
- WhatsApp UI (FieldView jest mobile/web only)
- Niezależność od sprzedaży nasion/środków Bayer
- Agentic proactive recommendations — FieldView jest reactive dashboard

---

### 3.3 Trimble Agriculture / PTx Trimble

| Pole | Dane |
|---|---|
| **Nazwa** | Trimble Agriculture (rebrand: PTx Trimble w 2024, JV z AGCO) |
| **URL** | https://ww2.agriculture.trimble.com/ + https://ptxtrimble.com/en |
| **Kraj** | USA (Sunnyvale/Westminster, CO) |
| **Founded** | 1978 (Trimble); PTx Trimble JV z AGCO ogłoszone 2023 |
| **Ostatnia runda** | NASDAQ: TRMB (publiczna, market cap ~$15B Q1 2026) |
| **Model cenowy** | FarmENGAGE Data (basic connectivity), FarmENGAGE Operations, **Farmer Pro** (najpotężniejszy mobile/web SW — pricing custom per dealer, typowo $500-$2000/rok) ([źródło: PTx Trimble](https://www.ptxtrimble.com/en/products/software/trimble-agriculture-software)) |

#### Core value prop
**"Mixed-fleet precision ag: guidance, steering, planting, spraying optimized regardless of OEM."**

#### Kluczowe features
- **GFX/XCN in-cab displays** + RTK autoguidance
- Farmer Pro: Crop Health Imagery (Sentinel-2 + Landsat), Work Orders, grid/zone soil sampling, grain contract management ([źródło: Trimble Agriculture](https://ww2.agriculture.trimble.com/software/software-comparison-chart/))
- **AFS Connect via integrację** z JV
- FarmENGAGE dla mixed fleet (kluczowa przewaga vs Deere)
- Guidance ISOBUS, ASC Vector Pro receiver

#### Użytkownicy
Nie ujawnione publicznie; estymaty: setki tysięcy maszyn z Trimble displays globalnie.

#### Źródła satelitarne
Sentinel-2, Landsat, własne integracje z Planet, czasami drony.

#### Poland / EU obecność
**Vantage Polska** — oficjalny dystrybutor PTx Trimble w Polsce ([źródło: Vantage Polska](https://vantagepolska.pl/platforma-obserwacji-satelitarnych-sat-agro/)). Partnerstwo z SatAgro — ciekawe, bo Trimble używa polskiej platformy SatAgro do obserwacji satelitarnych.

#### Słabości
- Pricing bardzo nieprzejrzysty (per dealer, custom quotes)
- Silny hardware-lock (kupując GFX display, płacisz za updates)
- UX archaiczny vs FieldView
- Wyższy próg technicznej wiedzy (precision ag dla "pro" segment)

#### Co mają czego MY NIE MAMY
- RTK autoguidance / auto-steer hardware
- Mixed-fleet dashboards
- Ecosystem dealerów serwisowych w Polsce (Vantage)
- Grain marketing tools

#### Co MY mamy czego ONI NIE MAJĄ
- Conversational AI (Trimble = dashboard + maszyny)
- Lokalna polska treść, rekomendacje ekoschematów
- Brak wymogu $5k+ hardware

---

### 3.4 CNH Industrial / AFS Connect / FieldOps

| Pole | Dane |
|---|---|
| **Nazwa** | AFS Connect (Case IH) + FieldOps (New Holland) — wspólna platforma digital CNH |
| **URL** | https://www.caseih.com/en-us/unitedstates/products/advanced-farming-systems/afs-connect |
| **Kraj** | UK/Włochy (CNH Industrial N.V., Basildon UK; Torino IT) |
| **Founded** | 2013 (CNH Industrial spinoff z Fiat) |
| **Ostatnia runda** | NYSE: CNH (public) |
| **Model cenowy** | **Connectivity Included** (brak subskrypcji na modem przez cały życia maszyny) ([źródło: CNH Media](https://media.cnh.com/north-america/nha-p-products/new-holland-introduces-digital-technology-enhancements-for-customers-worldwide--including-fieldops--/s/5e3f7235-2624-4df4-98b1-be0c5be578b8)) |

#### Core value prop
**"Full lifetime connectivity + mixed-fleet farm mgmt via web/mobile, integrated with Case/NH tractors."**

#### Kluczowe features
- AFS Pro 1200 in-cab 12" display, remote display viewing (dealer/manager może widzieć ekran operatora)
- AFS Vector Pro receiver (WAAS/RTK)
- 2025 Tech Day (listopad 2025): autonomous tractors, AI-based agronomy, mixed-fleet ([źródło: CNH Investor Relations](https://investors.cnh.com/news/news-details/2025/CNH-2025-Tech-Day-showcasing-customer-centric-farming-innovations-across-AI-Autonomy-Robotics-and-Automation/default.aspx))
- Integracja z **xarvio** (BASF) — CNH połączył z xarvio Field Manager ([źródło: BASF](https://promotions.basf.com/news-and-releases/xarvio%C2%AE-digital-farming-solutions-expands-its-platform-connectivity-options-for-farmers-with-cnh-integration))

#### Użytkownicy / hektary
Nie ujawnione, ale CNH to ~15% rynku ciągników globalnie — setki tysięcy maszyn połączonych.

#### Źródła satelitarne
Sentinel-2 via integrację z xarvio i third-party.

#### Poland / EU obecność
Silna (Case IH i New Holland mają mocne dealerzy w Polsce). Polska to jeden z top-3 rynków rolniczych w Europie dla CNH.

#### Słabości
- UX AFS Connect trudniejszy niż Deere
- Silny lock-in do maszyn Case/NH
- Brak conversational AI
- Skromniejsze integracje niż Deere Operations Center

#### Co mają czego MY NIE MAMY
- Lifetime free connectivity (ważna przewaga cenowa)
- Remote display viewing (dealer widzi ekran operatora)
- Mocne partnerstwo z xarvio BASF
- Plan autonomous tractors 2025-27

#### Co MY mamy czego ONI NIE MAJĄ
- AI advisor conversational (nie "dashboard")
- Polski kontekst agronomiczny
- WhatsApp UI

---

### 3.5 AGCO / Fuse Technologies / Precision Planting

| Pole | Dane |
|---|---|
| **Nazwa** | AGCO Fuse Technologies (Massey Ferguson, Fendt, Valtra, Challenger + Precision Planting) |
| **URL** | https://www.masseyferguson.com/en_us/farming-technology/fuse.html |
| **Kraj** | USA (Duluth, GA) |
| **Founded** | 1990 (AGCO); Fuse launched 2012; Precision Planting acq 2017 |
| **Ostatnia runda** | NYSE: AGCO (market cap ~$7B Q1 2026) |
| **Model cenowy** | Precision Planting hardware + usługi subskrypcyjne; Fuse connected services = annual per-machine fee |

#### Core value prop
**"Mixed-fleet friendly precision farming, focusing on planting precision (20|20 SeedSense, vSet, vDrive) + AI spraying (SymphonyVision)."**

#### Kluczowe features
- **Precision Planting**: 20|20 SeedSense (monitor planting), vSet (planters), vDrive (electric drives), SpeedTube, WaveVision, DeltaForce ([źródło: AGCO](https://investors.agcocorp.com/news-releases/news-release-details/c-o-r-r-e-c-t-i-o-n-agco-corporation-0))
- **SymphonyVision** — AI-based targeted spraying (reduce chemicals up to 70%)
- **RowPilot** — AI mechanical weeding
- Fuse Connected Services (telemetry, RDT remote diagnostics)
- Partnership z PTx Trimble (guidance + steering)

#### Użytkownicy
Precision Planting zainstalowano na >100k planterów globalnie.

#### Źródła satelitarne
Sentinel-2 via integracje, focus bardziej na in-cab sensors niż satelita.

#### Poland / EU obecność
Mocna (Fendt, MF, Valtra dealerzy). Polska to silny rynek Fendt.

#### Słabości
- Fragmentacja marek (MF, Fendt, Valtra, Challenger) — każda marka ma trochę inne displays
- Brak centralnej platformy data-lake jak Deere Operations Center
- Fuse nie jest tak rozpoznawalny jak FieldView/Deere

#### Co mają czego MY NIE MAMY
- SymphonyVision (green-on-green / green-on-brown spraying AI)
- Precision Planting hardware (najlepsze na rynku do siewu)
- RowPilot mechanical weeding

#### Co MY mamy czego ONI NIE MAJĄ
- Conversational advisor
- Polski UX
- Brak wymogu hardware

---

## 4. Obszar B — Satellite-first Startups & Scaleups

### 4.1 Satellogic

| Pole | Dane |
|---|---|
| **Nazwa** | Satellogic Inc. |
| **URL** | https://satellogic.com/ |
| **Kraj** | Argentyna (HQ) + USA (listed) |
| **Founded** | 2010 |
| **Ostatnia runda** | NASDAQ: SATL (SPAC w 2021, market cap ~$180M Q1 2026) |
| **Revenue 2025** | **$17.7M FY 2025** (+38% YoY); Q4 2025: $6.2M (+94% YoY) ([źródło: Satellogic IR](https://investors.satellogic.com/news-releases/news-release-details/satellogic-reports-fourth-quarter-and-full-year-2025-financial)) |
| **Model cenowy** | Tasking-based, data licensing API, per-km² imagery fees (enterprise, ~$3-10/km²) |

#### Core value prop
**"Sub-meter (50cm) multispectral imagery, intraday revisits, tasking-to-delivery in <3h — cheaper than Maxar."**

#### Kluczowe features
- Konstelacja **19 NewSat satellites** z 50cm resolution
- 11 spectral bands
- Merlin satellites (launching October 2026) — skok z "hundreds" do "millions of sites monitored simultaneously" ([źródło: Space Intel Report](https://www.spaceintelreport.com/back-from-the-edge-geospatial-satellite-and-data-provider-satellogic-reports-38-revenue-boost-25-drop-in-opex-in-2025/))

#### Użytkownicy
Głównie rządy, obrona, duzi agribiznesy — nie farmerzy bezpośrednio.

#### Poland / EU obecność
Brak dedykowanej operacji w Polsce, ale dostępne via API/dealerów geospatial.

#### Słabości
- Cena — 50cm resolution drogi (~$5-10/km² dla on-demand)
- Revenue 2025 tylko $17.7M — mała skala
- Zmienny z SPAC era, restrukturyzacja kosztów 2024-25

#### Relacja do AgriClaw
**Nie konkurent bezpośredni** — Satellogic to data provider. Mógłby być dostawcą wysokorozdzielczych zdjęć dla premium tier AgriClaw, ale nie zastąpi Sentinel-2 (free) jako baseline.

---

### 4.2 Planet Labs (PlanetScope / NICFI / Crop Biomass)

| Pole | Dane |
|---|---|
| **Nazwa** | Planet Labs PBC |
| **URL** | https://www.planet.com/ |
| **Kraj** | USA (San Francisco) |
| **Founded** | 2010 |
| **Ostatnia runda** | NYSE: PL (IPO 2021 via SPAC, market cap ~$1B Q1 2026) |
| **Model cenowy** | Enterprise subscription (tiered by area monitored); NICFI tropical basemaps **free do kwietnia 2025** potem commercial; Agriculture Education program darmowy dla akademii |

#### Core value prop
**"Daily global imaging with ~200 cubesats. 3m resolution + daily revisit = best for time-series crop monitoring."**

#### Kluczowe features
- **PlanetScope**: 3.7m resolution, daily global coverage (~200 Dove satellites) ([źródło: Planet Agriculture](https://www.planet.com/industries/agriculture/))
- **SkySat**: 50cm tasking
- **NICFI Basemaps**: Norway-funded free basemaps 64 tropical countries (ended April 2025, transitioning to commercial)
- **Crop Biomass** product (updated 2025): fusion Sentinel-1 radar + Sentinel-2 optical + PlanetScope — daily time-series
- **Planet Insights Platform**: API/SDK (Python)
- **EU CAP Area Monitoring Service**: dla krajowych agencji płatniczych (ARiMR)

#### Użytkownicy / hektary
Planet: 900+ customers enterprise. Q2 FY2026: 150M km² land + 20M km² ocean daily ([źródło: Space Daily](https://www.spacedaily.com/reports/Planet_Labs_Enhances_Agricultural_Data_with_Daily_Global_PlanetScope_Insights_999.html)).

#### Źródła danych
200+ Doves + 20 SkySats + licencjonowane dane Sentinel/Landsat

#### Poland / EU obecność
Silna — Planet obsługuje **EU CAP Area Monitoring Service dla krajowych agencji płatniczych** ([źródło: Planet Government](https://www.planet.com/industries/government/agriculture-monitoring/cap/)). Oznacza to że ARiMR może być klientem Planet. Dostępne komercyjnie w PL przez partnerów.

#### Słabości
- Cena — enterprise subscription $10k-$1M+/rok, nieosiągalne dla indywidualnych farmerów
- Skupienie na rządowych/enterprise — brak direct-to-farmer UI
- 3m resolution gorsze niż Satellogic (50cm) czy Maxar (30cm)
- Zakończenie darmowego NICFI w kwietniu 2025

#### Co mają czego MY NIE MAMY
- Własna konstelacja (200+ sat) — niezależność od ESA
- 3m resolution vs nasze 10m Sentinel-2
- Daily revisit vs 5-day Sentinel-2

#### Co MY mamy czego ONI NIE MAJĄ
- Direct-to-farmer conversational AI (Planet to raw data provider)
- Polska/EU CAP-specific rule engine (ekoschematy)
- WhatsApp UI

---

### 4.3 EOS Data Analytics / EOS SAT

| Pole | Dane |
|---|---|
| **Nazwa** | EOS Data Analytics (EOSDA) + EOS Crop Monitoring |
| **URL** | https://eos.com/ |
| **Kraj** | USA + Ukraina (założony przez Max Polyakov) |
| **Founded** | 2015 |
| **Ostatnia runda** | Privately held, prywatna grupa Noosphere Ventures |
| **Model cenowy** | SaaS Crop Monitoring (tiers): Free Trial → paid per-hectare (~$0.40-$2/ha/rok w zależności od tier) ([źródło: SaaSWorthy](https://www.saasworthy.com/product/eos-crop-monitoring)) |

#### Core value prop
**"First agriculture-focused satellite constellation (EOS SAT) + AI crop analytics SaaS."**

#### Kluczowe features
- **EOS SAT**: konstelacja 7 satelitów (EOS SAT-1 launched 3 stycznia 2023), full ops by 2025, agri-focused 11 band channels, 1.4m pan / 2.8m MS resolution, 3-day revisit ([źródło: EOS SAT Tech](https://eos.com/blog/eos-sat-agro-focused-constellation-tech-overview/))
- EOS Crop Monitoring: NDVI, soil moisture, growth stage, weather forecasts (14-day + historical), vegetation/productivity maps, VRA ([źródło: EOS Agriculture](https://eos.com/products/crop-monitoring/agriculture-monitoring/))
- Dashboard + API + mobile app
- Crop classification, productivity mapping

#### Użytkownicy
Marketing twierdzi, że obsługuje "farmers across 100+ countries"; konkretne liczby nie ujawnione.

#### Źródła satelitarne
Własne EOS SAT + Sentinel-2 + Landsat + MODIS

#### Poland / EU obecność
Dostępne globalnie przez platformę web, UI polski niepewny (raczej EN). Brak dedykowanego biura w Polsce.

#### Słabości
- Ukraina HQ — implikacje geopolityczne (niektórzy klienci EU niepewni)
- UX ambitny, ale bywa clunky
- Lokalizacja treści ograniczona
- Brak conversational AI (dashboard-only)

#### Co mają czego MY NIE MAMY
- **Własna konstelacja agri-focused satellites**
- 1.4m resolution vs 10m Sentinel-2
- 3-day revisit
- Global coverage

#### Co MY mamy czego ONI NIE MAJĄ
- Polski język + lokalne rekomendacje
- WhatsApp
- Agentic conversational

---

### 4.4 OneSoil

| Pole | Dane |
|---|---|
| **Nazwa** | OneSoil |
| **URL** | https://onesoil.ai/en |
| **Kraj** | Szwajcaria (HQ Zurich) + R&D Europe |
| **Founded** | 2017 (Belarus origin) |
| **Ostatnia runda** | Niepubliczne — prywatna, szacunki $10-15M |
| **Model cenowy** | **Free** dla app (web + mobile); **OneSoil Pro** — płatny enterprise tier (custom pricing) |

#### Core value prop
**"Free satellite-based farming app for precision agriculture + Pro tier for agribusinesses."**

#### Kluczowe features
- Free app: NDVI maps, weather monitoring, field scouting, crop rotation planning ([źródło: OneSoil](https://onesoil.ai/en))
- Field auto-detection z satelity
- Weather alerts
- OneSoil Pro: prescription maps, yield forecasting, enterprise features
- Afryka: 70% wzrost w 2025 po lokalnym zespole ([źródło: OneSoil blog](https://blog.onesoil.ai/onesoils-two-year-journey-transforming-digital-agriculture-in-africa/))

#### Użytkownicy / hektary
**300k+ farmerów globalnie**, **56M+ hektarów** w aplikacji (5% world arable land). 100k ha "activated" w 2025.

#### Źródła satelitarne
Sentinel-2 (primary), Landsat

#### Poland / EU obecność
Dostępne globalnie. Aplikacja mobile dostępna w 28+ językach (nie potwierdzono polski jako native). Europa Wschodnia to home market.

#### Słabości
- **Brak AI agenta** — to głównie dashboard + NDVI
- Free tier dobry, ale Pro features są enterprise-level dla agribusinesses, nie solo farmers
- Brak WhatsApp
- Rosyjsko-belaruskie źródło dev team (niektórzy klienci EU ostrożni)

#### Co mają czego MY NIE MAMY
- Skala 300k farmerów
- Automatic field detection z satelity (bez ręcznego rysowania)
- Globalna apka w wielu językach
- Długi track record (2017)

#### Co MY mamy czego ONI NIE MAJĄ
- Conversational AI
- Polish-specific crop expertise (rzepak, pszenica, burak)
- WhatsApp UX
- Rule-based engine integrujący pogodę + NDVI + historię

---

### 4.5 Taranis

| Pole | Dane |
|---|---|
| **Nazwa** | Taranis |
| **URL** | https://www.taranis.com/ |
| **Kraj** | Izrael (Tel Aviv) + USA |
| **Founded** | 2015 |
| **Ostatnia runda** | **$40M Series D** (wrzesień 2022), total raised **$100M** ([źródło: PR Newswire](https://www.prnewswire.com/il/news-releases/taranis-raises-40-million-series-d-to-advance-crop-intelligence-and-unlock-growth-opportunities-for-agribusinesses-301616996.html)) |
| **Model cenowy** | **$15/acre/rok** annual subscription ([źródło: Capterra](https://www.capterra.com/p/201058/Taranis/)) |

#### Core value prop
**"Leaf-level crop intelligence (0.3mm/pixel drone imagery) — identifies weeds, diseases, insects, nutrient deficiencies."**

#### Kluczowe features
- **Submillimeter drone imagery** (0.3mm/pixel) — najmniejsza rozdzielczość na rynku
- AI identyfikacja chwastów, szkodników, chorób, niedoboru składników
- **Taranis Ag Assistant™** (launched 2024) — AI agent dla advisors/agronomów
- **AcreForward** (2023) — crop intelligence standard
- Partnership z **Syngenta Crop Protection** (październik 2025) na pokrycie US Midwest AI-powered agronomy ([źródło: AgroTech Space](https://agrotech.space/2025/10/13/syngenta-taranis-partnership-ai-crop-us/amp/))

#### Użytkownicy / hektary
"Millions of acres" globalnie; USA, Brazylia, Europa. Dokładne liczby nie ujawnione.

#### Źródła danych
Własne **drony + pilot planes** (mavrX acquisition) — nie satelita! To kluczowe odróżnienie.

#### Poland / EU obecność
Obecność w Europie (nie sprecyzowane które kraje); raczej przez retail/advisor partners niż direct-to-farmer.

#### Słabości
- **Bardzo drogi** — $15/acre/rok = ~$37/ha = wysoki próg
- Wymaga fizycznych overflights (samoloty + drony) — dostępność sezonowa
- B2B model (sprzedaje się przez retailerów, nie do rolnika)
- Brak WhatsApp/mobile-first UX

#### Co mają czego MY NIE MAMY
- 0.3mm/pixel leaf-level resolution (niesamowita dokładność)
- Weed species identification AI (nazwa gatunku, nie tylko "chwast")
- Pilot plane imagery (szerszy coverage niż drony)

#### Co MY mamy czego ONI NIE MAJĄ
- Satelita free (Sentinel-2) zamiast dronów ($$$)
- Direct-to-farmer (Taranis = B2B through retailers)
- WhatsApp UI
- Polski język

---

### 4.6 Syngenta Cropwise (ex-FarmShots)

| Pole | Dane |
|---|---|
| **Nazwa** | Syngenta Cropwise (platform); FarmShots acquired 2018, teraz część Cropwise |
| **URL** | https://www.cropwise.com/ |
| **Kraj** | Szwajcaria (Syngenta AG, Bazylea) |
| **Founded** | 2020 (Cropwise launch) |
| **Ostatnia runda** | Syngenta prywatna (part ChemChina, potential IPO delayed) |
| **Model cenowy** | Cropwise Grower **free app**; Cropwise Operations (ex-Cropio) — enterprise subscription; Cropwise Imagery — per-hectare |

#### Core value prop
**"Integrated crop management platform — from planning to harvest, one ecosystem."**

#### Kluczowe features
- **Cropwise Grower** (free) — product advisory, scouting, recommendations
- **Cropwise AI** (launched 2024 at World Agri-Tech Summit) — generative AI dla crop management
- **Cropwise Operations** (ex-Cropio) — field database, NDVI, records
- **Cropwise Imagery** (ex-FarmShots) — 8M+ acres satellite imagery
- November 2025: Cropwise opened to **third-party developers** ([źródło: Syngenta](https://www.syngenta.com/media/media-releases/2025/syngenta-opens-cropwise-digital-platform-developers-co-innovate-and))
- Integracja z Taranis (October 2025 partnership)

#### Użytkownicy / hektary
**>70M hectares** in 30+ countries ([źródło: AgTech Navigator](https://www.agtechnavigator.com/Article/2025/10/08/tech-insight-exploring-syngentas-cropwise-platform/))

#### Źródła satelitarne
Sentinel-2, Landsat, PlanetScope (licensed)

#### Poland / EU obecność
Silna — Syngenta ma silne partnerstwa w PL. Platforma dostępna w polskim UI.

#### Słabości
- Bindowanie do produktów Syngenta (nasiona, ŚOR)
- Cropwise Operations (ex-Cropio) ma stare UI
- Cropwise AI dopiero raczkuje

#### Co mają czego MY NIE MAMY
- 70M ha globalnie (skala)
- Partnerstwa z Taranis (AI leaf-level)
- Global footprint 30+ krajów
- Catalog products Syngenta (precisely recommended)

#### Co MY mamy czego ONI NIE MAJĄ
- Niezależność (nie pushujemy ŚOR Syngenta)
- WhatsApp
- Agentic conversational
- Polish-specific ekoschematy/ARiMR logic

---

### 4.7 Cropwise Operations (ex-Cropio)

Cropio został kupiony przez Syngenta Digital i rebrandowany jako Cropwise Operations. Patrz 4.6.

Kluczowe specyficzne features Cropio: 
- **NDVI monitoring co 5-10 dni**
- Field database, crop inputs planning
- Telematics integration
- Yield estimations + vegetation maps ([źródło: Capterra](https://www.capterra.com/p/133659/Cropio/reviews/))

---

### 4.8 Agremo

| Pole | Dane |
|---|---|
| **Nazwa** | Agremo |
| **URL** | https://www.agremo.com/ |
| **Kraj** | Serbia (Belgrade) |
| **Founded** | 2017 |
| **Ostatnia runda** | Privately held, seed + strategic investors |
| **Model cenowy** | Tier-based SaaS (Starter → Advanced → Enterprise); starts ~$15-30/month per user, custom enterprise |

#### Core value prop
**"Drone + satellite field analytics: stand count, weed detection, variable rate maps using computer vision."**

#### Kluczowe features
- Multi-index analysis (NDVI, MSAVI, RECI, NDRE, NDMI, NDWI, EVI) ([źródło: Agremo](https://www.agremo.com/products/crop-monitoring/))
- **Stand Count** — plants per acre, percentage below expectations
- Weed detection (Green on Green + Green on Brown) for drones/sprayers
- VRA maps for fertilizers/pesticides (claims 75% savings)
- AI-generated prescription maps
- **Agremo at Agritechnica 2025** — demonstrowali future of digital farming

#### Źródła danych
Sentinel-2 + drones + computer vision

#### Poland / EU obecność
Dostępne globalnie. Serbia + EU focus; some Polish dealers. Nie dominujący w PL.

#### Słabości
- Nisza głównie dla drone operators
- UX mniej slick niż FieldView
- Brak conversational AI
- Mała skala (tens of thousands users?)

#### Co mają czego MY NIE MAMY
- Green-on-Green spot spraying maps
- Stand count AI
- Bogata paleta indeksów wegetacji

#### Co MY mamy czego ONI NIE MAJĄ
- Chat-based reasoning
- Polska integracja
- WhatsApp

---

### 4.9 Prospera Technologies (Valmont/Valley)

| Pole | Dane |
|---|---|
| **Nazwa** | Prospera (part of Valmont Industries / Valley Irrigation) |
| **URL** | https://www.prospera.ag/ |
| **Kraj** | Izrael (acquired by Valmont 2021) |
| **Founded** | 2014 |
| **Ostatnia runda** | **$300M acquisition by Valmont** (Q2 2021) ([źródło: AgFunderNews](https://agfundernews.com/prospera-valmont-acquires-crop-analytics-startup-for-300m)) |
| **Model cenowy** | Bundled with Valley center pivot irrigation systems; Prospera AI opcja dodatkowa (~$1000+/pivot/rok) |

#### Core value prop
**"AI-powered irrigation intelligence — real-time crop analysis with center pivots."**

#### Kluczowe features
- AI + computer vision integrated with center pivot irrigation
- Real-time crop analysis
- Anomaly detection
- Covers **5M+ acres monitored** (2020 data, Valmont); likely higher w 2026

#### Użytkownicy
Valmont ma dominującą pozycję w center pivot irrigation (USA, Australia, MENA). Prospera = AI layer.

#### Źródła danych
Kombinacja: in-pivot kamery, satelita (Sentinel-2), weather.

#### Poland / EU obecność
Znikoma — center pivot irrigation nie jest popularna w PL (pola mniejsze, deszczowe).

#### Relacja do AgriClaw
Nie konkurent bezpośredni — target: duże pivot operations w USA/Australia/MENA. PL = niewyeksponowany rynek dla nich.

---

### 4.10 Ceres Imaging / Ceres AI

| Pole | Dane |
|---|---|
| **Nazwa** | Ceres AI (wcześniej Ceres Imaging) |
| **URL** | https://ceres.ai |
| **Kraj** | USA (Oakland, CA) |
| **Founded** | 2014 |
| **Ostatnia runda** | Total raised **$106.65M** ([źródło: Crunchbase](https://www.crunchbase.com/organization/ceres-imaging)) |
| **Model cenowy** | Per-acre subscriptions; enterprise; Climate Corp partnership 2018 |

#### Core value prop
**"Aerial spectral imagery + analytics using airplanes + proprietary sensors — university-validated plant science."**

#### Kluczowe features
- **Plane-based aerial imagery** (nie drony) — wider coverage faster
- Proprietary sensors, in-house processing
- Multispectral analysis, university-validated models
- Pivot to **risk insights for sustainable agriculture** (pozycjonowanie 2025-26)
- Serves USA, Australia, Ameryka Południowa

#### Użytkownicy
Zamożni farmerzy z dużymi operacjami; winnicy, sady (gdzie plane economics działają).

#### Źródła danych
Własne samoloty + drony

#### Poland / EU obecność
Brak.

#### Słabości
- Drogie (plane imagery)
- Sezonowość (flight schedule)
- Pivot do "risk insights" sugeruje trudności w core consumer farm market
- Plotka o Planet acquisition nie potwierdzona ([źródło: search results brak]) — prawdopodobnie FALSE rumor.

#### Co mają czego MY NIE MAMY
- Plane imagery (multispectral camera ~10cm resolution)
- University-validated models
- Winnice/sady focus

#### Co MY mamy czego ONI NIE MAJĄ
- Skalowalność (satelita zamiast samolotów)
- Polski język
- AI agent

---

### 4.11 Bushel Farm (ex-FarmLogs)

| Pole | Dane |
|---|---|
| **Nazwa** | Bushel Farm (rebranded z FarmLogs 2022) |
| **URL** | https://bushelfarm.com |
| **Kraj** | USA (Fargo, ND) |
| **Founded** | 2012 (FarmLogs) |
| **Ostatnia runda** | Acquired by Bushel 2022 (undisclosed) |
| **Model cenowy** | **FREE** z Bushel Business Account; Add-Ons $10/month+; 30-day free trial ([źródło: Bushel Farm Pricing](https://bushelfarm.com/pricing/)) |

#### Core value prop
**"Free farm management + financial software when paired with Bushel Business Account (FDIC-insured bank account)."**

#### Kluczowe features
- Track expenses, income, activities per field/crop/overall
- Grain marketing tools, position management
- Auto-import grain contracts z 3500+ grain/ag retail facilities
- Integracja z **Deere Operations Center, Climate FieldView, Bushel Network**
- **Bushel Business Account** (FDIC-insured up to $5M)

#### Użytkownicy
Dziesiątki tysięcy US farmerów (bez konkretnych publicznych liczb)

#### Źródła satelitarne
Sentinel-2 (basic NDVI); nie priorytet platformy.

#### Poland / EU obecność
**Brak** — czysto US product, banking model niekompatybilny z EU.

#### Słabości
- US-only (banking licensing)
- Satelita = thin layer, główny focus to financial/grain
- Rebranding z FarmLogs spowodował zamieszanie

#### Relacja do AgriClaw
Nie konkurent bezpośredni w PL. Model ciekawy — sprzedaż banking → free app.

---

### 4.12 xarvio FIELD MANAGER (BASF)

| Pole | Dane |
|---|---|
| **Nazwa** | xarvio FIELD MANAGER |
| **URL** | https://www.xarvio.com/ |
| **Kraj** | Niemcy (BASF SE Digital Farming) |
| **Founded** | 2017 (jako BASF Digital Farming GmbH) |
| **Ostatnia runda** | BASF SE (publiczny, FWB: BAS) |
| **Model cenowy** | Annual subscription; per-hectare based, ~€5-15/ha w zależności od features; Free trial dostępny |

#### Core value prop
**"Field-specific agronomic recommendations — spray timing, variable rate, pest alerts, disease models."**

#### Kluczowe features
- **xarvio FIELD MANAGER For Grapes** (launched November 2025, 2025/26 growing season) — >100 wine grape varieties
- **xarvio FIELD MANAGER For Fruits & Veggies** (launched February 2025)
- **xarvio FIELD MANAGER For AgBusiness** (launching commercially 2026 in France/Germany) ([źródło: BASF](https://www.basf.com/global/en/media/news-releases/2025/09/p-25-176))
- Scouting Trips feature (dla doradców)
- Weather + growth stages + disease/pest risk models
- Integracja z **CNH** (March 2024)
- Integracja z Nutrien Ag Solutions

#### Użytkownicy / hektary
**>130k farmerów i doradców**, **>20M hectares** globalnie ([źródło: BASF/AgroPages](https://news.agropages.com/News/NewsDetail---55343.htm))

#### Źródła satelitarne
Sentinel-2 + weather (DWD, Meteomatics) + proprietary BASF models

#### Poland / EU obecność
**Silna** — xarvio ma bezpośrednią obecność w PL z polskim UI. BASF Polska aktywny partner handlowy.

#### Słabości
- Bindowanie do ŚOR BASF (polecenia produktów)
- UI wciąż "corporate dashboard" vs consumer-first
- Brak WhatsApp / conversational
- Roczna subskrypcja może być barierą dla małych gospodarstw

#### Co mają czego MY NIE MAMY
- 20M ha + 130k users — ogromna skala w Europie
- Polish language support mature
- Disease/pest models kalibrowane lokalnie
- Ecosystem 5+ produktów (FM Core, Grapes, F&V, AgBusiness, Planning)
- Integracje z CNH maszynami

#### Co MY mamy czego ONI NIE MAJĄ
- Independence od BASF (nie pushujemy ich ŚOR)
- WhatsApp UX
- Agentic (rozmowa, nie dashboard)
- Niższy próg cenowy

---

### 4.13 SatAgro (Polska)

| Pole | Dane |
|---|---|
| **Nazwa** | SatAgro Sp. z o.o. |
| **URL** | https://satagro.pl/ |
| **Kraj** | **Polska** (Warszawa) |
| **Founded** | 2015 |
| **Ostatnia runda** | Seed/bootstrapped; współpraca z Planet Labs + Vantage Polska (PTx Trimble distr.) |
| **Model cenowy** | **Starter (1 pole do 50 ha)**: FREE unlimited. Pro: **1-7 PLN/ha/rok** (> 50 ha) ([źródło: SatAgro](https://satagro.pl/)) |

#### Core value prop
**"Polski pionier rolnictwa satelitarnego — platforma VRA, mapy aplikacyjne, integracja maszyn."**

#### Kluczowe features
- Monitoring satelitarny + dron compatible
- Mapowanie produktywności, opłacalności
- Plany nawożenia, badania gleby
- Mapy aplikacyjne wysyłane **bezpośrednio do maszyn** (ISOBUS)
- Refundacja 65-80% przez PROW "Rolnictwo 4.0" (program ARiMR)
- Obsługuje **"ponad 1% polskich upraw polowych"** ([źródło: SatAgro](https://satagro.pl/)) — czyli ~100-150k ha

#### Użytkownicy
~200-500 polskich gospodarstw (ponad 1% areału PL), również projekty EU

#### Źródła satelitarne
**Sentinel-2** (primary), **Planet Labs** (partner, higher-resolution), Landsat

#### Poland / EU obecność
**Native polski** — to ich home market. Partnerstwo z Vantage Polska (PTx Trimble).

#### Słabości
- Niewielka skala (~100-150k ha w PL)
- Web-only UX, brak native mobile
- Brak conversational AI
- Target = duzi farmerzy (>50 ha)
- Hardware-heavy workflow (ISOBUS terminals required dla VRA)

#### Co mają czego MY NIE MAMY
- **Głęboka integracja z maszynami ISOBUS** (szczególnie w PL)
- Znajomość PROW/ARiMR programs
- Dostęp do Planet Labs (partner) za free
- Partnerstwo z Vantage/Trimble

#### Co MY mamy czego ONI NIE MAJĄ
- Conversational AI in Polish
- WhatsApp delivery
- Small farm friendly (od 1 ha)
- Mobile-first
- Agentic proactive recommendations

**To nasz główny polski konkurent.**

---

### 4.14 Cropler (Polska)

| Pole | Dane |
|---|---|
| **Nazwa** | Cropler |
| **URL** | https://www.cropler.io/ |
| **Kraj** | **Polska** (Warszawa) |
| **Founded** | 2023 |
| **Ostatnia runda** | **€150k pre-seed** ([źródło: HackerNoon](https://hackernoon.com/ai-driven-solutions-for-modern-agritech-interview-with-soty-2024-nominee-cropler)) |
| **Model cenowy** | Hardware-based: kamery + subskrypcja; ~€200-500/kamera + €10-30/month SaaS |

#### Core value prop
**"AI-powered portable smart cameras tracking plant health in real-time — ground truth dla rolników."**

#### Kluczowe features
- **Portable smart agri-cameras** montowane w polu
- Real-time photo-based AI analysis
- Wykrywanie anomalii, stanu upraw
- **PlantPilot** (launched kwiecień 2025) — hyperlocal recommendations AI
- Over **100 cameras sold, 1000+ ordered, 12 countries** ([źródło: FreshFruitPortal](https://www.freshfruitportal.com/news/2024/05/30/cropler-becomes-a-game-changer-in-agtech/))

#### Użytkownicy
Setki farmerów/agribiznesów w 12 krajach (głównie Europa + niektóre inne).

#### Źródła danych
**Photo-based** (ich kamery!) + satelita (Sentinel-2) + IoT

#### Poland / EU obecność
Polski startup, ale expansion EU-wide.

#### Słabości
- **Hardware-dependent** (musisz kupić kamerę)
- Early stage (€150k seed = ograniczony runway)
- Skala ~100-1000 kamer
- Lokalizacja punktowa (kamera widzi część pola, nie całe)

#### Co mają czego MY NIE MAMY
- Ground-truth cameras (nie polegają na satelicie)
- Hyperlocal photo AI (chorób, szkodników z bliska)
- EU-wide expansion already

#### Co MY mamy czego ONI NIE MAJĄ
- **Zero hardware required**
- WhatsApp UX
- Pełny farm management (nie tylko scouting)
- Tańsze wejście

**Komplementarne bardziej niż konkurencyjne — kiedyś możliwe partnerstwo.**

---

## 5. Obszar C — AI-Agent Startups 2025–2026

### 5.1 Farmer.CHAT (Digital Green + Gooey.AI)

| Pole | Dane |
|---|---|
| **Nazwa** | Farmer.CHAT |
| **URL** | https://digitalgreen.org/farmer-chat/ |
| **Kraj** | Indie (Digital Green NGO, Bengaluru) + Gooey.AI (US) |
| **Founded** | 2008 (Digital Green); Farmer.CHAT launched **2023**, scaled 2024 |
| **Ostatnia runda** | NGO funding (Gates Foundation, USAID, Rockefeller Foundation) — nie VC |
| **Model cenowy** | **FREE** for farmers (funded by philanthropy + government) |

#### Core value prop
**"AI-powered WhatsApp/Telegram agricultural advisor for smallholder farmers in local languages."**

#### Kluczowe features
- WhatsApp + Telegram + web UI
- **830k+ users** in Kenya, Nigeria, Ethiopia, India, Brazil (5M+ queries) ([źródło: Digital Green](https://digitalgreen.org/farmer-chat/))
- 125k users w Indiach, **350k rolników + frontline workers** — 35% kobiet, 60% wdraża rekomendacje ([źródło: CGAP](https://www.cgap.org/blog/beyond-chat-ai-powered-advice-for-women-farmers))
- Languages: hindi, telugu, bhojpuri, amharic, swahili, English
- Text, audio, image queries
- Image-based crop diagnosis
- Retrieval-augmented generation (vetted agronomic knowledge base)

#### Użytkownicy / hektary
830k+ farmerów globalnie (1.5M messages w lutym 2025)

#### Źródła danych
- Vetted agronomic knowledge bases (współpracujące instytuty)
- Nie satelita centric; focus na Q&A + image diagnosis

#### Poland / EU obecność
**BRAK.** Focus emerging markets.

#### Słabości
- **Emerging markets only** — brak wsparcia dla polskich, europejskich upraw (rzepak, pszenica ozima)
- NGO model ograniczone commercial scaling
- Brak integracji z maszynami
- Brak VRA/prescription maps

#### Co mają czego MY NIE MAMY
- **Text + audio + image queries** — multimodal (my mamy głównie text)
- 5M+ zapytań (proven UX)
- Multi-language (6+ języków lokalnych)
- 830k user base (social proof)

#### Co MY mamy czego ONI NIE MAJĄ
- Polski język + polskie uprawy
- Satelita-first architecture
- Field geometry (PostGIS)
- Machine integration potential (brak u Farmer.CHAT)

**To nasz najbliższy ideologiczny konkurent — ale geograficznie komplementarny.**

---

### 5.2 Kheti Buddy

| Pole | Dane |
|---|---|
| **Nazwa** | Kheti Buddy |
| **URL** | https://khetibuddy.com/ |
| **Kraj** | Indie (Pune) |
| **Founded** | 2017 |
| **Ostatnia runda** | Privately held, pre-Series A |
| **Model cenowy** | **Pricing on request** (SaaS B2B tiers) ([źródło: Techjockey](https://www.techjockey.com/detail/kheti-buddy)) |

#### Core value prop
**"Enterprise agtech SaaS — digitize farming operations for agribusinesses, not solo farmers."**

#### Kluczowe features
- Crop scheduling (sowing→harvest)
- Field activity tracking
- Satellite crop health monitoring
- Weather alerts, advisory
- **Traceability** (farm-to-customer)
- Inventory management
- Compliance/sustainability reporting
- AI/ML, IoT, remote sensing

#### Użytkownicy
Głównie B2B agribiznesy; konkretnych liczb nie ujawnia.

#### Poland / EU obecność
Brak.

#### Słabości
- **B2B only** (pricing on request)
- Nie WhatsApp-first
- Indyjski kontekst upraw (nie PL)

---

### 5.3 Cropin + Cropin Sage (Google Gemini)

| Pole | Dane |
|---|---|
| **Nazwa** | Cropin |
| **URL** | https://www.cropin.com/ |
| **Kraj** | Indie (Bengaluru) |
| **Founded** | 2010 |
| **Ostatnia runda** | Total **$54M over 17 rounds**; Series B $8M led by Chiratae + Gates Foundation; **latest Grant August 2025** ([źródło: Tracxn](https://tracxn.com/d/companies/cropin/__lg6houpNgQIef29T-gWVgL3jDhqSvoQ1uynp0MM4gOA/funding-and-investors)) |
| **Model cenowy** | Enterprise SaaS; custom per farm/acre |

#### Core value prop
**"Intelligent Agriculture Cloud — SmartFarm + SmartRisk + Cropin Sage (Google Gemini) — powering global agri-intelligence."**

#### Kluczowe features
- **SmartFarm**: field data, productivity tracking
- **SmartRisk**: dla banków/ubezpieczycieli — risk assessment
- **Cropin Sage** (lipiec 2024): **Google Gemini-powered** generative AI
  - Grid-based maps: 3x3m, 10x10m, 5x5km
  - 13 key crops covered (rice, wheat, potato, maize, etc.) = 80% world food
  - Gemini Flash 1.5 → SQL conversion
  - Historical + current + future forecasts
- Deep learning, computer vision, multispectral imaging
- **400+ crop varieties analyzed**
- Positively impacted **4-7M farmerów**; **16M acres digitized** ([źródło: Cropin](https://www.cropin.com/about/))

#### Użytkownicy / hektary
4-7M farmerów (marketing); 250+ customers (enterprise). Annual revenue ₹42.8Cr = ~$5M (mała skala revenue).

#### Źródła satelitarne
Sentinel-2, Landsat, PlanetScope, własne models

#### Poland / EU obecność
Brak bezpośredniej w PL; Europa via enterprise partners.

#### Słabości
- **Enterprise only** — nie sprzedają do indywidualnych rolników
- Indyjski crop focus (rice, potato dominuje)
- Revenue mała ($5M/rok) vs marketing skali
- Cropin Sage bardzo early stage

#### Co mają czego MY NIE MAMY
- **Google Gemini integration** (my używamy OpenClaw + fallback OpenRouter)
- Global crop knowledge graph (13 crops at launch)
- SmartRisk dla banków — unique value proposition
- Grid-based mapping infra

#### Co MY mamy czego ONI NIE MAJĄ
- Polski kontekst
- WhatsApp (Cropin = dashboard)
- SMB farmer focus (nie enterprise)

---

### 5.4 Arable Labs (Mark 3)

| Pole | Dane |
|---|---|
| **Nazwa** | Arable Labs, Inc. |
| **URL** | https://www.arable.com/ |
| **Kraj** | USA (San Francisco) |
| **Founded** | 2014 |
| **Ostatnia runda** | Series C + D (total ~$30M); private |
| **Model cenowy** | Hardware Mark 3: ~$780-1000/unit (stare dane); dashboard: $580+/rok |

#### Core value prop
**"In-field sensor + AI modeling — real-time plant/soil/weather crop insights, push-button deployment."**

#### Kluczowe features
- **Mark 3 sensor** (Q1 2025): 22 narrow-band spectrometer, 5MP camera, thermal sensor (±1°C canopy), ultrasonic anemometer optional
- No maintenance, activates with button push
- Combines weather + plant + soil/irrigation data + ML

#### Użytkownicy
Premium segment — wineries, orchards, specialty crops

#### Źródła danych
**Hardware-first** (ich własne sensory) + satelita (secondary)

#### Poland / EU obecność
Dostępne via dealerzy; niewielka skala w PL.

#### Słabości
- Hardware wymagany (każdy sensor = koszt)
- Premium segment only
- Nie WhatsApp, nie conversational

#### Co mają czego MY NIE MAMY
- Ground truth hardware (canopy temp ±1°C to huge)
- Narrow-band spectrometer (22 bands!)
- Plant physiology models (nie tylko NDVI)

#### Co MY mamy czego ONI NIE MAJĄ
- Hardware-free
- Chat-based
- Polish context

---

### 5.5 Agrobase (Farmis)

| Pole | Dane |
|---|---|
| **Nazwa** | Agrobase (Farmis) |
| **URL** | https://agrobase.net / apps |
| **Kraj** | Litwa (FARMIS.lt) |
| **Founded** | 2013 |
| **Ostatnia runda** | Bootstrapped / private |
| **Model cenowy** | **Free app** (ad-supported or basic); Pro tier $5-15/month |

#### Core value prop
**"Agronomic encyclopedia for farmers — identify pests, weeds, diseases; pesticide catalogs per country."**

#### Kluczowe features
- Catalogs: diseases, weeds, pests, registered ŚOR per country
- **Sprayer calculators**, calibration, tank mix guides
- Market info (wheat prices, grain forecasts)
- Search by common/Latin name, crop, category
- Covers: pszenica, kukurydza, rzepak, burak, słonecznik, bobowate, etc.

#### Użytkownicy
"Popular" — brak konkretnych liczb, ale strong Central-Eastern Europe presence.

#### Poland / EU obecność
Polski dostępny (Litwa sąsiad — popularny u nas).

#### Słabości
- **To jest baza wiedzy, NIE AI agent** — user musi wiedzieć co szukać
- Brak integracji z polem/satelita
- Statyczny content

#### Co mają czego MY NIE MAMY
- Głęboka baza ŚOR per country (PL, LT, LV, EST)
- Sprayer/tank mix calculators
- Market prices feed

#### Co MY mamy czego ONI NIE MAJĄ
- AI reasoning (nie trzeba wiedzieć co szukać)
- Satelita + pogoda integration
- WhatsApp
- Proactive alerts

---

### 5.6 Farmonaut (Jeevn AI)

| Pole | Dane |
|---|---|
| **Nazwa** | Farmonaut |
| **URL** | https://farmonaut.com |
| **Kraj** | Indie (Bengaluru) |
| **Founded** | 2018 |
| **Ostatnia runda** | Privately held, angels + strategic |
| **Model cenowy** | **Rs 200/month** (~$2.50) entry; dashboard + API + mobile + **WhatsApp** accessibility ([źródło: Farmonaut](https://farmonaut.com)) |

#### Core value prop
**"Satellite-powered farming intelligence for Global South — affordable starting $2.50/month, multilingual WhatsApp access."**

#### Kluczowe features
- **Jeevn AI** — real-time satellite + AI advisory
- Dashboards, APIs, mobile apps, **WhatsApp accessibility**
- Sentinel, NASA data processing
- 25+ active clients (India, Nigeria, Italy); Godrej Agrovet, Hayleys customers
- Multilingual support

#### Użytkownicy
Marketing: "thousands of farmers"; 25 enterprise clients. Goal 100 clients by 2026.

#### Poland / EU obecność
Small — some EU clients (Italy mentioned); **brak polskiego UI**.

#### Słabości
- Maleńka skala (25 enterprise clients)
- Polska/EU nie focus
- Mobile app mniej dopracowana

#### Co mają czego MY NIE MAMY
- **WhatsApp accessibility already** (!)
- Niski próg cenowy ($2.50/month) — unikalnie tanio
- Multilingual (ale nie PL)
- Global South focus

#### Co MY mamy czego ONI NIE MAJĄ
- Polski (native)
- Lepsza głębia agronomiczna dla EU crops
- Prawdziwy agentic (Jeevn AI to głównie notifications)

---

### 5.7 eAgronom

| Pole | Dane |
|---|---|
| **Nazwa** | eAgronom |
| **URL** | https://www.eagronom.com/ |
| **Kraj** | Estonia (Tartu) |
| **Founded** | 2016 |
| **Ostatnia runda** | **$5.5M** raised for sustainability pivot (2023-24) ([źródło: eAgronom blog](https://blog.eagronom.com/leading-agtech-company-eagronom-raises-5-5m-to-support-farms-transition-to-sustainable-practices)) |
| **Model cenowy** | Free trial + paid subscription (per hectare/user, custom); ~€1-3/ha/rok |

#### Core value prop
**"Farm management + carbon credits platform — help farmers generate revenue via sustainable practices."**

#### Kluczowe features
- Interactive farm maps
- **5-year crop planning**
- Record keeping, task management
- Inventory mgmt (auto-deduct)
- Mobile app **z offline support**
- **Carbon credit generation** (pivot 2023)
- Financing access partnerships

#### Użytkownicy / hektary
**600 big farms w Polsce, ~300k ha, 20% market share w PL dla dużych farm** ([źródło: Agronomist PL](https://agronomist.pl/articles/poland-the-eagronom-platform))

#### Źródła satelitarne
Sentinel-2 (basic NDVI)

#### Poland / EU obecność
**Silna w Polsce** — 20% rynku w segmencie dużych gospodarstw. 2 prestige awards rolne w PL.

#### Słabości
- Skupia się na **dużych farmach**
- Brak AI agenta (to farm management ERP)
- Web/mobile dashboards — nie WhatsApp
- Carbon credits pivot podwyższa złożoność

#### Co mają czego MY NIE MAMY
- **20% market share w PL** (big farms)
- Carbon credit mechanics
- 5-year planning
- Offline mobile
- Partnerships z bankami/ubezpieczycielami

#### Co MY mamy czego ONI NIE MAJĄ
- Conversational AI
- WhatsApp UI
- Small farm friendly
- Pro-active recommendations (eAgronom = passive record keeping)

**Drugi kluczowy polski konkurent, obok SatAgro.**

---

### 5.8 Nowe rundy finansowe 2025–2026

**Ogólna sytuacja finansowania agritech 2026 (do kwietnia):**
- Total funding **$771M equity w 73 rundach** w 2026 YTD ([źródło: Tracxn](https://tracxn.com/d/sectors/agritech/__8-OCx7Zf21c5QYzq6iONRd31GtL5haydTw9qIEP-m3o))
- -2% YoY vs 2025
- Top 3 trends: **Precision Farming, Sustainable Farming, Farm Management Software**

**Notable rundy 2025-26:**

| Startup | Runda | Kwota | Data | Focus |
|---|---|---|---|---|
| Kilter (Norway) | Strategic | **€6.5M (Kubota)** | Feb 2026 | Autonomous weeding |
| Aydi (ORTH platform) | Seed | **$7.5M** | Sep 2025 | Precision farming |
| UK Agri-Tech Fund | Gov | **£50M** | Apr 2026 | AI + Robotics UK |
| Indigo Ag | Total | $1.4B | Aggregate | Microbial |
| Pivot Bio | Total | $616.9M | Aggregate | N-fixing |
| DeHaat | Venture debt | ~$23.4M (Trifecta) | Early 2025 | Indian expansion |
| Cropin | Grant | Undisclosed | Aug 2025 | AI R&D |

**Insight**: VC ostrożne; agritech funding Renaissance "did not materialize" w 2025, ale **AI-branded startups** radzą sobie znacznie lepiej niż "pure agri" ([źródło: PitchBook via StartUs Insights](https://www.startus-insights.com/innovators-guide/ai-in-agriculture-strategic-guide/)).

---

## 6. Obszar D — WhatsApp-First / Emerging Markets

### 6.1 DeHaat (Indie)

| Pole | Dane |
|---|---|
| **Nazwa** | DeHaat (Green Agrevolution Pvt Ltd) |
| **URL** | https://dehaat.com |
| **Kraj** | Indie (Patna/Gurgaon) |
| **Founded** | 2012 |
| **Ostatnia runda** | **~$23.4M venture debt from Trifecta Capital** (early 2025). Total raised **$270M+**. Last major: Series E **$60M** (Nov 2022, Sofina + Temasek). Valuation $700-800M ([źródło: Focus Agritech](https://focusagritech.com/dehaat/)) |
| **Model cenowy** | **Marketplace/commission model** — DeHaat Centers get cut; farmer AI advisory is free/freemium |

#### Core value prop
**"Full-stack agri platform — inputs (seeds/fertilizers), AI crop advisory, financial services, market access via DeHaat Centers."**

#### Kluczowe features
- **12M+ farmerów** na platformie ([źródło: Better India](https://thebetterindia.com/farming/dehaat-ai-agritech-platform-indian-farmers-10943764))
- **15,000+ DeHaat Centers** + 503 FPOs
- 12 stanów Indii
- 3200+ agri inputs, 30+ crops
- AI-driven crop advice
- Financial services (loans via partners)
- Direct market access (farmers sell grain)

#### Źródła satelitarne
Sentinel-2 + NASA; minor component

#### Poland / EU obecność
**Zero** — wybitnie indyjski model.

#### Słabości
- Zależność od DeHaat Centers (physical network)
- Indyjski kontekst, nie transferowalny do PL
- Skupia się na inputs+market, AI advisory to dodatek

#### Co mają czego MY NIE MAMY
- **12M farmerów skala**
- Full-stack value chain (inputs + advisory + market)
- Physical network (15k centers)
- Market access / grain sell

#### Co MY mamy czego ONI NIE MAJĄ
- Satelita-first (DeHaat to tradycyjny agri marketplace z AI-add-on)
- Polish market
- Agentic AI

---

### 6.2 AgroStar / BharatAgri / Gramophone (Indie)

| Startup | URL | Użytkownicy | Model | Fund |
|---|---|---|---|---|
| **AgroStar** | agrostar.in | **7.5M users**, 7000+ stores | Inputs + advisory | ~$130M total |
| **BharatAgri** | bharatagri.com | **1.5M farmerów** | Advisory + 25k products | Series A $12M+ |
| **Gramophone** | gramophoneapp.com | Setki tysięcy | Advisory + marketplace | $19M total |

**Wspólne**: Hindi-language, mobile-first, focus na **inputs sale + advisory**, Indie-only, WhatsApp sometimes used for notifications.

**Brak w PL.** Nie bezpośredni konkurenci.

---

### 6.3 Apollo Agriculture (Kenia)

| Pole | Dane |
|---|---|
| **Nazwa** | Apollo Agriculture |
| **URL** | https://www.apolloagriculture.com/ |
| **Kraj** | Kenia (Nairobi) + Zambia |
| **Founded** | 2016 |
| **Ostatnia runda** | **$10M debt** (Q1 2024); **Series B $40M** wcześniej; Total raised **$93M** from Anthemis + SoftBank Vision Fund ([źródło: Disrupt Africa](https://disruptafrica.com/2024/01/30/kenyan-agri-tech-startup-apollo-agriculture-raises-10m-debt-funding/)) |
| **Model cenowy** | **Zero upfront**, deposit + loan paid post-harvest |

#### Core value prop
**"Credit + inputs + advisory for smallholder African farmers — powered by ML credit risk + remote sensing."**

#### Kluczowe features
- **350k+ rolników** obsłużonych (Kenia + Zambia) ([źródło: Apollo Agriculture](https://www.apolloagriculture.com/))
- Credit risk ML na podstawie: satellite data, soil data, behavior, crop yield models
- Customized packages per location
- Partnership AfDB Fertilizer Financing Mechanism ($2M credit guarantee, 2025)
- 7000+ tons fertilizers dla 100k farmerów via distribution partnership

#### Źródła satelitarne
Sentinel-2 + soil data + weather

#### Poland / EU obecność
**Zero** — afrykański model kredytowy nie ma sensu w PL.

#### Co mają czego MY NIE MAMY
- **ML credit risk** (unikalnie silny)
- Zero-upfront model (pay after harvest)
- Financial inclusion mission
- Real-world distribution network

#### Co MY mamy czego ONI NIE MAJĄ
- EU regulatory knowledge
- Polish market
- Higher-end UX

---

### 6.4 Hello Tractor

| Pole | Dane |
|---|---|
| **Nazwa** | Hello Tractor |
| **URL** | https://hellotractor.com/ |
| **Kraj** | Nigeria (Abuja) + Kenya |
| **Founded** | 2014 |
| **Ostatnia runda** | Partnership with John Deere (equipment), CGAP funding |
| **Model cenowy** | **Commission per booking** (farmer → tractor owner via app) |

#### Core value prop
**"Uber for tractors in Africa — smallholder farmers access mechanized services on-demand."**

#### Kluczowe features
- **2.5M+ smallholder farmerów** w marketplace ([źródło: Hello Tractor](https://hellotractor.com/))
- **6500+ farm equipment owners**
- **4.5M+ acres serviced, 20+ krajów afrykańskich**
- Booking agents (last-mile access)
- IoT tractor tracking
- **227% income boost** dla farmerów
- PAYG financing (Nigeria, Kenya, Uganda, Rwanda)

#### Poland / EU obecność
**Zero** — afryka focus.

#### Relacja do AgriClaw
Nie konkurent. **Model "Uber for tractors"** interesujący, ale w PL tractory są gęsto rozlokowane (większość gospodarstw ma własny lub wynajmuje od sąsiada).

---

### 6.5 Twiga Foods

| Pole | Dane |
|---|---|
| **Nazwa** | Twiga Foods |
| **URL** | https://twiga.com |
| **Kraj** | Kenia |
| **Founded** | 2014 |
| **Ostatnia runda** | Total **$157.1M across 19 rounds**; last: $35M convertible note 2023 |
| **Status** | **W trudnościach** (restrukturyzacja, layoffs, Nairobi ops paused 60 dni w czerwcu 2025) ([źródło: TechCabal](https://techcabal.com/2025/06/06/twiga-foods-halts-nairobi-operations/)) |

#### Core value prop (original)
**"B2B food logistics — connect smallholder farmers → urban SME retailers."**

#### Status 2026
- Layoffs 2023, 2024, 2025
- Ops paused Nairobi
- Whistleblowers alegują "soft liquidation plan" ([źródło: Techish](https://tech-ish.com/2025/04/16/whistleblower-twiga-layoff-staff-debt/))
- Acquired 3 distributors (Jumra, Sojpar, Raisons)
- New CEO Charles Ballard (2024)

**Not a relevant competitor for AgriClaw** — struggling.

---

### 6.6 Ignitia

| Pole | Dane |
|---|---|
| **Nazwa** | Ignitia AB |
| **URL** | https://www.ignitia.se/ |
| **Kraj** | Szwecja + West Africa operations |
| **Founded** | 2010 |
| **Ostatnia runda** | Impact investors + grants (UNDP, Business Call to Action) |
| **Model cenowy** | **SMS subscription** — very low cost (few cents per message); pay-per-forecast |

#### Core value prop
**"Tropical weather forecasts via SMS — 48-hour daily forecasts for smallholder African farmers."**

#### Kluczowe features
- **2M+ farmerów** w zasięgu ([źródło: UNDP](https://digitalx.undp.org/catalogs/ignitia.html))
- **84% accuracy** in tropics (scientifically proven)
- Daily 48-hour forecast SMS
- Ghana, Nigeria, Mali, Brazil
- 92% of users w Ghanie: **yield increases**, 91% **income increases** (2021 study)

#### Źródła danych
Proprietary tropical weather model (mezoskala)

#### Poland / EU obecność
**Zero** — tropiki focus.

#### Co mają czego MY NIE MAMY
- **SMS delivery** (reaches feature phones, not just smartphones)
- Specialized tropical weather model
- 2M farmers reach
- Very low cost / transaction

#### Co MY mamy czego ONI NIE MAJĄ
- Agentic reasoning (Ignitia = one-way SMS)
- Rich satellite data
- Polish context

---

### 6.7 FarmerAI (Safaricom + Opportunity International) — NEW 2025

| Pole | Dane |
|---|---|
| **Nazwa** | FarmerAI |
| **URL** | via Opportunity International + Safaricom |
| **Kraj** | Kenia (Safaricom) + Development Bank Ghana pilot |
| **Founded** | Launched **Luty 2025** ([źródło: TechAfrica News](https://techafricanews.com/2025/02/11/ai-meets-agriculture-as-safaricom-and-opportunity-international-unveil-farmerai/)) |
| **Ostatnia runda** | NGO/Telco partnership (non-VC) |
| **Model cenowy** | **Free dla farmerów** (Safaricom-subsidized) |

#### Core value prop
**"Real-time farming best practices via AI chatbot on WhatsApp + SMS for smallholder African farmers."**

#### Kluczowe features
- WhatsApp + SMS multimodal
- Kenya pilot: 800-1000 farmerów do końca 2025
- Ghana pilot: 3300 farmers via 100 extension officers
- Malawi: Ulangizi AI sister project
- Weather, fertilizer, pest, market prices advice
- Safaricom M-Pesa potential integration

#### Źródła danych
Wedded agronomic knowledge + local extension officers

#### Poland / EU obecność
**Zero.**

#### Co mają czego MY NIE MAMY
- Safaricom partnership (telco-powered reach)
- Integration z M-Pesa (potential payments)
- Extension officer network

#### Co MY mamy czego ONI NIE MAJĄ
- Satellite-first
- Polish market
- More mature LLM tooling

---

## 7. Macierz pozycjonowania (Positioning Matrix)

### 7.1 Cena vs Głębokość Features vs Fokus Geograficzny

| Firma | Cena (roczna per farmer/ha) | Głębokość features | Fokus geograficzny | WhatsApp/Chat? | Target segment |
|---|---|---|---|---|---|
| **John Deere Ops Center** | Free (core) + PRO subscription | ⭐⭐⭐⭐⭐ (z maszyną) | USA/Global | ❌ | Enterprise + large farms |
| **Climate FieldView** | $299-799/rok | ⭐⭐⭐⭐ | USA + LATAM + EU (partial) | ❌ | Large farms |
| **Trimble PTx** | Custom, $500-2000+ | ⭐⭐⭐⭐ (mixed fleet) | Global | ❌ | Pro/large farms |
| **CNH FieldOps** | Free connectivity | ⭐⭐⭐ | Global | ❌ | Case/NH owners |
| **AGCO Fuse** | Bundled hardware | ⭐⭐⭐ | Global | ❌ | Fendt/MF/Valtra owners |
| **Planet Labs** | $10k-$1M enterprise | ⭐⭐⭐⭐ (data only) | Global | ❌ | Governments, enterprise |
| **EOS Crop Monitoring** | $0.40-2/ha | ⭐⭐⭐ | Global | ❌ | SMB + enterprise |
| **Satellogic** | Per-km² licensing | ⭐⭐ (data only) | Global | ❌ | Governments, defense |
| **OneSoil** | Free + Pro enterprise | ⭐⭐⭐ | Global | ❌ | Solo farmers + enterprise |
| **Taranis** | $15/acre ($37/ha) | ⭐⭐⭐⭐⭐ (drone) | USA + LATAM + EU | Partial (Ag Assistant) | Advisors + retailers |
| **Cropwise (Syngenta)** | Free → custom | ⭐⭐⭐⭐ | Global | ❌ | Farmers + enterprise |
| **xarvio FIELD MANAGER** | €5-15/ha | ⭐⭐⭐⭐ | EU + NA | ❌ | Farmers + advisors |
| **Agremo** | $15-30/user/month | ⭐⭐⭐ | Serbia + EU | ❌ | Drone ops |
| **Prospera** | Bundled w Valley | ⭐⭐⭐⭐ | USA + MENA + AU | ❌ | Pivot irrigation ops |
| **Ceres AI** | Per-acre premium | ⭐⭐⭐ (plane) | USA + AU + SA | ❌ | Wine/orchard premium |
| **Bushel Farm** | Free w bank account | ⭐⭐⭐ | USA only | ❌ | US grain farmers |
| **SatAgro** | **1-7 PLN/ha + Free Starter** | ⭐⭐⭐⭐ | PL (native) + EU | ❌ | PL farmers (>50ha) |
| **Cropler** | Hardware + SaaS | ⭐⭐⭐ (camera) | PL + EU | ❌ | EU farmers |
| **Farmer.CHAT** | **Free** | ⭐⭐⭐ (AI chat) | India + Africa | ✅ **WhatsApp** | Smallholders emerging |
| **CropIn / Sage** | Enterprise | ⭐⭐⭐⭐⭐ (Gemini) | Global enterprise | Partial | Agribusiness, banks |
| **Arable Mark 3** | ~$1000/sensor + $580/rok | ⭐⭐⭐⭐ (hardware) | Global premium | ❌ | Wine, orchard, specialty |
| **Kheti Buddy** | Enterprise custom | ⭐⭐⭐⭐ | India | ❌ | Agribusinesses |
| **Farmonaut (Jeevn AI)** | **$2.50/month** | ⭐⭐⭐ | Global South | ✅ **WhatsApp** | Emerging markets |
| **eAgronom** | €1-3/ha | ⭐⭐⭐⭐ (ERP) | Estonia + PL + Baltic | ❌ | Large farms |
| **DeHaat** | Marketplace commission | ⭐⭐⭐⭐ (full stack) | India | Partial | Smallholders India |
| **Apollo Agriculture** | Post-harvest repayment | ⭐⭐⭐ (credit) | Kenya + Zambia | ✅ (notifications) | Smallholders Africa |
| **Hello Tractor** | Booking commission | ⭐⭐ (marketplace) | Africa | ✅ (app) | Smallholders Africa |
| **Ignitia** | Per-SMS cents | ⭐⭐ (weather only) | West Africa + Brazil | ✅ **SMS** | Smallholders tropics |
| **FarmerAI (Safaricom)** | Free (subsidized) | ⭐⭐⭐ (AI chat) | Kenya + Ghana + Malawi | ✅ **WhatsApp/SMS** | Smallholders Africa |
| **AgriClaw (my)** | TBD (~Free starter + paid Pro) | ⭐⭐⭐⭐ (AI agent + PL) | **PL native** | ✅ **WhatsApp** | **PL SMB + Pro farmers** |

### 7.2 Segmentacja rynku po osi "Farmer size × Digital sophistication"

```
                Low digital sophistication        High digital sophistication
                ─────────────────────────────────────────────────────────────
 Small farms    │ Ignitia (SMS)              │ OneSoil Free             │
 (<50 ha)       │ FarmerAI                   │ Farmonaut                │
                │ Apollo Agriculture         │ AgriClaw (TARGET MAIN)   │
                │ Farmer.CHAT                │ SatAgro Starter          │
 ─────────────────────────────────────────────────────────────────────────
 Medium farms   │ DeHaat                     │ Climate FieldView        │
 (50-500 ha)    │ AgroStar                   │ xarvio                   │
                │                            │ AgriClaw (STRETCH)       │
                │                            │ SatAgro Pro              │
                │                            │ eAgronom                 │
 ─────────────────────────────────────────────────────────────────────────
 Large farms    │ [rare]                     │ Deere Ops Center         │
 (>500 ha)      │                            │ Trimble PTx              │
                │                            │ CNH AFS Connect          │
                │                            │ Taranis (via retailers)  │
                │                            │ Cropin Sage (enterprise) │
```

**AgriClaw main target zone**: small-to-medium PL farms z phone-first digital preference.

---

## 8. TOP 5 brakujących u nas features

Bazując na tym co obserwują liderzy, oto **krytyczne gap-y które musimy zamknąć** żeby być konkurencyjni:

### 1. **Multimodal input — image queries (crop photo diagnosis)**
- **Kto to ma**: Farmer.CHAT (obrazy choroby), Agrobase (databaza), Cropin Sage, Taranis (leaf-level), Arable Mark 3 (camera)
- **Czego nam brakuje**: Możliwość wysłania zdjęcia liścia/polu na WhatsApp → diagnoza choroby/szkodnika/niedoboru
- **Technologia**: Vision LLM (Claude 3.7 Vision / GPT-4o Vision / lokalne PlantNet-style models)
- **Priorytet**: **KRYTYCZNY** — to MVP must-have dla smallholder PL. Bez tego nie prześcigniemy Farmer.CHAT.

### 2. **Prescription maps + machine integration (ISOBUS / shapefile export)**
- **Kto to ma**: SatAgro (ISOBUS native), FieldView (Drive 2.0), Deere Ops Center, Trimble, xarvio
- **Czego nam brakuje**: Generowanie variable-rate maps (VRA) z NDVI → eksport .ISOXML/.shp do ciągnika
- **Dlaczego kluczowe**: Polscy medium farmers (>50 ha) to core segment dla SatAgro i mają maszyny ISOBUS
- **Priorytet**: **WYSOKI** — kwartał 3-4 2026

### 3. **Disease/pest prediction models (ahead-of-time alerts)**
- **Kto to ma**: xarvio FIELD MANAGER (disease models kalibrowane), FieldView (hyperlocal weather), Ignitia (weather-based pest)
- **Czego nam brakuje**: Predykcyjne alerty: "septoria risk at field 3 — 72h from now ideal spray window"
- **Technologia**: Weather API + phenology model + local disease epidemic data (IUNG, COBORU)
- **Priorytet**: **WYSOKI** — to kluczowa przewaga agronomiczna

### 4. **Farm records & compliance (PROW / EKOSCHEMATY / ARiMR)**
- **Kto to ma**: eAgronom (silny w PL compliance), Cropwise Operations, SatAgro (refundacja PROW)
- **Czego nam brakuje**: 
  - Automatic EKOSCHEMATY compliance tracking
  - Integracja IACS / GeoSpatial App (ARiMR wnioski)
  - Book-keeping zabiegów do **ARiMR / AgroKonto**
- **Priorytet**: **WYSOKI** — to szerszy PL-specific advantage

### 5. **Off-line mode + mobile native app**
- **Kto to ma**: eAgronom (offline mobile), Bushel Farm, DeHaat
- **Czego nam brakuje**: Nasz stack jest Next.js web — musimy dodać PWA offline lub native apk/iOS
- **Priorytet**: **ŚREDNI-WYSOKI** — polskie pola często bez zasięgu (Podlasie, Bieszczady); WhatsApp działa offline (queue), ale dashboards nie.

### Bonus 6: **Community / farmer-to-farmer knowledge exchange**
- **Kto to ma**: Farmer.CHAT (peer voice messages), AgroStar (WhatsApp groups)
- **Coś czego raczej nie będziemy robić w MVP**, ale warto mieć na roadmap

---

## 9. TOP 3 nasze unikalne przewagi

### 1. **Agentic AI w języku polskim z OpenClaw Gateway**
- Jesteśmy jedyną platformą, która łączy:
  - LLM (OpenClaw Gateway / OpenRouter fallback)
  - **Polski język native** (system prompt polish-tuned)
  - **Tools/skills** (agri-fields, agri-satellite, agri-weather, agri-notify) = prawdziwy agent nie chatbot
  - Integrację Sentinel-2 (free) przez CDSE OAuth
- **Dla konkurencji**: xarvio ma PL UI, ale to dashboard nie agent. Cropin Sage jest agent, ale globalny/enterprise. Farmer.CHAT jest WhatsApp agent, ale po angielsku/hindi.
- **Wniosek**: Z perspektywy polskiego rolnika MVPAgriClaw oferuje UX który nie istnieje nigdzie indziej.

### 2. **Vercel Fluid Compute + Agent per-tenant (Hetzner VM)**
- Nasza architektura: **każdy klient ma własnego agenta** (deploy via Hetzner VM / OpenClaw)
- Brak tej architektury u konkurencji — wszyscy to multi-tenant SaaS
- **Zalety**:
  - Klient posiada **własny model/state/context** (GDPR benefit)
  - Skalowalność per-tenant
  - Pricing upsell: "własny dedykowany agent" = €50-200/month easy
- **To architektoniczna przewaga długoterminowa**

### 3. **WhatsApp-first + Polish crop expertise + ekoschematy integration**
- **Kombinacja którą niewielu ma**:
  - WhatsApp delivery (mają Farmer.CHAT, Farmonaut, FarmerAI — ale nie dla PL)
  - PL crop expertise (mają xarvio, SatAgro, eAgronom — ale nie WhatsApp)
  - Ekoschematy/PROW awareness (mają eAgronom, SatAgro — ale bez AI chat)
- **"Pole 3 pryskaj jutro 5:30" UX z tagline** — to jest differentiator który nikt nie oferuje w kombinacji.

---

## 10. Blue Ocean gaps — funkcje których NIKT nie oferuje

Analizując wszystkie 28 konkurentów, zidentyfikowałem **funkcje których nikt nie oferuje**, ale rolnicy jasno potrzebują:

### 10.1 **Prawdziwa "pamięć agenta" przez lata**
**Gap**: Każda platforma ma "farm records" (eAgronom, SatAgro), ale nikt nie ma agenta który PAMIĘTA:
- "W 2024 mieliśmy septorię pszenicy w polu 3 — w 2026 zrób preemptive spray"
- "Twój rzepak na glebie III/IVa zawsze słabo plonuje — rozważ burak"
- "Pan Kowalski z sąsiedniego pola spryskał swoje rano — wiatr 15:00 northern, masz okno do 17:00"

**Tech**: Long-term episodic memory w Postgres + LLM z cross-season reasoning.

**Konkurencja**: Cropin Sage jest najbliżej (historical data), ale globalny i enterprise-only.

### 10.2 **Cross-farm hyperlocal intelligence (swarm learning)**
**Gap**: FieldView ma "your farm vs region average" — ale nikt nie ma:
- "3 inne farmy w promieniu 10 km miały larwy choroby X wczoraj — masz ryzyko"
- "Twój sąsiad osiągnął +15% yield z mniej N — zobacz ich strategię (anonimizowaną)"
- Federated learning na poziomie powiatu/gminy

**Tech**: Anonymized cross-farm data pooling (opt-in) + ML trend detection.

**Konkurencja**: OneSoil ma "community" ale passive. FarmerAI ma extension officer network (human not AI).

### 10.3 **Integration z kupnem/sprzedażą ŚOR (pricing + availability)**
**Gap**: FieldView, xarvio polecają produkty ale nie scale price comparison. **Nikt nie agreguje**:
- Cena tego samego fungicydu w 5 punktach sprzedaży
- Availability real-time (Osadkowski, Ampol-Merol, PWA, Farm Serwis)
- "Najbliższy punkt z Tilmorem w promieniu 20 km: Agrovoj Kraków, 235 zł/L"

**Tech**: Web scraping + API partnerships z dystrybutorami + geo-lookup.

**Konkurencja**: DeHaat robi to w Indiach, nikt w EU. Agrobase ma static catalogs.

### 10.4 **"Co-pilot" for variable seeding/fertilization — live in tractor cab**
**Gap**: FieldView Drive 2.0, Trimble, Deere to generate prescription maps. **Brak** real-time asystenta w kabinie.
- "Robert, jesteś na 50% pola — pokrywasz obszar z glebą III/IV, rekomenduję obniżyć dawkę N o 15%"
- Głosowy interface (safe-for-driving)
- Telemetria ciągnika → live adjustments

**Tech**: Voice LLM + BT/CAN bus integration + edge computing.

**Konkurencja**: Koncept zbliżony ma Ceres AI + CNH, ale nie agentic voice.

### 10.5 **Klimatyczna "auto-insurance" integration**
**Gap**: Nie ma połączenia AI farm advisor + insurance:
- Agent detects susza/przymrozki/grad/powódź → automatycznie składa roszczenie do ubezpieczyciela
- Satelita + weather jako proof-of-loss
- Integracja z Generali Agro, PZU Rolnik, Vereinigte

**Tech**: Index-based parametric insurance API + satellite evidence.

**Konkurencja**: Niezwykle nisko; jakieś pilot-e (SmartRisk CropIn) ale nie mainstream.

### 10.6 **Carbon credit marketplace INTEGRATED z advisor**
**Gap**: eAgronom robi carbon credits, ale oddzielnie od advisory. **Brak**:
- "Ta decyzja (cover crop, minimum till) = +0.5 tCO2/ha = ~€35 w 2026 market"
- Auto-submit do Verra/Gold Standard/EU ETS
- Real-time carbon pricing

**Tech**: MRV (Measurement, Reporting, Verification) + market integration.

### 10.7 **Regulacje EU/PL jako "policy agent"**
**Gap**: Agent który pilnuje compliance i avoid penalties:
- CAP (Wspólna Polityka Rolna) rules changing every year
- Dyrektywa azotanowa (limity N)
- Wymogi kontroli ARiMR — automatyczne przygotowanie
- **Nikt tego nie ma conversational**
- Żaden z Western platforms nie zrozumie polskich przepisów

**Tech**: Regulatory RAG corpus (Dz.U., rozporządzenia MRiRW).

---

## 11. Rekomendacje strategiczne

### 11.1 Short-term (Q2-Q3 2026)

1. **Dodaj image queries do WhatsApp flow** — MVP vision diagnosis (choroba/szkodnik z fotki)
2. **Integracja ekoschematów** (w szczególności Retencja, Międzyplony, Rolnictwo węglowe, Biologiczna ochrona)
3. **Prediction models**: septoria pszenicy, zaraza ziemniaka, mszyce rzepaku
4. **Landing page SEO** celujące frazy: "doradca rolniczy AI Polska", "SatAgro alternatywa", "rolnictwo satelitarne PL"

### 11.2 Mid-term (Q4 2026 - Q2 2027)

1. **VRA prescription export** (ISOXML, shapefile, Deere/Case/Fendt integration)
2. **PROW/IACS integration** — farmer może złożyć wniosek PROW przez naszego agenta
3. **Partnership z dostawcami ŚOR** (Osadkowski, Ampol-Merol) — price comparison w PL
4. **Mobile app PWA** offline capability
5. **Partnership z ubezpieczycielem** (Generali Agro / TUW) — parametric insurance pilot

### 11.3 Long-term (2027+)

1. **Cross-farm swarm intelligence** (opt-in federated)
2. **Voice co-pilot in tractor cab** (BT integration)
3. **Carbon credit marketplace** integration (EU ETS mature 2027)
4. **Expansion Czechy, Słowacja, Węgry** — podobne uprawy, FREE Sentinel-2

### 11.4 Czego NIE robić

- **Nie konkurujemy cenowo z free** Farmer.CHAT na emerging markets (geograficzny mismatch)
- **Nie konkurujemy** w USA/LATAM (Deere/FieldView bezpieczni)
- **Nie rozwijamy hardware** (Cropler/Arable ścieżka = kapitałochłonne)
- **Nie kupujemy własnej konstelacji** (Satellogic/Planet ścieżka = setki milionów)

---

## 12. Załącznik A — tabela źródeł

### Obszar A — Big Tech

- John Deere Ops Center — https://www.deere.com/en/technology-products/precision-ag-technology/operations-center/features/
- John Deere PRO launch — https://www.farm-equipment.com/articles/21052-john-deere-introduces-operations-center-pro-for-ag-retailers
- See & Spray 5M acres 2025 — https://www.agtechnavigator.com/Article/2025/11/10/john-deere-uses-ai-to-slash-farmers-input-costs/
- Climate FieldView pricing — https://nerdisa.com/climate/
- FieldView European expansion (VitalFields) — https://www.feedstuffs.com/agribusiness-news/climate-corp-expands-into-europe
- FieldView G2 reviews — https://www.g2.com/products/climate-fieldview/reviews
- Trimble/PTx — https://ptxtrimble.com/en/products/software/trimble-agriculture-software
- Vantage Polska (PL dealer Trimble) — https://vantagepolska.pl/platforma-obserwacji-satelitarnych-sat-agro/
- CNH AFS Connect — https://www.caseih.com/en-us/unitedstates/products/advanced-farming-systems/afs-connect/afs-connect-farm
- CNH 2025 Tech Day — https://investors.cnh.com/news/news-details/2025/CNH-2025-Tech-Day-showcasing-customer-centric-farming-innovations-across-AI-Autonomy-Robotics-and-Automation/default.aspx
- AGCO Fuse — https://investors.agcocorp.com/news-releases/news-release-details/c-o-r-r-e-c-t-i-o-n-agco-corporation-0

### Obszar B — Satellite Startups

- Satellogic FY2025 — https://investors.satellogic.com/news-releases/news-release-details/satellogic-reports-fourth-quarter-and-full-year-2025-financial
- Planet Labs Agriculture — https://www.planet.com/industries/agriculture/
- Planet EU CAP Monitoring — https://www.planet.com/industries/government/agriculture-monitoring/cap/
- EOS SAT Tech — https://eos.com/blog/eos-sat-agro-focused-constellation-tech-overview/
- EOS Crop Monitoring — https://www.saasworthy.com/product/eos-crop-monitoring
- OneSoil — https://onesoil.ai/en
- Taranis Series D — https://www.prnewswire.com/il/news-releases/taranis-raises-40-million-series-d-to-advance-crop-intelligence-and-unlock-growth-opportunities-for-agribusinesses-301616996.html
- Taranis + Syngenta — https://agrotech.space/2025/10/13/syngenta-taranis-partnership-ai-crop-us/amp/
- Cropwise platform scale — https://www.agtechnavigator.com/Article/2025/10/08/tech-insight-exploring-syngentas-cropwise-platform/
- Cropwise opens to developers — https://www.syngenta.com/media/media-releases/2025/syngenta-opens-cropwise-digital-platform-developers-co-innovate-and
- Agremo — https://www.agremo.com/products/crop-monitoring/
- xarvio FIELD MANAGER For AgBusiness — https://www.basf.com/global/en/media/news-releases/2025/09/p-25-176
- xarvio Grapes — https://www.basf.com/global/en/media/news-releases/2025/11/p-25-227
- Prospera Valmont acquisition — https://agfundernews.com/prospera-valmont-acquires-crop-analytics-startup-for-300m
- Ceres AI — https://www.crunchbase.com/organization/ceres-imaging
- Bushel Farm — https://bushelfarm.com/pricing/
- SatAgro PL — https://satagro.pl/
- Cropler PL — https://www.cropler.io/
- Cropler €150k — https://hackernoon.com/ai-driven-solutions-for-modern-agritech-interview-with-soty-2024-nominee-cropler

### Obszar C — AI Agent Startups

- Farmer.CHAT — https://digitalgreen.org/farmer-chat/
- Farmer.CHAT CGAP — https://www.cgap.org/blog/beyond-chat-ai-powered-advice-for-women-farmers
- Kheti Buddy — https://khetibuddy.com/
- Kheti Buddy pricing — https://www.techjockey.com/detail/kheti-buddy
- Cropin Sage launch — https://www.cropin.com/press_release/cropin-launches-sage-worlds-first-real-time-gen-ai-powered-agri-intelligence-platform/
- Cropin funding — https://tracxn.com/d/companies/cropin/__lg6houpNgQIef29T-gWVgL3jDhqSvoQ1uynp0MM4gOA/funding-and-investors
- Cropin About — https://www.cropin.com/about/
- Arable Mark 3 — https://www.arable.com/mark3/
- Agrobase app — https://apps.apple.com/us/app/agrobase/id1314976795
- Farmonaut — https://farmonaut.com
- eAgronom — https://www.eagronom.com/
- eAgronom PL market share — https://agronomist.pl/articles/poland-the-eagronom-platform
- 2026 Agritech funding — https://tracxn.com/d/sectors/agritech/__8-OCx7Zf21c5QYzq6iONRd31GtL5haydTw9qIEP-m3o

### Obszar D — WhatsApp/Emerging Markets

- DeHaat — https://focusagritech.com/dehaat/
- DeHaat Better India — https://thebetterindia.com/farming/dehaat-ai-agritech-platform-indian-farmers-10943764
- AgroStar — https://corporate.agrostar.in
- BharatAgri — https://pitchbook.com/profiles/company/169689-88
- Apollo Agriculture — https://www.apolloagriculture.com/
- Apollo debt 2024 — https://disruptafrica.com/2024/01/30/kenyan-agri-tech-startup-apollo-agriculture-raises-10m-debt-funding/
- Hello Tractor — https://hellotractor.com/
- Hello Tractor 2.5M — https://empowerafrica.com/how-hello-tractor-is-scaling-farm-mechanization-to-improve-smallholder-productivity-in-africa/
- Twiga Foods restructuring — https://techcabal.com/2025/06/06/twiga-foods-halts-nairobi-operations/
- Ignitia — https://digitalx.undp.org/catalogs/ignitia.html
- FarmerAI Safaricom — https://techafricanews.com/2025/02/11/ai-meets-agriculture-as-safaricom-and-opportunity-international-unveil-farmerai/
- FarmerAI Malawi Ulangizi — https://mshale.com/2025/09/26/how-ai-is-helping-some-small-scale-farmers-weather-a-changing-climate/

---

## Koniec raportu

**Data sporządzenia**: kwiecień 2026
**Następna aktualizacja rekomendowana**: Q3 2026 (w sezonie czołowych ogłoszeń Series dla agritech)
**Kontakt**: contact@infinityteam.io

> "Gdzie konkurencja buduje dashboardy, my budujemy agenta. Gdzie oni budują SaaS, my budujemy rozmowę. Gdzie oni mówią po angielsku, my mówimy pole 3 pryskaj jutro 5:30."
