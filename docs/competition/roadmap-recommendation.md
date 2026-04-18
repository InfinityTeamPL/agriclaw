# AgriClaw Roadmap Recommendation — 3 / 6 / 12 miesięcy

**Data analizy:** 2026-04-18
**Bazy:** `feature-matrix.md`, `pricing-comparison.md`, `ui-ux-patterns.md`, `agriclaw-gap-analysis.md`

**Filozofia:** Prioritize features które (a) dogonie MUST-HAVE standard konkurencji, (b) wzmocnimy UNIKALNE UNIQUE SELLING POINTS (AI agent + WhatsApp + PL native), (c) budują moat dla faza 2-3.

---

## TL;DR — główne priorytety

| Horyzont | Focus | Kluczowe deliverables |
|---|---|---|
| **3 mies (MVP 1.0)** | "Dogoń SatAgro" + wzmocnij WhatsApp agent | Scouting pins, księga polowa, PPP rejestr, WhatsApp flow, Spray Timer, offline PWA |
| **6 mies (1.5)** | "Zwycięż jako polski smart FMS" | VRA maps + ISOXML, photo disease detection, yield prediction, Field Leaderboard, voice interface |
| **12 mies (2.0)** | "Platforma/ekosystem" | Drone integration, JD/CLAAS OAuth, carbon credits add-on, UA/CZ localization, skill marketplace, B2B2F coop deals |

---

## FAZA 1: Dogonić standard (miesiące 1-3, MVP 1.0)

**Cel biznesowy:** Rolnik który dzisiaj rozważa SatAgro Premium (30 PLN/ha) musi mieć uczciwy wybór między SatAgro vs AgriClaw. Nie możemy być niżej na MUST-HAVE featureach.

**Revenue impact target:** Zamknij pierwsze 50-100 paying customers w MVP launch, ~2-5k MRR
**Success metric:** 500+ signup, 50+ paying farmerzy (po trialu 30 dni)
**Założenie skill team:** 2-3 full-stack, 1 designer, 1 agronom konsultant

### Miesiąc 1 — Core field operations

| Week | Deliverable | Owner | Rationale |
|---|---|---|---|
| W1 | **Scouting pins + photo + GPS** (PWA camera API) | FE+BE | Must-have na każdej konkurencyjnej platformie. Schema: `Scouting` table |
| W1 | **Spray Timer widget** (hourly Open-Meteo + wind/RH/temp) | BE | Copy z xarvio. Low-effort, unique in PL market. "Okno spray jutro 5:30-9:00" |
| W2 | **Księga polowa — FieldActivity CRUD** | FE+BE | EU compliance must-have. Schema: `FieldActivity` (sowing/spraying/fertilization/harvesting) |
| W2 | **PPP rejestr** (szczegółowy — dawka/ha, data, BBCH, typ) | FE+BE | eAgronom flagship. ARiMR compliance |
| W3 | **Field Leaderboard** (sortuj pola by NDVI, ryzyko) | FE | Quick win. EOS-style. Używa istniejące `ndvi_readings` data |
| W3 | **Split-view NDVI history** (rok A vs rok B) | FE | MUST standard feature. Climate/EOS mają |
| W4 | **Disease-specific models** (Septoria, Fusarium, rdza, Phytophthora) | BE | Upgrade z ogólnego "possible disease" do per-choroba alerts. Rule-based w `recommendations.ts` |
| W4 | **BBCH stage tracking** w UI pola | FE+BE | GDD from Open-Meteo, auto-advance. Czytelne per crop |

### Miesiąc 2 — WhatsApp flagship feature

| Week | Deliverable | Owner | Rationale |
|---|---|---|---|
| W5 | **WhatsApp Business Cloud API** integration | BE | **Flagship differentiator.** Meta webhook receiver |
| W5 | **Inbound WA → agent → response** | BE | Rolnik pisze na WA, agent z OpenClaw odpowiada z context farm |
| W6 | **Outbound alerts przez WA** (z cron `agri-notify.whatsapp`) | BE | Schema ready (`sentViaWhatsapp` on `Recommendation`). Just wire up Meta API |
| W6 | **Template messages approved** (spray timing, drought alert, disease risk) | BE + Meta approval | Poza 24h window potrzebne approved templates |
| W7 | **Photo scouting przez WA** (user sends photo, agent analyzes) | BE + AI | Use Gemma 4 / Claude vision via OpenRouter (`ai/openrouter.ts` already) |
| W7 | **AI image vision dla chorób** | BE | Upload photo → diagnoza + PPP suggestion. Trenuj na Plantix-like dataset |
| W8 | **Offline PWA real** (IndexedDB queue) | FE | Rolnik w polu bez sieci. Background sync API |
| W8 | **Tile caching** dla obszaru gospodarstwa | FE | MapLibre offline tiles (<=50MB per farm) |

### Miesiąc 3 — Launch polish

| Week | Deliverable | Owner | Rationale |
|---|---|---|---|
| W9 | **Landing page update** z competitive comparison tabela | Marketing | Pokaż wyższość vs SatAgro / eAgronom |
| W9 | **Pricing page** — Free (50 ha) + Farmer (20 PLN/ha) + Pro (30 PLN/ha) | Marketing | Transparentność like Climate FieldView |
| W10 | **Stripe integration** dla subscribtionów | BE | Hybrid: per-hektar czy flat w Pro |
| W10 | **Onboarding flow** z auto-detect pól z Sentinel-2 | FE+BE | OneSoil-like. Zmniejsz friction signup → first value |
| W11 | **Email digest weekly** — raport dla rolnika | BE | Przypomnienie value. "W tym tygodniu: 3 pola w strefie ryzyka" |
| W11 | **Dashboard "Your Farm at a Glance"** (Climate copy) | FE | Summary-first UX. Kluczowe metryki na górze |
| W12 | **Beta launch** dla 20-50 farmerów test | All | Polish based on feedback |
| W12 | **ARiMR raport PDF eksport** (z FieldActivity + PPP data) | BE | Differentiator vs ogólnych FMS |

### Faza 1 — features NIE w scope (rozmyślnie odpuszczone)
- VRA maps + ISOXML export — za skomplikowane jak na MVP, fane 2
- Voice interface — ma niższy ROI niż WhatsApp text flow
- JD / CLAAS OAuth — wymagają partnerstw, faza 2
- Native iOS/Android — PWA wystarczy jeśli scouting pins offline działa

### Faza 1 metrics
- **Time to first value** (signup → pierwsza rekomendacja agenta): < 5 min target
- **Daily Active Users** po 30 dniach: 40% of signups
- **Retention Month 1 → Month 2**: 60%+
- **Average farm size paying**: 200 ha
- **Conversion trial→paid**: 25%+
- **Target MRR**: 2,000-5,000 EUR by end-month-3

---

## FAZA 2: Zwycięż jako polski smart FMS (miesiące 4-6, v1.5)

**Cel biznesowy:** Stać się TOP-3 pick dla polskiego rolnika 50-500 ha. Wzmocnić agent jako prawdziwie "cyfrowy agronom".

**Revenue target:** 300+ paying farmerzy, 15-25k MRR
**Team growth:** dodać ML engineer (dla AI vision + yield prediction), customer success (dla onboardingu)

### Miesiąc 4 — Variable Rate (match SatAgro)

| Deliverable | Rationale |
|---|---|
| **VRA map generator** z NDVI → strefy (low/med/high) | SatAgro flagship. Podstawa dla precyzyjnego nawożenia |
| **N-prescription algorytm** (inverse NDVI + target yield + soil) | xarvio/SatAgro copy |
| **Seed script generator** | FieldView flagship. Różnicuj density po strefach |
| **ISOXML + shapefile eksport** (JD, CLAAS, Amazone, Horsch, Rauch formats) | Bez tego rolnik z maszynami nie zrobi use |
| **Preview mapy z gradient** + edit zones manually | UX polish |

### Miesiąc 5 — AI-powered insights

| Deliverable | Rationale |
|---|---|
| **Photo disease detection** (mobile + WhatsApp) — fine-tune własny model PL | Plantix-like, ale PL crops + WhatsApp flow |
| **Yield prediction ML** (14-day) na Sentinel-2 + weather + historia | EOS/Cropin feature, high perceived value |
| **Crop rotation planner** z N balance | AGRIVI/eAgronom flagship. Użyj AI agent — "rozważ jęczmień na polu 3 w przyszłym roku, bo pszenica 4 lata z rzędu to GAEC problem" |
| **Financial analytics** — koszt/ha/plon/marża | SatAgro Expert (mapowanie rentowności) copy |

### Miesiąc 6 — Unique moat

| Deliverable | Rationale |
|---|---|
| **Voice interface** — Whisper PL + TTS | Nikt w EU dla FMS nie ma. Rolnik 60+ kocha |
| **Voice messages na WhatsApp** | Wysyłaj voice na WA, agent zrozumie |
| **Anonymized benchmarks** — "Twoja gmina NDVI 0.58, Ty 0.51" | Social farming unique feature |
| **Team module** (agronom + operator access) | Owner dodaje pracowników, assigns tasks |
| **Export dla doradcy / agronoma** (shareable link, no signup) | eAgronom integracja-like |

### Faza 2 — unikalne decyzje
- **B2B2F pilot** z 1-2 koop / sklepami rolniczymi (ProCam, AGROAS, Mlekovita) — rolnicy dostaną trial od ich dealera
- **Pierwsza iteracja RAG** na polskich źródłach (IUNG, COBORU, ARiMR pdfs, MRiRW PPP baza)
- **Insurance claim workflow** — NDVI historia jako dowód szkody, export PDF dla Concordia/TUW

### Faza 2 metrics
- **MAU (Monthly Active Users)**: 1,000+
- **Paying farmerzy**: 300+
- **MRR**: 15-25k EUR
- **NPS score**: >40
- **WhatsApp adoption**: 70%+ użytkowników aktywnie używa WhatsApp channel
- **Churn monthly**: <5%

---

## FAZA 3: Platforma / ekosystem (miesiące 7-12, v2.0)

**Cel biznesowy:** AgriClaw jako infrastrukturę dla polskiego (i CEE) rolnictwa. Partnerships, skill marketplace, scale.

**Revenue target:** 1,500+ paying farmerzy, 80-150k MRR. Pierwsze enterprise coop deals (10-50k EUR each).

### Miesiące 7-9 — Integracje & Market expansion

| Deliverable | Rationale |
|---|---|
| **John Deere Operations Center OAuth** | Import fields/boundaries/operations. Ważne dla dużych gospodarstw |
| **Climate FieldView data sync** (Plus API) | Rolnik może tu mieć historię z FV (bo FV dalej ma domination w US/PL duże gospodarstwa) |
| **CLAAS Telematics** — przez Leaf API | Europe-native |
| **ISOBUS TaskController** sync | Prescription maps → machine controller |
| **Ukraiński native UI** + lokalizacja | Market 30M ha, rolnicy UA w PL. Low-effort (next-intl). |
| **Drone orthomosaic upload + stitching** | DJI Phantom/Mavic users. Open Drone Map backend |
| **DJI AGRAS prescription export** | Spraying drones są rosnący market |

### Miesiące 10-12 — Moat deepening

| Deliverable | Rationale |
|---|---|
| **Carbon credits add-on** (Verra/Gold Standard partnership albo eAgronom white-label) | Revenue stream + compliance. Pricing: 5 PLN/ha/rok opt-in |
| **GAEC compliance tracker** native | SatAgro Expert copy. Nakazowe dla rolników z dopłatami |
| **OpenClaw skill marketplace** dla AgTech community | Developer buduje np. `agri-insurance-claim`, rolnik instaluje w agencie. Moat na lata |
| **Mobile native app** (Capacitor z PWA backbone) | Jeśli badania pokażą że 20%+ user-ów odbija się od PWA |
| **RAG z polskimi agronomicznymi źródłami** (IUNG, COBORU, przepisy PPP, kalendarz ARiMR) | Agent zna polską agronomię jak własny rolnik |
| **Sentinel-1 radar integration** (dla chmur) | Chmurowe dni są problem w PL. C9 w gap analysis |
| **Czech + Słowacja + Niemcy lokalizacje** | CEE ekspansja, infra już gotowa |
| **Full SMAP HDF5 implementation** | Backup dla Open-Meteo, validation layer |

### Faza 3 — partnerships game
- **2-3 duże kooperatywy rolnicze** pod white-label
- **1-2 ubezpieczyciele AGRO** — accept AgriClaw raports jako evidence
- **MRiRW rozmowy** o pilot ekoschematów (state-funded onboarding)
- **Akademia Rolnicza w Krakowie / Poznaniu / Warszawie** — badania + dane + credibility

### Faza 3 metrics
- **Paying farmerzy**: 1,500-3,000
- **MRR**: 80-150k EUR
- **Enterprise deals**: 3-5 coop/ubezpieczyciele, 50-200k EUR each ACV
- **Geographic reach**: PL + UA + CZ + SK + DE (5 countries)
- **Skills marketplace**: 20+ community-built skills
- **Team size**: 12-15 people

---

## Revenue Impact × Effort matrix (priorytety fazy 1)

Dla każdej sugestii w fazie 1, skala 1-5 dla obu osi:

| Feature | Impact (revenue + retention) | Effort (dev time) | Priority |
|---|---|---|---|
| Scouting pins + photo | 5 | 2 | **HIGH** |
| Spray Timer widget | 5 | 1 | **VERY HIGH** (quick win) |
| Księga polowa + PPP | 5 | 3 | **HIGH** |
| WhatsApp agent (full flow) | 5 | 3 | **VERY HIGH** (flagship) |
| Photo disease detection (AI vision) | 5 | 4 | **HIGH** (but in faza 2) |
| Field Leaderboard | 3 | 1 | **MEDIUM** (quick win) |
| Split-view NDVI history | 4 | 2 | **HIGH** |
| Disease-specific rules | 4 | 2 | **HIGH** |
| BBCH tracking | 3 | 2 | **MEDIUM** |
| Offline PWA | 4 | 3 | **HIGH** |
| ARiMR PDF eksport | 4 | 2 | **HIGH** |
| Auto-detect pól Sentinel | 3 | 4 | **MEDIUM** (faza 1 tail lub 2) |
| VRA maps + ISOXML | 5 | 5 | **HIGH** (FAZA 2) |
| Yield prediction ML | 4 | 5 | **MEDIUM** (FAZA 2) |
| Voice interface | 4 | 4 | **MEDIUM** (FAZA 2) |
| Drone integration | 3 | 5 | **LOW** (FAZA 3) |
| JD OAuth | 4 | 4 | **MEDIUM** (FAZA 3) |
| Carbon credits | 3 | 5 | **LOW** (FAZA 3, partner-dependent) |
| Skill marketplace | 5 | 5 | **HIGH** (FAZA 3, moat) |
| Mobile native | 3 | 5 | **LOW** (only if PWA proven insufficient) |

---

## Budżet / resource plan orientacyjny

### Faza 1 (miesiące 1-3) — MVP 1.0
- **Engineering**: 2.5 FTE × 3 miesiące = 7.5 FTE-months = ~45-75k EUR (PL rates)
- **Design**: 0.5 FTE = 7.5-12k EUR
- **Agronom konsultant**: 0.25 FTE = 5-10k EUR (important dla rule correctness)
- **WhatsApp Business API setup + approval**: ~1-2k EUR
- **Infra (Hetzner + Vercel + Upstash)**: ~200-500 EUR/mies. = 1-2k EUR
- **Marketing**: landing page, copy, small ads = 5-10k EUR
- **Legal (GDPR, terms, Polish compliance)**: 2-5k EUR
- **Total faza 1**: ~70-120k EUR

### Faza 2 (miesiące 4-6) — v1.5
- **Engineering**: 3.5 FTE × 3 miesiące = 55-90k EUR (dodaje ML engineer)
- **Design + UX research**: 1 FTE = 12-20k EUR
- **Agronom**: 0.5 FTE = 10-15k EUR
- **Customer Success**: 1 FTE = 12-20k EUR
- **AI/ML compute** (OpenRouter, Gemma fine-tune data, vision model): 5-10k EUR
- **Infra scaling**: 1-2k EUR/mies. = 3-6k EUR
- **Marketing (wzrost)**: 15-25k EUR
- **Total faza 2**: ~110-180k EUR

### Faza 3 (miesiące 7-12) — v2.0
- **Engineering**: 6 FTE × 6 miesięcy = 180-300k EUR (multi-team)
- **Design + UX**: 2 FTE = 48-80k EUR
- **Agronomy team (+ RAG dataset curator)**: 1.5 FTE = 45-75k EUR
- **Customer Success**: 2 FTE = 48-80k EUR
- **Sales (B2B coop deals)**: 1 FTE = 30-50k EUR
- **AI/ML compute + fine-tuning**: 20-40k EUR
- **Partnerships / legal dla Verra, ISO compliance**: 10-20k EUR
- **Infra scaling (1,500+ farms, skill marketplace compute)**: 10-20k EUR
- **Marketing (CEE ekspansja)**: 50-100k EUR
- **Total faza 3**: ~440-785k EUR

**Kumulatywnie do końca roku 1**: 620-1,085k EUR vs. planowany revenue ARR 1.2-2M EUR (break-even w Q4/Y1 realistic ale optimistic).

---

## Ryzyka & mitigations

| Ryzyko | Prawdop. | Impact | Mitigation |
|---|---|---|---|
| WhatsApp Business API approval timeline (Meta może zwlekać 2-6 tyg.) | Medium | High | Zacznij procedurę w W4 faza 1, fallback SMS provider (Twilio) |
| Polskie przepisy RODO / wymogi dla FMS przechowujące dane rolników | Low | Medium | Legal review w miesiącu 1, RODO-compliant from day 1 w `prisma/schema.prisma` (już phone_number opcjonalne) |
| SatAgro / eAgronom szybko kopiuje WhatsApp | Medium | Medium | Pierwsi na rynku = moat. OpenClaw agent per-farmer jest trudniejszy do skopiowania |
| Copernicus CDSE rate limits przy scale | Medium | High | Already paying attention in `copernicus.ts` (multi-band single request). Purchase Sentinel-Hub subscription jeśli wolumen rośnie |
| Hetzner VM costs growing liniowo z farmerami | High | Medium | Pool server model (już w schema), potem migracja na shared agent pool (multi-tenant na większych VM) |
| Rolnik nie ufa AI ("robot mi mówi kiedy pryskać") | Medium | High | Agent zawsze wyjaśnia "bo ET0 4mm/dzień + 5 dni bez deszczu + NDVI spadł 0.12". Transparent reasoning |
| Partnerzy maszyn (JD, CLAAS) nie zgodzą się na OAuth | Medium | Medium | JD ma publiczny dev portal. Leaf.ag jako middleman. CLAAS może wymagać partnership |
| AI hallucinacje agenta (polecił złą dawkę fungicydu) | High | Very High | System prompt FORCES tool calls dla konkretnych wartości. Każda rekomendacja dawki wymaga human approval. Disclaimer. PPP database jako groundtruth |

---

## Kluczowe decyzje "go / no-go" punkty w roadmapie

### Po miesiącu 3 (end of MVP 1.0)
- **Go**: >50 paying farmerów, MRR > 2k EUR, retention > 60%, NPS > 30 → continue do faza 2
- **Pivot**: Jeśli WhatsApp nie ma traction, wyciągnąć voice interface wcześniej. Jeśli pricing okazuje się za wysoki, obniżyć do 10-15 PLN/ha

### Po miesiącu 6 (end of v1.5)
- **Go**: >300 paying, MRR > 15k EUR, B2B2F pilot sign z 1 coop → Faza 3
- **Slow down**: Dokończyć features zanim pójdziemy w ekspansję geograficzną. UX polish

### Po miesiącu 12 (end of v2.0)
- **Series A fundraising** (jeśli MRR 80-150k/mies. = 1-1.8M EUR ARR): 2-5M EUR round dla expansion (fin-in-zone, maszyny OEM integrations, US market)
- **Bootstrapping / profit**: kontynuuj lean jeśli break-even osiągnięty organically

---

## Konkluzja: unikalne stanowisko AgriClaw w 2027

**"Polski cyfrowy agronom w każdej kieszeni — rozmawiasz z nim po WhatsApp, on widzi Twoje pola z kosmosu, a rano dostajesz konkretną radę czasową: 'pole 3 pryskaj jutro 5:30, potem wiatr za mocny'."**

Po 12 miesiącach AgriClaw będzie:
1. Jedyny FMS z **AI agent per-farmer** dedicated VM
2. Jedyny **WhatsApp-first** FMS w EU z voice + photo + text
3. Jedyny **PL-native** z polską agronomią RAG (IUNG, COBORU, ARiMR)
4. Porównywalny z SatAgro w satellite features + wyższy w AI i UX
5. Porównywalny z eAgronom w compliance + wyższy w modernym stacku (PostGIS, Next.js 14, MapLibre)
6. Lepszy w retention dzięki personalized learning agenta

**Moat lat 2-5:** skill marketplace + RAG dataset PL + relacje z coops/ubezpieczycielami + OpenClaw ecosystem community.
