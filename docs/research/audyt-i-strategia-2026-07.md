# AgriClaw — audyt funkcji + research świata agtech 2026 + priorytetyzowana strategia

**Data:** 2026-07-07 · **Autor perspektywy:** profesor AI (15 lat) + agronom-praktyk (25 lat)
**Cel:** rozwinąć AgriClaw do najbardziej profesjonalnej wersji pod pilotaż **Beta 100** i wniosek **NCBR AGROSTRATEG** (deadline 28.08.2026).
**Metoda:** (1) deep-research — 5 kątów, 23 źródła, 104 twierdzenia → 15 zweryfikowanych adwersaryjnie 3-0, 1 obalone, 9 prawdopodobnych (weryfikacja urwana na limicie); (2) audyt dojrzałości produkcyjnej wszystkich funkcji w kodzie.

> **Legenda weryfikacji:** ✅ = potwierdzone głosowaniem 3-0 · ⚠︎ = prawdopodobne (źródło primary, weryfikacja nie dokończona) · ✗ = obalone.

---

## 1. Streszczenie wykonawcze (teza)

AgriClaw jest **inżyniersko dojrzały** (audyt bezpieczeństwa, rejestr ŚOR live, agent z tool-callingiem na realnych danych, dyscyplina „wsparcie decyzji, nie polecenie"). Przewagę tracimy nie na kodzie, lecz na **dwóch frontach, które rolnik wyłapie w pierwszym tygodniu**:

1. **Rozjazd obietnica ↔ rzeczywistość.** Flagowa obietnica „agent sam przyśle radę na WhatsApp jutro 5:30" nie jest podłączona (cron tylko kolejkuje Event). Faza rozwoju (BBCH) jest zgadywana z kalendarza, nie z realnej daty siewu. Nie da się poprawić wpisu w księdze ani edytować pola. To są **zabójcy zaufania** — a research jednoznacznie pokazuje, że **zaufanie, nie wiek, decyduje o adopcji**.
2. **Głębokość merytoryczna modeli.** Modele chorób (7 patogenów) nie mają żadnej walidacji polowej — a to jest dokładnie ta luka, którą świat nauki nazywa główną słabością rolniczych DSS i którą AGROSTRATEG może sfinansować jako rdzeń badawczy.

**Wniosek strategiczny:** Beta 100 wygrywa **rzetelnością i wąskim, dowiedzionym klinem** (księga polowa + diagnoza zdjęć + polski rejestr ŚOR — najlepsze w PL), a nie liczbą funkcji. AGROSTRATEG wygrywa **walidacją polową modeli i wyjaśnialnością AI** — bo to udokumentowana luka naukowa, nie marketing.

---

## 2. Baza dowodowa (co mówi świat 2024-2026)

### 2.1 Kto i dlaczego adoptuje (obala mity)

- ✅ **Wiek NIE jest istotnym predyktorem adopcji** (metaanaliza, efekt nieistotny statystycznie). Istotne są **wielkość gospodarstwa (0,497) i wykształcenie (0,510)**. → Beta 100 celuj w większe, lepiej wykształcone gospodarstwa jako early adopters; nie odpuszczaj starszych rolników. [Springer 10.1007/s11119-024-10213-1]
- ✅ **W rozdrobnionej Polsce płd. (n=389) 66% gospodarstw nie używa ŻADNEJ technologii cyfrowej.** Rynek jest niezagospodarowany. [Springer 10.1007/s11119-025-10244-2]
- ✅ **Najczęściej adoptowana kategoria w PL to aplikacje do wykrywania chorób (26%)** — przed DSS (19%), chmurą (8%), sensorami (5%). → **Diagnoza zdjęć to najlepszy klin wejścia w polski rynek.** [tamże]
- ✅ **Bariery PL:** finanse 56%, brak wiedzy 25%, niepewność wymogów UE 25%, słaby internet na polu 18-19%. → niski próg cenowy, prostota, tryb offline/WhatsApp, pomoc w wymogach UE. [tamże]
- ✅ **Bariery UE:** wysoki koszt + niskie kompetencje cyfrowe; ogólne IT jest w użyciu, ale drogie narzędzia specjalistyczne nie. [JRC 2025, JRC141259 — ankieta 1444 rolników z 9 krajów, w tym Polska]
- ✅ **Rolnicy są selektywni w dzieleniu się danymi — z obawy o prywatność, bezpieczeństwo i kontrolę.** → jawna polityka „Twoje dane zostają Twoje" to przewaga, nie formalność. [JRC 2025]
- ✅ **Sceptycyzm wobec niesprawdzonych technologii i preferencja tradycyjnych praktyk** to kluczowa bariera (przegląd 149 badań). → każda rekomendacja musi pokazywać „dlaczego". [Frontiers Sust. Food Systems 2026.1768902]
- ⚠︎ **Brak zaufania do AI zwiększa nie-adopcję ~13,8×; wiek >50 obniża szansę użycia (OR≈0,062) w rozdrobnionych regionach** — zaufanie/wyjaśnialność jako warunek, nie dodatek. *(prawdopodobne; weryfikacja urwana)* [Springer 10.1007/s11119-025-10244-2]

### 2.2 Co rekomenduje nauka o DSS (rdzeń pod AGROSTRATEG)

- ⚠︎ **Rolnicze DSS zwykle nie mają ilościowego dowodu wartości** (zysk / redukcja środowiskowa) i są **walidowane na małej liczbie miejsc i sezonów**, bo testy polowe są drogie. → **luka = szansa: nasz benchmark walidacyjny to publikowalny wkład naukowy.** [Eur. J. Plant Pathology 10.1007/s10658-024-02878-1]
- ⚠︎ **IPM Decisions Platform** waliduje DSS porównując predykcje ryzyka z realnymi obserwacjami presji patogena; **współprojektowana z użytkownikami (3 rundy warsztatów, 12 krajów), doradca = kluczowy kanał.** → wzorzec metodyczny dla WP walidacji. [PMC12605576]
- ⚠︎ **Wyjaśnialność (XAI: LIME/SHAP/Grad-CAM) to warunek wiarygodności AI w rolnictwie.** → warstwa „pokaż dowód" w AgriClaw. [Springer 10.1007/s10462-025-11459-5]
- **Polskie krajowe DSS IPM: eDWIN i OPWS (IPP-NRI)** — publiczne modele ryzyka i ostrzeżenia. → **integrować/benchmarkować, nie wynajdywać koła** (ogromna wiarygodność we wniosku). [ekstrakcja MDPI/źródła PL]
- **CAP 2023-27, Art. 15 Rozp. (UE) 2021/2115** nakłada obowiązek dostępu rolnika do niezależnego doradztwa (w PL: **ODR**). → AgriClaw **podłącza się** do mandatowego kanału doradczego, nie konkuruje z nim. [agriculture.ec.europa.eu/fas]

### 2.3 Konkurencja i nagradzane projekty (benchmark)

- ✅ **xFarm — Farm Management Innovation of the Year 2025**; ✅ **Agrio — Crop Protection Platform of the Year 2025** (diagnoza chorób ze zdjęć). → nasze kierunki (księga + foto-diagnoza) są dokładnie tam, gdzie jury nagradza. [AgTech Breakthrough 2025]
- ✗ **Bayer NIE zdobył „AI AgTech Solution 2025"** (obalone) — nie ma incumbenta-referencji w naszej kategorii asystenta AI; **pole otwarte**.
- **SatAgro (PL) — benchmark cenowy i funkcjonalny:** free Starter (1 pole ≤50 ha), płatne **20/30/40 zł/ha/rok**, „Full Support" 246 zł/pole/rok z konsultacją agronoma; **eksport VRA w 5 formatach (shp, ISOXML/ISOBUS, anl, csv, kml)** — mapa→maszyna, **której AgriClaw nie ma.** [satagro.pl]
- **Luka po konkurencji:** żaden z nich nie łączy **polskojęzycznego agenta konwersacyjnego + live rejestru ŚOR MRiRW + WhatsApp**. To jest nasz unikat.

### 2.4 Monetyzacja PL 2026 (gdzie są pieniądze rolnika)

- **Ekoschemat „Rolnictwo węglowe i zarządzanie składnikami odżywczymi" to największa pula: 2,78 mld zł (64% środków ekoschematów)**; przy starcie 2023 aplikowało **393 651 rolników (~7,65 mln ha, 79,6% wszystkich wniosków ekoschematowych)**; w kampanii 2026 wciąż #1. [MDPI 2071-1050/17/11/5067; ARiMR 2026 via tygodnik-rolniczy]
- → **Największy realny hak monetyzacyjny:** pomoc w praktykach i dokumentacji pod ten ekoschemat (punktacja, plan nawozowy, dziennik). To trafia w 56% barierę „finanse" — pokazujemy rolnikowi **dopłatę, nie koszt**.

---

## 3. Audyt dojrzałości funkcji (skrót — pełny w załączniku audytu)

| Warstwa | Stan | Nota |
|---|---|---|
| Rejestr ŚOR (import + walidacja) | **PRODUKCYJNA** | najmocniejsza; idempotencja, sanity-guardy, status prawny |
| AgroAgent v2 (tool-calling) | **PRODUKCYJNA** | grounding w realnych danych, twardy bezpiecznik ŚOR |
| Sentinel-2 NDVI + maska SCL | **PRODUKCYJNA** | mock jawnie flagowany, wykluczany z trendów |
| Pogoda Open-Meteo, geokod/ULDK, auth, eksport CSV | **PRODUKCYJNA** | — |
| Modele: rekomendacje, woda FAO-56, azot NDRE, BBCH, choroby, przymrozek/upał | **CZĘŚCIOWA** | progi literaturowe, **BBCH z kalendarza (brak daty siewu)**, zero walidacji polowej |
| NDRE/NDWI/SAVI w trybie mock | **CZĘŚCIOWA** | liniowe przeskalowanie mocka NDVI — „liczby wyglądające realnie, a nieprawdziwe" |
| Wilgotność gleby (SMAP) | **DEMO** | `null` — funkcja de facto nie istnieje |
| Proaktywny push WhatsApp (cron/daily) | **DEMO** | tylko kolejkuje Event — realnej wysyłki brak |
| Edycja/usuwanie pola i zabiegu w UI | **DEMO/brak** | API istnieje, UI nie podpięte |
| PDF księgi | **CZĘŚCIOWA** | czcionka PL z runtime-fetch GitHub → ryzyko krzaków w dokumencie do kontroli |

---

## 4. Priorytetyzowana mapa działań

Zasada: **najpierw usuń zabójców zaufania (tanie, wysokiej wagi), potem pogłęb klin, na końcu buduj rdzeń badawczy do wniosku.**

### P0 — Quick wins na Beta 100 (dni–2 tygodnie, wysoka waga/zaufanie)

| # | Działanie | Dlaczego (dowód) | Koszt |
|---|---|---|---|
| P0-1 | **Podłączyć realną wysyłkę WhatsApp w `cron/daily`** albo zdjąć obietnicę z landingu do czasu podłączenia | rozjazd obietnica↔produkt = największa szkoda dla zaufania; push to sedno „cyfrowego agronoma" | S |
| P0-2 | **Pole „data siewu" + użycie w BBCH** (zamiast `NULL::sowing_date`) | BBCH kaskaduje na przymrozki/upał/azot/choroby; praktyk natychmiast widzi „liść flagowy" w krzewieniu | M |
| P0-3 | **Edycja/usuwanie zabiegu w UI** (API `PATCH`/`DELETE` już jest) | księga idzie do kontroli IJHARS/ARiMR; brak korekty literówki podważa „e-rejestr" | S |
| P0-4 | **Edycja pola w UI** (nazwa/uprawa; reshape geometrii osobno) | rolnik, który pomylił uprawę/obrys, utyka | S |
| P0-5 | **Zbundlować czcionkę PL do PDF** (koniec runtime-fetch z GitHub) | dokument kontrolny bez polskich znaków = kompromitacja | S |
| P0-6 | **Nie pokazywać NDRE/NDWI/SAVI gdy to przeskalowany mock** (badge „dane demo/niedostępne") | „liczby nieprawdziwe" niszczą zaufanie praktyka z instynktem | S |
| P0-7 | **Web-push (VAPID) jako druga ścieżka powiadomień** | bez pushu produkt jest reaktywny; 18-19% ma słaby internet — push lekki działa tam, gdzie mapa nie | M |

### P1 — Wyróżniki na Beta 100 (2–6 tygodni, budują klin i ROI)

| # | Działanie | Dlaczego (dowód) |
|---|---|---|
| P1-1 | **Warstwa „dlaczego" pod każdą rekomendacją** (które dane, jaki próg, link do źródła/etykiety) | wyjaśnialność = warunek adopcji; sceptycyzm wobec „czarnej skrzynki" |
| P1-2 | **Moduł ekoschematu węglowego** (checklista praktyk + wkład do dziennika + szacunek dopłaty) | 2,78 mld zł puli, #1 wybór 2026; pokazujemy dopłatę, nie koszt — bije barierę „finanse 56%" |
| P1-3 | **Eksport VRA (min. ISOXML + shp)** map dawkowania azotu | SatAgro to ma, my nie; domyka pętlę „zalecenie→maszyna" |
| P1-4 | **Scouting do realnego storage (Vercel Blob) + eksport** | base64 w DB nie skaluje; scouting to dowód w terenie |
| P1-5 | **Onboarding „1 pole w 3 min"** + jawna nota prywatności danych | koszt/kompetencje/prywatność to top bariery; niski próg = adopcja |

### P2 — Rdzeń strategiczny (AGROSTRATEG, WP badawcze)

| # | Filar | Dlaczego to jest fundowalne |
|---|---|---|
| P2-1 | **Walidacja polowa modeli chorób** na gospodarstwach Beta 100 (predykcja vs realna presja, wzorzec IPM Decisions) | nauka mówi wprost: DSS nie mają dowodu wartości i są słabo walidowane — nasz benchmark to publikowalny wkład |
| P2-2 | **Benchmark halucynacji agronomicznych PL** (agent + RAG na ŚOR/etykietach) | brak takiego benchmarku dla polskiego rolnictwa; mierzalny cel <2% |
| P2-3 | **Integracja z ODR / eDWIN / OPWS** | CAP Art. 15 mandat doradczy; doradca = kluczowy kanał adopcji; nie konkurujemy z krajowym IPM, wzmacniamy go |
| P2-4 | **Wyjaśnialność (XAI) diagnoz i alertów** | wyjaśnialność jako warunek wiarygodności AI w rolnictwie |
| P2-5 | **Retrospektywna walidacja modeli chorób 10 lat** (Sentinel+meteo+BBCH, AUC>0,8) | konkretny, weryfikowalny wskaźnik do wniosku |

### Czego NIE budować teraz (dyscyplina skupienia)

- Autonomiczny agent na własnym VM (OpenClaw) — poza rdzeniem wartości rolnika, ciężki operacyjnie; zostaje jako opcja.
- Pełne przetwarzanie SMAP HDF5 — wysoki koszt, niska wartość względem NDWI/pogody; lepiej uczciwie oznaczyć jako niedostępne.
- Własne stacje IoT/sprzęt — bariera kosztu (56%) i sprzeczność z „bez sprzętu, niski próg".

---

## 5. Rekomendowana kolejność (następne 6 tygodni)

1. **Tydzień 1:** P0-3, P0-4, P0-5, P0-6 (cztery szybkie naprawy zaufania; wszystkie self-contained, API gotowe).
2. **Tydzień 2:** P0-2 (data siewu → BBCH) + P0-1 (WhatsApp push albo uczciwe zdjęcie obietnicy).
3. **Tydzień 3-4:** P1-1 (warstwa „dlaczego") + P0-7 (web-push).
4. **Tydzień 5-6:** P1-2 (ekoschemat węglowy) — najmocniejszy hak ROI pod rekrutację Beta 100.
5. **Równolegle do wniosku (do 28.08):** P2-1/P2-3 jako WP walidacji z konsorcjum (IUNG/SGGW + ODR), P2-2 benchmark halucynacji.

---

## 6. Źródła (primary, o ile nie zaznaczono)

- JRC 2025, *State of digitalisation in EU agriculture* (1444 rolników, w tym PL) — publications.jrc.ec.europa.eu/repository/handle/JRC141259
- Metaanaliza adopcji PA — Springer 10.1007/s11119-024-10213-1
- Adopcja w rozdrobnionej Polsce (n=389) — Springer 10.1007/s11119-025-10244-2
- Bariery ML-DSS, 312 rolników — Wiley 10.1002/agj2.21358
- Przegląd 149 badań adopcji — Frontiers 10.3389/fsufs.2026.1768902
- Wartość i walidacja DSS (⚠︎) — Springer 10.1007/s10658-024-02878-1
- IPM Decisions Platform (⚠︎) — PMC12605576
- XAI w rolnictwie (⚠︎) — Springer 10.1007/s10462-025-11459-5
- AgTech Breakthrough Awards 2025 — agtechbreakthrough.com/2025-winners
- SatAgro — satagro.pl (cennik, terminale/VRA)
- Ekoschemat węglowy PL — MDPI 2071-1050/17/11/5067; ARiMR 2026 (tygodnik-rolniczy)
- CAP Art. 15 / FAS — agriculture.ec.europa.eu/farming/fas_en

*Twierdzenia ⚠︎ pochodzą ze źródeł recenzowanych (primary), ale ich adwersaryjna weryfikacja została przerwana limitem sesji — przed cytowaniem we wniosku potwierdzić pojedynczym sprawdzeniem.*
