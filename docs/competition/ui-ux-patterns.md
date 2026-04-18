# UI/UX Patterns — Precision Agriculture Platforms (April 2026)

**Cel:** Opisać co każda platforma robi DOBRZE, co ŹLE, i co AgriClaw powinien skopiować / unikać.

**Metodologia:** Analiza landing pages, app store screenshoty, user guide docs, blog posts, review sites.

---

## 1. John Deere Operations Center

### Mocne strony (do skopiowania)
- **Real-time machine tracking — telemetry co 5 sekund** na mapie. To wizualne potwierdzenie, że "mój system działa" jest potężne. Mapa zawsze LIVE.
- **Field Analyzer** — layers on-top na jednej mapie (seeding speed, yield, moisture, application) z side-by-side comparison — świetnie dla analysis
- **Color-code fields by planned crop** — jeden rzut oka na cały obszar i wiesz gdzie co rośnie
- **Active boundaries** wizualizowane podczas pracy — operator widzi on-map gdzie już przejechał
- **Push notifications o machine security** + custom alerts — notification design jest konkretny

### Słabe strony (do uniknięcia)
- **Bardzo zorientowane na maszyny** — chłopski rolnik bez JD sprzętu czuje się odcięty
- **Multi-platform chaos**: desktop site, Ops Center Mobile, Connect Mobile, MyOperations, PRO Service — 4-5 aplikacji dla jednego gospodarstwa
- **Brak kontekstu agronomicznego** — wszystko jest o "co się dzieje z maszyną", mało o "co się dzieje z plantem"
- **Krzywa nauki brutalna** — ankietowani rolnicy narzekają że wymaga dealer support

### Co kopiować dla AgriClaw
- Live map telemetry concept (ale dla NDVI updates + agent events)
- Field-level color-coding by crop
- On-map progress visualization (przy rysowaniu pól i zadań)

---

## 2. Climate FieldView (Bayer)

### Mocne strony (do skopiowania)
- **"Your Farm at a Glance"** — 2025 nowa feature, pokazuje overview: harvest progress, top performing hybrids, top/bottom pola. Summary-first UX
- **Scouting pins z photos + color-coded issues** — prosty workflow mobile: drop pin → type issue → attach photo → tag coordinates
- **Side-by-side layer comparison** na mapie — podobnie jak JD
- **SplitView** — porównanie dwóch map (przed/po, NDVI vs yield) w jednym ekranie
- **3-step navigation** — Fields → Map → Analysis. Czyste, nie ma 20 menu
- **Dashboard "Field Health" card** na overview — kluczowa metryka najbardziej widoczna
- **True-color + scouting + vegetation tabs** — jasne że to różne views tego samego pola

### Słabe strony (do uniknięcia)
- **Tylko 2 tiery** — Basic vs Plus. Wiele funkcji zamkniętych za flat $649, nie ma stopnia środkowego
- **Brak prawdziwego offline** na telefonie (cab app tylko dla in-cab)
- **Ekosystem zamknięty** — Climate FieldView Drive wymaga hardware
- **Scouting pins trzeba dropować ręcznie** — brak auto-detekcji anomalii z satelity

### Co kopiować dla AgriClaw
- **"Your Farm at a Glance"** dashboard pattern — AgriClaw ma podobny w `DashboardHomeClient.tsx`, ale rozważ summary-first
- **Scouting pin workflow** — copy 1:1: pin → type → photo → issue tag → color
- **Tabs: Satellite | True-color | Scouting | Weather** na widoku pola

---

## 3. EOSDA Crop Monitoring

### Mocne strony (do skopiowania)
- **10 indeksów w jednym UI** (NDVI, NDRE, MSAVI, NDMI, RECI, Vegetation Meta Index, etc) — switcher po górze
- **Cursor hover pokazuje wartość indeksu na każdym pikselu** — data-rich interaction
- **Split screen compare** z individual timelines — porównaj to samo pole 15 maja 2024 vs 15 maja 2025
- **Field Leaderboard** — sortowanie pól by metric (NDVI, ryzyko, % wzrostu) — jak "Top songs"
- **Risk maps overlay** — disease risk, weather risk, index-change risk jako sub-layers
- **14-day yield prediction** widget na dashboard
- **Mobile app offline-first** — działa w polu bez sieci
- **Photo geo** — 2025 feature, upload photo z GPS → attach do scouting point
- **Task Assignment** UI — przypisz zadanie pracownikowi na konkretnym polu
- **Unlimited team accounts** — co-working standard, nie tylko owner

### Słabe strony (do uniknięcia)
- **Feature overwhelm** — 10 indeksów to fajnie dla agronoma, strasznie dla rolnika. Trzeba defaultów
- **Pricing nie jest transparentne** — Essential/Professional wymaga sales contact mimo publicznego planu
- **Interface wygląda trochę jak GIS z lat 2015** — funkcjonalny, ale nie piękny (brak whitespace, gęsty)
- **Onboarding długa** — nowy user musi nauczyć się BBCH, MSAVI, NDMI zanim coś użyje

### Co kopiować dla AgriClaw
- **Indeks switcher** (AgriClaw już ma 4: NDVI/NDRE/NDWI/SAVI — dobrze!) — dodaj clear labels "zdrowie roślin" / "azot" / "woda" / "gleba" zamiast akronimów
- **Cursor hover value** na mapie — bardzo użyteczne
- **Split screen compare** — flagship feature
- **Photo geo scouting** — AgriClaw nie ma, must-have

---

## 4. OneSoil

### Mocne strony (do skopiowania — NAJLEPSZY UX mobile)
- **Auto-detect pól z satelity w 57 krajach** — user nie rysuje, app mu pokazuje wszystkie pola w okolicy i wybiera klikami. **Killer UX**
- **"Contrasted NDVI" layer** — bright, contrasting colors, readable na słońcu smartphone screen
- **Zero ads, zero friction free** — mocne statement
- **Growing Degree Days chart** — wykres od siewu, intuicyjny agronomicznie
- **Accumulated precipitation** chart — suma opadów od startu sezonu
- **Scouting = note + photo + coords** offline
- **NDVI color gradient jest delikatny** — nie tylko czerwony/zielony skrajnie, ma stopnie
- **Ujednolicone Pro i Free w jednej app** — user nie czuje "porzucenia"

### Słabe strony (do uniknięcia)
- **Brak prawdziwych alertów chorób** — tylko NDVI-based, nie model
- **Brak WhatsApp / voice** — notifications tylko push
- **Beta / startup feel** — funkcje czasem znikają, firma raised ale nie ma transparentnego roadmapa
- **Brak disease prediction model** — rolnik musi sam zgadnąć z mapy

### Co kopiować dla AgriClaw (NAJWIĘCEJ inspiracji mobile UX)
- **Auto-detect pól** — to `agri-fields` mogłoby propose pola z satelity jako onboarding hook
- **Contrasted NDVI** — skopiuj layer style literally
- **Delikatny gradient NDVI** — AgriClaw ma już 7-stopniowy w `ndviColorHex` (red→green), potwierdzam że jest OK, może dodać contrasted mode jako toggle
- **Free-tier feel** — nie blokuj, nie pushuj upgrade inaczej niż przez soft "unlock more ha"
- **Offline scouting z photo+GPS** — must-have

---

## 5. Taranis

### Mocne strony (do skopiowania)
- **Ag Assistant™ czyli gen-AI agronomist** — wpiszesz pytanie, dostajesz structured raport z reco. **AgriClaw ma dokładnie to — OpenClaw agent**. Inspiracja w prompt engineeringu.
- **Leaf-level zdjęcie z drona na smartphone** — user widzi liść pojedynczy, z AI adnotacjami (wymagany insect, choroba)
- **Report layouts po misji scoutingu** — strukturyzowane: co wykryliśmy, na ilu akrach, rekomendacja, research citations
- **"Every Acre Tells a Story"** narracyjny branding — każde pole jest traktowane jako indywidualny klient
- **Advisor tier z white-label** — dealer/dystrybutor może brandować — wielki ROI dla B2B

### Słabe strony (do uniknięcia)
- **Drone-heavy** — wymaga organization drone missions, nie dla średniego rolnika
- **Enterprise-only pricing** — $15/acre ogromnie jak dla małego
- **Mobile app UI jest średni** — agronomist-focused dashboards trudno do czytania przez rolnika w polu
- **Brak Polskiego, brak WhatsApp, brak voice chat native (tylko Ag Assistant audio)** — głównie US/LATAM market

### Co kopiować dla AgriClaw
- **Ag Assistant report format** — AgriClaw's agent odpowiedzi powinny mieć strukturę: Status → Problem → Reco → Timing → Context. Obecny prompt już prowadzi w tym kierunku
- **"Every field tells a story"** narracja — per-field insights z historią
- **Advisor / dealer tier** — B2B white-label dla doradców/sklepów rolniczych to wielki revenue potential

---

## 6. xarvio FIELD MANAGER (BASF)

### Mocne strony (do skopiowania)
- **Spray Timer** — unikalny widget "jest okno spray do X godziny, potem wiatr za mocny" — hourly weather + disease model + BBCH stage w jednej rekomendacji
- **Color-coded risk status**: red=high disease, violet=treated recently, white=treatment sub-optimal. **Natychmiastowe zrozumienie** bez wykresów
- **BBCH stage tracking natywne** — rolnicy używają BBCH codziennie, tu jest first-class citizen
- **Weekly biomass maps auto** — nie trzeba klikać, każdy tydzień nowa mapa
- **Disease-specific models**: Septoria, Fusarium, rdza, mączniak — nie ogólne NDVI alerts, konkretna choroba
- **VRA maps z jednego przycisku** "Generate" → gotowa mapa aplikacyjna fungicydu

### Słabe strony (do uniknięcia)
- **Dashboard gęsty** — wiele metryk, wykresy, BBCH, pogoda, risk — overwhelm
- **Bardzo BASF-centric** — sugestie produktów często wskazują na BASF fungicydy (konflikt interesów dla rolnika)
- **Mobile app ma reputację crashów** (wg recenzji 2023-2024)
- **Dostępne tylko w wybranych krajach** — Polska Yes, ale limited

### Co kopiować dla AgriClaw
- **Spray Timer** — TO JEST GEM. AgriClaw ma Open-Meteo hourly data — można zbudować spray window widget (wiatr + opad + ET0 + RH) **to low-hanging fruit feature**
- **Color-coded field risk status** (red/violet/white/green) — prosty wizualny cue zamiast liczb
- **Disease-specific alerts** — zamiast "NDVI spadł", rozróżnij "podejrzenie Septorii" vs "podejrzenie suszy" — AgriClaw już to robi w recommendations.ts częściowo, można rozbudować per-crop models
- **BBCH stage w UI** — przy każdym polu current BBCH + prognoza następnego

---

## 7. SatAgro (Polska)

### Mocne strony (do skopiowania, bo to twoja bezpośrednia konkurencja!)
- **Polski native UI, polska terminologia** — "ksiązka polowa", "zabiegi", "GAEC" nie kalki z angielskiego
- **Eksport map aplikacyjnych ISOXML** dla maszyn CLAAS, JD, Amazone w kilku krokach — flagship
- **Integracja z IMGW** + własna baza stacji meteo + Open-Meteo — najdokładniejsza pogoda w PL
- **Ekoschematy / GAEC / rolnictwo węglowe** (Expert tier) — zgodne z ARiMR — rolnicy PL SZCZEGÓLNIE tego potrzebują
- **Mapowanie rentowności** (Expert) — koszt × plon per strefa pola — KILLER FEATURE dla finansowego rolnika
- **Multi-year contracts z gwarancją ceny 3-5 lat** — rolnik nienawidzi niepewności cen
- **Full Support package (246 PLN/pole)** — agronom tworzy mapy za rolnika — dla tych którzy nie chcą sami

### Słabe strony (do uniknięcia)
- **UI wygląda bardzo 2019 — bootstrap-style, gęsty, niewiele whitespace** — design nie aspiracyjny, nie "premium"
- **Brak AI chatu / agenta** — statyczne dashboardy
- **Brak WhatsApp notyfikacji** — tylko e-mail + push
- **Brak native voice interface**
- **Mobile app działa, ale nie jest wow** — web-first firm
- **Brak marketplace** — sprzedaż plonów / kontraktacja
- **Freemium 50 ha jest zbyt mały** — rolnik 100-ha już musi płacić

### Co AgriClaw może zrobić LEPIEJ (bezpośrednia konkurencja)
1. **AI agent z WhatsApp** to SatAgro nie ma — MEGA differentiation
2. **Piękniejszy UI** (Tailwind + shadcn + Framer Motion już w stacku)
3. **Free tier szerszy** (do 100 ha zamiast 50)
4. **Voice + WhatsApp** dla rolników 60+ którzy nie lubią apek
5. **Per-farm flat price option** (jak FieldView Plus) jako alternatywa do per-hektar

### Co skopiować
- **Mapowanie rentowności** w Expert — AgriClaw nie ma, ale schema jest ready (NdviReading, SoilMoistureReading). Dodać **CostEntry** + **YieldEntry** tabele
- **GAEC / ekoschematy compliance** — rolnik PL bez tego nie dostanie dopłat
- **Multi-year contracts z gwarancją ceny** — retention play

---

## 8. AGRIVI

### Mocne strony (do skopiowania)
- **Pełne ERP w jednej platformie** — finanse, HR, inventory, sales, compliance — jak SAP dla farmera
- **Map-based view** — wszystko na mapie z layers (pogoda, pest risk, crop health)
- **Full John Deere integration** — usage, cost, reservations, alarms, comments in-line
- **ISO 9001 / GlobalGAP / HACCP native** — nie dodatki, pełnoprawne
- **Traceability end-to-end** — compliance wbudowane
- **Dostępność offline + mobile**
- **150 countries, multi-language** — może rolnik w Polsce widzieć UI PL

### Słabe strony (do uniknięcia)
- **Za duże dla małego rolnika** — recenzje: "Nie dla małych gospodarstw". Feature overload
- **Pricing nie publikowane** — frustracja user-ów, muszą rozmawiać z sales
- **Brak AI chatu / agenta**
- **Brak carbon credits natywnie**
- **UI dashboards są dense** — wielko-korporacyjny feel

### Co kopiować dla AgriClaw (ale bez przesady)
- **Map-as-dashboard** concept — everything na mapie jako layers
- **Compliance modules** jako add-ons (GlobalGAP, HACCP jeśli AgriClaw pójdzie w coop/enterprise)
- **John Deere / CLAAS integracje** — docelowo

---

## 9. eAgronom

### Mocne strony (do skopiowania — znowu, bliski konkurent CEE)
- **Polski native UI** — Konkurencja direct z SatAgro i AgriClaw dla PL
- **Księga polowa + PPP + nawożenie flagship** — natywnie dla EU compliance
- **Carbon Program Verra-registered** — pionier w EU dla EE/LV/LT/PL (VM0042 methodology)
- **"eAgronom bierze % carbon credits"** — alternatywny model pricing — zero upfront dla rolnika
- **Integracja z telematyką maszyn** — JDLink + CLAAS + others
- **Raporty dla urzędów PL** — ARiMR, IRZplus
- **Multi-country (14 krajów) z lokalizacjami**
- **3,000+ gospodarstw** = validation market fit

### Słabe strony (do uniknięcia)
- **UI to tabele, forms, tabele, forms** — bardzo administracyjny, dla urzędnika, nie dla terenowego rolnika
- **Brak AI chatu** (ostrzeżenie — eAgronom może to dodać szybko)
- **Brak satelity natywnie** — skupienie na compliance + carbon, satellite tylko w integracjach
- **Mobile app jest wtórny** — web-first
- **Brak WhatsApp / voice**

### Co kopiować dla AgriClaw (różnicowanie)
- **PPP rejestr wzorowany na eAgronom** — PostgreSQL schema, categories, dawka/ha, data/ godzina, BBCH
- **Plan nawożenia NPK auto** — oblicz potrzeby z NDRE + soil + target yield
- **Carbon Program jako add-on** — AgriClaw może partnerować z Verra albo eAgronom jako white-label
- **Raporty dla ARiMR** — export PDF w ich formacie
- **Alternative pricing model** — % carbon credits jeśli user opts in
- **AgriClaw przewaga**: satellite+AI chat + mobile-first vs eAgronom admin-focus

---

## 10. CropIn

### Mocne strony (do skopiowania)
- **Crop Knowledge Graph** — 500 crops + 10k varieties + diseases per-variety. **Niesamowita baza wiedzy**
- **22+ Deep Learning models** — yield prediction, disease detection, irrigation scheduling
- **29+ languages** — Hindi, Swahili, Bahasa, Mandarin — real-world reach
- **Cropin Connect** — multilingual chat adapter dla farmers (precursor AgriClaw WhatsApp agent)
- **Cropin Trace** — farm-to-fork z QR codes — B2B2F (Business-to-Business-to-Farmer) model
- **GlobalGAP + compliance** native
- **Deployed na 16M+ akry** via agribusinesses (b2b2f)

### Słabe strony (do uniknięcia)
- **Enterprise-only** — rolnik-indywidualista nie kupi bezpośrednio
- **UI varies** — różne aplikacje wyglądają jak stworzone przez różne zespoły
- **Specifics płatne** — cena/features niepublikowane
- **Brak strong focus na EU/Polska** — głównie Azja, Afryka

### Co kopiować dla AgriClaw
- **Crop Knowledge Graph** (w mniejszej skali) — zbuduj PostgreSQL tabelę `crops` z variety + typical BBCH + typical diseases + nutrient requirements
- **Multi-language z day 1** — AgriClaw PL-first, ale zaraz dodać UA, DE, CZ
- **B2B2F model** — sprzedawaj przez kooperatywy rolnicze (Mlekovita, Krajowa Grupa Spożywcza) + sklepy rolnicze (ProCam, AGROAS)
- **Yield prediction DL model** — trenuj na Sentinel-2 + weather + historical yields dla PL cropów

---

## Cross-platform patterns (top reusable ideas)

### Pattern 1: "Map as canvas"
Wszystkie (oprócz eAgronom) mają mapę jako dominujący interface. Layer toggles po prawej, legend po lewej, timeline u dołu. **AgriClaw ma już MapLibre GL + Turf — dobrze startujemy.**

### Pattern 2: "Pin-based scouting"
Drop pin → note + photo + coords + issue tag. Standard across Climate, EOS, OneSoil, xarvio, SatAgro. **AgriClaw nie ma — must add**.

### Pattern 3: "Dashboard-first overview"
Climate's "Your Farm at a Glance", JD's "what's happening now", EOS's widgets — summary → deep dive. **AgriClaw `DashboardHomeClient` już ma tę strukturę.**

### Pattern 4: "Color-coded severity"
Red/Orange/Yellow/Green dla NDVI i risk. xarvio idzie dalej z `violet=treated`. **AgriClaw `ndviColorHex` już to implementuje.**

### Pattern 5: "Historical comparison"
SplitView, side-by-side, dziś vs rok temu. **AgriClaw nie ma — must add w fazie 2.**

### Pattern 6: "Field Leaderboard"
Ranking pól by NDVI, yield, ryzyko. EOS to flagship. **AgriClaw może szybko zaimplementować — już ma dane.**

### Pattern 7: "AI assistant as sidekick"
Taranis Ag Assistant, Cropin Connect chat. **AgriClaw ma OpenClaw agent — unique w Polsce.**

---

## UX Mistakes to AVOID (obserwowane w konkurencji)

1. **Feature overload bez defaultów** (EOS, AGRIVI) — rolnik nie wie co kliknąć. Rozwiązanie: AgriClaw ma tylko kilka sensownych domyślnych widoków, opcje advanced schowane.
2. **Multi-app splintering** (John Deere ma 5 aplikacji) — AgriClaw: jeden PWA, jedna mobile, jeden dashboard web.
3. **Hardware lock-in** (Climate FieldView Drive) — AgriClaw: żadnego hardware, żadnych lock-ins.
4. **Pricing opacity** (AGRIVI, CropIn, eAgronom) — AgriClaw: **transparent pricing na landing page** od dnia 1.
5. **Dense dashboards dla agronomów** (xarvio, EOS) — AgriClaw: rolnik-first UX, not expert-first.
6. **Dashboard w stylu Excel/admin** (eAgronom) — AgriClaw: MapLibre + Tailwind + Framer Motion = premium feel.
7. **Nudne notyfikacje** (JD, FV) — wszystkie proste "field needs attention". AgriClaw: **agent w formie konkretnego komunikatu** typu "pole X, jutro 5:30 oprysk. Potem wiatr za mocny."

---

## Co AgriClaw JUŻ ROBI DOBRZE (vs competition)

1. **AI agent per-farmer (OpenClaw)** — UNIKALNE. Nikt inny nie ma dedicated VM per-rolnik z custom agent.
2. **Multi-index single Sentinel-2 request** (NDVI+NDRE+NDWI+SAVI w 1 API call) — efektywne, unikalnie zaimplementowane (patrz `copernicus.ts` `MULTI_INDEX_EVALSCRIPT`)
3. **Polish-native UI** — razem z SatAgro + eAgronom to jedyne 3 platformy native-PL
4. **WhatsApp-first design** (planowane) — żaden inny nie ma. Plantix jest free-and-lightweight ale to diagnoza, nie FMS
5. **PWA** — nie wymaga App Store / Play Store, daily update, lightweight
6. **OpenClaw gateway architecture** — każdy agent = własne narzędzia (agri-fields, agri-satellite, agri-weather, agri-notify). Extensible design
7. **Open-Meteo + SMAP + Copernicus stack** — darmowe/tanie źródła danych, skalowalne bez rent-seekers

## Co AgriClaw MUSI DORABIAĆ (top priorities z UX standpoint)

1. **Scouting pins** — to jest MUST have dla każdego field app w 2026
2. **Historia pola / season comparison** — splitview / timeline
3. **Field Leaderboard** — ranking pól
4. **Spray Timer widget** — unique differentiator from SatAgro
5. **PPP / ksiązka polowa** — EU compliance must-have
6. **Mobile offline** — PWA stub jest, ale trzeba real offline IndexedDB persistence
7. **Photo scouting** — upload photo → AI disease detection
8. **Mapy aplikacyjne ISOXML export** — dla rolników z maszynami
