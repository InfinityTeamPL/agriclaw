# AgriClaw Gap Analysis — kwiecień 2026

**Cel:** Zmapować co AgriClaw MA dzisiaj, czego NIE MA a jest standardem (MUST-HAVE dla MVP 1.0), co jest NICE-TO-HAVE (Faza 2), i gdzie możemy zdobyć przewagę BLUE-OCEAN.

**Base data:**
- Codebase inspection: `src/lib/satellite/*`, `src/lib/recommendations.ts`, `prisma/schema.prisma`, `src/app/api/skills/*`, `src/components/*`
- Competitor research: patrz `feature-matrix.md`, `pricing-comparison.md`, `ui-ux-patterns.md`

---

## A. Features które MAMY dzisiaj (✅ obecny stan)

### Satellite & Imagery
- [x] **NDVI** (Sentinel-2, Copernicus Data Space) — `copernicus.ts` `fetchNdviGeotiff`
- [x] **NDRE** — niedobór azotu, multi-band evalscript
- [x] **NDWI (Gao)** — stres wodny w liściach, multi-band
- [x] **SAVI** — skorygowany o glebę, multi-band
- [x] **True-color RGB preview** — `fetchTrueColorPng`
- [x] **Multi-band single request optymalizacja** (NDVI+NDRE+NDWI+SAVI w jednym API call) — **unikalna optymalizacja**
- [x] **NDVI classification + color mapping** — `ndvi.ts` `classifyNdvi`, `ndviColorHex`

### Weather & Meteorology
- [x] **Prognoza pogody 7 dni** — Open-Meteo `weather.ts`
- [x] **ET0 (FAO evapotranspiration)** — daily
- [x] **Soil moisture (Open-Meteo 0-7cm)** — proxy, hourly→daily aggregation
- [x] **Drought risk level** — low/medium/high based on days-without-rain + ET0 + precip
- [x] **Wind speed max daily** — relevant dla spray planning

### Recommendations (Rule-based)
- [x] **Drought stress detection** (NDVI + days_without_rain + ET0 + soil_moisture)
- [x] **Disease suspicion** (NDVI drop without drought)
- [x] **Moderate stress** detection
- [x] **Crop-specific messages** (wheat, corn, rapeseed, barley, potato, rye, oats, sugarbeet)

### AI Agent (UNIQUE ADVANTAGE)
- [x] **OpenClaw Gateway per-farmer** — Hetzner VM dedicated
- [x] **Custom system prompt** — `buildAgriclawSystemPrompt` z farm context
- [x] **HTTP tools / skills** dla agenta:
  - `agri-fields.list`, `.get(id)`, `.history(id, days)`
  - `agri-satellite.ndvi(field_id)`, `.soil-moisture(field_id)`
  - `agri-weather.forecast(field_id, days)`
  - `agri-notify.whatsapp(message, field_id?)` — **endpoint gotowy**
- [x] **SSE streaming chat** — `src/app/api/chat/stream/`
- [x] **Agent models catalog** — `agent-models.ts`
- [x] **Agent template** `agri-advisor` — `agent-templates.ts`
- [x] **Markdown config** (soulMd, identityMd, etc.) — OpenClaw pattern
- [x] **Multi-channel capability** (WEB/WHATSAPP/TELEGRAM) schema-ready

### Authentication & User
- [x] **NextAuth** (Google OAuth + Credentials JWT)
- [x] **Phone number field** (dla WhatsApp identyfikacji)
- [x] **Email verification flow** — `verification_tokens`
- [x] **Middleware route guard**

### Fields & Farm Management
- [x] **PostGIS geometry** — Polygon 4326 stored w `fields.polygon`
- [x] **MapLibre GL field editor** — `FieldMapEditor.tsx`
- [x] **Turf.js area calc** — area_hectares computed
- [x] **Crop types** (wheat/corn/rapeseed/barley/potato/other + rye/oats/sugarbeet w prompt)
- [x] **NDVI history** stored in `ndvi_readings` table
- [x] **Soil moisture history** stored in `soil_moisture_readings`
- [x] **Recommendations history** stored — severity, title, message, action, sentViaWhatsapp

### UI / Platform
- [x] **Next.js 14 App Router** + TypeScript
- [x] **Tailwind CSS + shadcn design tokens** — nowoczesny stack
- [x] **Framer Motion** animations
- [x] **PWA manifest** (`public/manifest.webmanifest`)
- [x] **Service Worker stub** (`public/sw.js`)
- [x] **Dashboard shell + Farm mini-map + Field heatmap** components
- [x] **Chat interface z SimpleMarkdown** renderer
- [x] **Polish native UI** (wszystkie strings)
- [x] **Landing page** (Hero, Features, HowItWorks, CTA, Footer)

### Infrastructure & DevOps
- [x] **Vercel Fluid Compute deploy** config
- [x] **Daily cron** (`/api/cron/daily` 4:00 UTC)
- [x] **Health cron** (co 15 min)
- [x] **Hetzner VM provisioning** (`hetzner.ts`, `provision-script.ts`, `ssh-deploy.ts`)
- [x] **Pool server model** dla pre-provisioned VMs (cx22/cx32)
- [x] **Upstash Redis** rate limiting (optional)
- [x] **Prisma + PostGIS** schema
- [x] **Vitest** test infra

### Compliance infrastructure
- [x] **Terms + Privacy pages** — `/terms`, `/privacy`
- [x] **GDPR-ready schema** — `phoneNumber @unique`, avatarUrl, emailVerified

---

## B. Features STANDARD — NIE MAMY (MUST-HAVE dla MVP 1.0, 3 miesiące)

Te wszystkie mają WSZYSCY konkurenci. Brak ich = rolnik nie przejdzie z SatAgro / eAgronom / OneSoil.

### B1. Scouting & Field Notes (priorytet 1)
- [ ] **Drop pin on map** + note + photo + GPS coords + issue tag
- [ ] **Color-coded issue tags** (choroba / szkodnik / przymrozek / mechaniczny / inne)
- [ ] **Scouting list w UI** — sort, filter, share
- [ ] **Schema**: nowa tabela `Scouting` (fieldId, coords, note, photoUrl, tag, severity, createdAt)
- [ ] **Mobile-first form** z camera integration

### B2. Księga polowa / E-field book (priorytet 1 — EU compliance)
- [ ] **FieldActivity** tabela: date, activity type (sowing/spraying/fertilization/harvesting/tillage), dose, machine, notes
- [ ] **PPP rejestr** — dawka/ha, data, godzina, BBCH, typ środka, rodzaj zabiegu
- [ ] **Nawożenie NPK** rejestr — NPK, Mg, S, Ca values, total per field, per season
- [ ] **Eksport PDF dla ARiMR / urzędów** PL
- [ ] **Przypomnienia o wygaśnięciu okresu karencji** (withholding period)

### B3. Historia pola / Season comparison (priorytet 2)
- [ ] **Split-view UI** — rok A vs rok B side-by-side
- [ ] **Timeline slider** dla NDVI history per field
- [ ] **Multi-season aggregates** — `season` tabela z start/end dates, crop, total_yield, total_cost
- [ ] **Yield entry** — user wprowadza plony po zbiorze

### B4. Mapy aplikacyjne / Variable Rate (priorytet 2)
- [ ] **Generate VRA map z NDVI** (strefy niski/średni/wysoki)
- [ ] **Dawka per strefa** (algorytm: inverse NDVI dla N, proportional dla seed)
- [ ] **Export ISOXML/shapefile** dla maszyn (John Deere, CLAAS, Amazone, Horsch, Rauch)
- [ ] **Preview mapy** z gradient colors
- [ ] **Schema**: `PrescriptionMap` (fieldId, type [N/seed/fungicide], zones JSON, avgDose, createdAt)

### B5. Scouting offline (priorytet 1)
- [ ] **Pełna offline persistence** — IndexedDB queue dla scouting pins
- [ ] **Sync on reconnect** — background sync API
- [ ] **Offline tiles cache** — MapLibre tiles z obszaru gospodarstwa
- [ ] **Service Worker upgrade** — prawdziwy offline-first, nie tylko stub

### B6. Photo disease detection (priorytet 2, Plantix-like)
- [ ] **Upload photo → AI diagnose**
- [ ] **Integracja z Gemma 4 / Claude vision** (lokalna lub OpenRouter fallback — już masz w `ai/openrouter.ts`)
- [ ] **Return disease name + confidence + treatment**
- [ ] **PPP suggestion** (pasuje do rejestru zabiegów)

### B7. Disease-specific models (priorytet 2)
- [ ] **Septoria** (pszenica): RH > 85% + temp 15-25°C + BBCH 30+ = risk
- [ ] **Fusarium head blight** (zboża): rain + warm w fazie kwitnienia
- [ ] **Rdza brunatna / żółta** (pszenica): >18°C dew + niskie słońce
- [ ] **Phytophthora** (ziemniaki): 5 godzin wilgotności + temp > 10°C = Smith period
- [ ] **Mączniak prawdziwy** (różne): suche warunki + temp 15-25°C
- [ ] **Model w `recommendations.ts`** — funkcja `predictDiseases(weather, ndvi, crop, bbch)`

### B8. BBCH stage tracking (priorytet 2)
- [ ] **BBCH w schema** — `bbchStage` Int? na `FieldActivity` i `Field`
- [ ] **GDD calc** — growing degree days z Open-Meteo
- [ ] **Auto-advance BBCH** bazując na GDD + crop type tables
- [ ] **UI tracker** — wizualizacja timeline

### B9. Spray Timer widget (priorytet 2, UNIQUE Low-hanging)
- [ ] **Hourly weather window** — wiatr < 15 km/h + brak opadu 6h + temp 8-25°C + RH 60-90%
- [ ] **Next 72h window visualization** — zielone/czerwone paski hour-by-hour
- [ ] **Push notification** kiedy okno otwiera się
- [ ] **BBCH + disease context** — jeśli pole w Septoria risk + okno 5:30-9:30, rekomendacja precyzyjna

### B10. WhatsApp integracja (priorytet 1, flagship pomysł)
- [ ] **WhatsApp Business Cloud API** — Meta webhook
- [ ] **Inbound messages** — rolnik pisze → message → agent → response
- [ ] **Outbound alerts** — cron + agent sends WhatsApp
- [ ] **Template messages** approved (dla outbound poza 24h window)
- [ ] **Schema**: `channel_config` na `Agent` table (już jest) — dodaj `phoneNumber` linkowanie

### B11. Mobile native apps (priorytet 3 — PWA może być good-enough)
- [ ] **iOS (React Native lub Capacitor)** — jeśli PWA okaże się za ograniczone
- [ ] **Android** dtto
- [ ] **Push via Firebase / APNs**
- [ ] **Camera native integration** (lepsze niż web APIs)

### B12. Field auto-detect (priorytet 3)
- [ ] **Sentinel-2 + ML segmentation** — propose pola z obrazu + boundary
- [ ] **Click to confirm** — user potwierdza które pola są jego
- [ ] **Znacznie szybszy onboarding** (OneSoil flagship)

---

## C. Features NICE-TO-HAVE (Faza 2, 6-12 miesięcy)

### C1. Integracje maszynowe
- [ ] **JDLink / John Deere Operations Center API** — OAuth2 + import fields/boundaries/operations
- [ ] **Climate FieldView Drive data import** (Plus API)
- [ ] **CLAAS Telematics** — przez Leaf API albo bezpośrednio
- [ ] **ISOBUS TaskController** data sync

### C2. Zaawansowana analityka
- [ ] **Yield prediction ML** — trenuj na NdviReading history + weather + cropi
- [ ] **Field Leaderboard** — ranking by NDVI, yield, cost, ryzyko
- [ ] **Financial analytics** — koszt/ha, marża/ha, ROI per crop
- [ ] **Mapowanie rentowności** (SatAgro Expert copy) — strefy × plony × koszty

### C3. Drone integration
- [ ] **Upload orthomosaic NDVI TIFF** z drona (DJI Phantom, Mavic, AGRAS)
- [ ] **Stitching serverless** (Kubeflow albo Open Drone Map hosted)
- [ ] **Overlay on satellite map** w UI
- [ ] **Variable rate z drone-level resolution**

### C4. Voice interface
- [ ] **Voice to text** (Bhashini/OpenAI Whisper) — rolnik mówi po polsku
- [ ] **Agent responds w tekście + voice** (TTS)
- [ ] **WhatsApp voice messages** — rolnik wysyła voice, agent rozumie
- [ ] **Hands-free polowym**

### C5. Telegram notyfikacje
- [ ] **Channel adaptacja** (schema już wspiera: TELEGRAM w `channel`)
- [ ] **Dla młodszych rolników / zadmin gospodarstw**

### C6. Carbon credits / ekoschematy
- [ ] **GAEC compliance tracker** — SatAgro Expert / eAgronom flagship
- [ ] **Emissions calculator** — LCA dla farmy (eAgronom model)
- [ ] **Integracja z Verra lub partnerstwo z eAgronom** — dla carbon credits

### C7. Crop rotation planning
- [ ] **Rotation engine** — suggest next crop based on historia pola + soil + rynek
- [ ] **Nitrogen balance** across rotation years
- [ ] **UI: calendar view** — rok przez rok

### C8. Sentinel-1 radar (chmurowe dni)
- [ ] **SAR data** — soil moisture + biomass przez chmury
- [ ] **Biomass estimate** z VV/VH backscatter
- [ ] **Flood detection** (przy powodziach)
- [ ] **Copernicus Data Space ma to już dostępne** — extension of existing integration

### C9. SMAP integracja (pełna)
- [ ] **HDF5 decoder** dla L3 granule
- [ ] **Fallback dla Open-Meteo** — walidacja soil moisture
- [ ] **9km resolution** ale głobalne (dobre dla trends)

### C10. Marketplace / sprzedaż plonów
- [ ] **Giełda** (ekosystem z partnerami — NZOZ, Cedrob, Agroma)
- [ ] **Kontraktacja** — łącz rolnika z kupującym
- [ ] **Grain Futures** (jak FieldView Plus)

### C11. Zarządzanie pracownikami
- [ ] **Team module** — add members z rolami (owner/agronom/operator)
- [ ] **Task assignment** — przypisz zabieg pracownikowi
- [ ] **Working hours tracking** (eAgronom ma)
- [ ] **Mobile app dla operatorów** — tylko widok zadań

### C12. Magazyn (inventory)
- [ ] **Inventory items** — nasiona, nawozy, środki ochrony, paliwo, plony
- [ ] **Stock levels + expiry dates**
- [ ] **Consumption logging** — każdy zabieg zmniejsza stan
- [ ] **Buy suggestions** — bazujące na planie zabiegów

### C13. Finanse
- [ ] **Cost entries** — nawozy, PPP, pracownicy, maszyny, paliwo
- [ ] **Revenue** — plony × cena
- [ ] **Profit/ha per field, per season**
- [ ] **Export do księgowości** — CSV / integracja z iFirma / Comarch

### C14. Multi-language
- [ ] **UA (Ukrainian)** — duża diaspora rolnicza w PL + bezpośredni market
- [ ] **DE** — rozważyć jeśli pójdziemy CEE
- [ ] **CZ / SK** — pobliskie rynki
- [ ] **i18n infra** — next-intl albo react-i18next

### C15. Raporty dla doradcy / agronoma / ubezpieczyciela
- [ ] **Exportable PDF reports** — customizowalne templates
- [ ] **Shareable link** dla agronoma bez konta
- [ ] **Raport ubezpieczeniowy** — przy szkodach gradobicia / suszy (NDVI historia jako evidence)

### C16. Integracje z IMGW / DWD
- [ ] **IMGW API** native (zamiast Open-Meteo jako primary dla PL)
- [ ] **DWD** dla niemieckiej ekspansji
- [ ] **Stacje meteo użytkownika** (IoT) — LoRaWAN / GSM upload

---

## D. BLUE-OCEAN — gdzie możemy być PIERWSI

Te features ma 0-2 konkurentów, czyli AgriClaw może objąć przewagę pionierską:

### D1. "Agent per rolnika jako cyfrowy pracownik" (UNIQUE FLAGSHIP)

**Konkurencja:** Nikt — Taranis Ag Assistant to helper na ich dashboard, CropIn Connect to chat adapter. **Nikt nie ma DEDICATED Hetzner VM per farm z agent configurable per-farmer.**

**Co możemy:**
- **Personalized onboarding** — agent uczy się preferencji rolnika (ulubione uprawy, godziny pracy, styl komunikacji) z czasem
- **Memory za sezony** — agent pamięta "pole 3 rok temu miało problem z Septorią w fazie kłoszenia" → w tym roku proaktywnie alertuje
- **Multi-agent collaboration** — rolnik może mieć agent + agent-ksiegowy + agent-techniczny (sub-agenty w OpenClaw) — white-label dla doradców
- **Voice-first** — rolnik w polu mówi, agent słucha i działa

### D2. "WhatsApp-native farming" (UNIQUE dla EU/PL)

**Konkurencja:** Plantix ma WhatsApp support w Azji, Farmer.Chat (Digital Green) tak samo w Afryce/Indiach. **W EU nie ma poważnego FMS-through-WhatsApp.**

**Co możemy:**
- **100% interakcji przez WhatsApp** — rolnik 60+ nie musi instalować niczego
- **Voice messages zwrotne** — agent odpowiada nagraniem
- **Photo upload dla disease diagnostyki** — wyślij foto liścia, dostaniesz diagnozę
- **Kod agronoma szybki alert** — "pole 5, oprysk jutro 5:30" SMS-style

### D3. "Polski agronomiczny LLM"

**Konkurencja:** Cropin ma 29 języków ale global knowledge. Farmer.Chat ma Azję/Afrykę. **Brak wyspecjalizowanego LLM dla polskiej agronomii z wiedzą o IUNG, COBORU, normach PL, ARiMR.**

**Co możemy:**
- **Fine-tune / RAG na polskich źródłach** — IUNG reports, COBORU listy odmian, polskie normy nawożenia, kalendarze ARiMR, przepisy PPP PL
- **Agent zna kalendarz ARiMR** — kiedy składać deklaracje, dopłaty, ekoschematy
- **Polskie fungicydy i dopuszczenia** — baza środków ochrony roślin z MRiRW

### D4. "AI compliance officer" (Ekoschematy + GAEC)

**Konkurencja:** SatAgro Expert, eAgronom. **Obydwie pokazują CO, ale nie WYJAŚNIAJĄ / doradzają jak.**

**Co możemy:**
- **Agent tłumaczy przepisy** rolnikowi zrozumiałym językiem: "żeby dostać DRF-31 musisz mieć minimum 3 uprawy w rotacji, z tych uprawa X u Ciebie już jest, zostaje dodać Y"
- **Auto-fill wnioski ARiMR** — agent przygotuje draft, rolnik zatwierdzi
- **Real-time GAEC monitoring** — "odkąd siałeś rzepak 4 lata pod rząd na polu 2, stracisz ekoschemat"

### D5. "Social farming — sąsiedzi w agencie"

**Konkurencja:** Plantix community 500+ expertów. **Brak social w tradycyjnych FMS.**

**Co możemy:**
- **Anonymizowana benchmarks** — "w twojej gminie średni NDVI pszenicy 0.58, Twoje 0.51" (bez identyfikacji konkretnych pól)
- **Pest outbreak alerts** — jeśli 3 rolników w 10km zgłasza szkodnika, wszystkim w obszarze alert
- **Agent-to-agent** — twój agent może wymieniać info z sąsiadem (z permission)

### D6. "Mobile-first PWA z voice + camera" dla rolnika 2026

**Konkurencja:** Większość platform ma native app + web. **AgriClaw = jedna PWA dla wszystkich urządzeń z zero instalacji.**

**Co możemy:**
- **Zainstaluj z WhatsApp link** — ikona pojawi się na home screen
- **Voice scouting** — "w polu 3 widzę plamy na liściach" → auto transcript + AI analysis + create scouting pin
- **Camera scouting** — jedno zdjęcie z GPS, agent analizuje chorobę + creates PPP suggestion

### D7. "OpenClaw-powered extensible skills"

**Konkurencja:** John Deere ma API, Cropin Data Hub dla enterprise. **Nikt nie ma skill marketplace dla farming agents.**

**Co możemy:**
- **Skill marketplace** — developer buduje `agri-insurance-claim`, `agri-market-price`, `agri-soil-test` i każdy rolnik może zainstalować w swoim agencie
- **White-label per coop** — Mlekovita zbuduje skill `mlekovita-delivery-booking`, wszyscy rolnicy-dostawcy zainstalują w swoich agentach
- **API community** — open ecosystem dla polskiego AgTech startup scene

### D8. "Insurance-first" — NDVI jako dowód szkody

**Konkurencja:** EOSDA ma "raporty dla insurers" jako B2B. **Brak rolnik-first flow "zgłoś szkodę z dashboardu w 3 klikach".**

**Co możemy:**
- **One-click claim raport** — gradobicie, susza, przymrozek → PDF z NDVI před/po + weather history + scouting pins + photos
- **Integracja z polskimi ubezpieczycielami** — Concordia, TUW, Generali Agro — accepted format
- **AI assessment** — agent: "NDVI spadł z 0.72 do 0.34 w 3 dni, 15 maja był grad 4cm — prawdopodobny szacunek szkody 60-70%"

### D9. "AgriClaw Academy" (edukacja w agencie)

**Konkurencja:** Brak w FMS klasycznych. Tylko Farmer.Chat w Afryce.

**Co możemy:**
- **Agent uczy rolnika** stopniowo podczas codziennych interakcji — przy każdej rekomendacji wyjaśnia "czemu" linkuje do badań
- **Mini-lessons** (video/text) o BBCH, NDVI, chorobach — agent proponuje gdy widzi że rolnik może wiedzieć
- **Gamifikacja** — "dziś pierwszy raz wykryłeś anomalię wcześniej niż agent, +100 punktów"

### D10. "Open-source farming knowledge base"

**Konkurencja:** Wszystkie proprietary.

**Co możemy:**
- **Open-source core** (rekomendacje, disease models, skilli agri-*) w GitHub — community contributes for PL crops
- **Paid infrastructure** — OpenClaw agent hosting, satellite data, WhatsApp integration
- **Unikalne positioning** — jedyny transparent FMS w EU

---

## E. Summary — priorytety wg impact × effort

### High Impact × Low Effort (ZROBIĆ NAJPIERW w fazie MVP 1.0)
1. ✅ Scouting pins + photo + GPS → **~2 tyg**
2. ✅ WhatsApp agent (outbound alerts) → **~2 tyg** (schema ready)
3. ✅ Księga polowa (FieldActivity CRUD) → **~1 tyg**
4. ✅ Spray Timer widget (Open-Meteo hourly już jest) → **~3 dni**
5. ✅ Disease-specific rule models (Septoria, Fusarium) → **~1 tyg**
6. ✅ Split-view NDVI history comparison → **~1 tyg**
7. ✅ Field Leaderboard → **~3 dni**
8. ✅ Offline PWA real (IndexedDB) → **~2 tyg**
9. ✅ PPP rejestr → **~1 tyg**

### High Impact × High Effort (Faza 2, budżet na R&D)
1. VRA maps + ISOXML export
2. Photo disease detection (AI vision)
3. Yield prediction ML model trenowany na PL cropach
4. Mobile native apps iOS+Android (alternatywa do PWA)
5. JD Operations / CLAAS integracje

### Low Impact × Low Effort (quick wins opcjonalne)
1. Telegram notyfikacje (schema już wspiera)
2. Crop knowledge base (PostgreSQL tabela crops + varieties PL)
3. Multi-language UA/DE/CZ (next-intl)
4. Export PDF raporty

### Low Impact × High Effort (unikać w MVP)
1. Full Sentinel-1 radar (C9) — mają tylko Cropin/Taranis, dla MVP nie warto
2. Hyperspectral / Planet Labs direct — drogie i mały value-add nad SatAgro Premium
3. White-label front-end — można zrobić multi-tenant config zamiast full rebrand
4. Blockchain traceability — trend zmarły w 2024

---

## F. Kluczowe decyzje strategiczne wymagające potwierdzenia

1. **Czy PWA wystarczy długoterminowo** czy będziemy robić native iOS/Android? Argument PRO PWA: one codebase, fast updates, no app store hassle. Argument PRO native: kamera, GPS, notyfikacje lepsze, rolnik instaluje z Play Store.

2. **Pricing model** — per-hektar jak SatAgro czy flat jak Climate FieldView? **Sugeruję hybrid:** free do 50 ha, per-hektar 15-25 PLN/ha/rok, flat Farm License powyżej 300 ha. *(Patrz pricing-comparison.md)*

3. **B2C czy B2B2F?** — Sprzedawać bezpośrednio rolnikom, czy przez kooperatywy/doradców? **Sugeruję oba:** direct-to-farm dla MVP, potem B2B2F przez coop/sklepy rolnicze (ProCam, AGROAS, Top Farms) w fazie 2.

4. **Czy tworzyć własny LLM agronomiczny PL?** Koszt: ~50-100k EUR fine-tune + dataset. Alternatywa: RAG na polskich źródłach + Claude/Gemma 4 base. **Sugeruję RAG first, fine-tune w fazie 3 gdy mamy >10k farmerów.**

5. **Carbon credits jako revenue stream?** eAgronom pokazuje że da się — ale wymaga partnerstwa z Verra/Gold Standard. **Sugeruję fazę 3 jako add-on.**

6. **Ukraiński market** — PL-UA agronomia bliska, rolnicy UA w PL, market 30M ha vs PL 15M ha. **Sugeruję fazę 2 z podstawową lokalizacją.**
