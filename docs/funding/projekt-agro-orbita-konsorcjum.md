# AGRO-ORBITA — projekt i plan dla konsorcjum badawczo-wdrożeniowego

**Program docelowy:** NCBR AGROSTRATEG, obszar **T3 „Rolnictwo cyfrowe"** (nabór do 28.08.2026; kolejne edycje coroczne)
**Lider:** AgriClaw sp. z o.o. (przedsiębiorca; spółka w rejestracji)
**Partnerzy (do domknięcia):** instytut badawczy · uczelnia (AI/NLP) · wojewódzki ODR
**Skala:** ok. 9–10 mln zł / 36 miesięcy · TRL wejściowy 6 → wyjściowy 9
**Charakter dokumentu:** koncepcja + plan do rozmów konsorcjalnych i jako szkielet wniosku LSI

---

## 0. Po co ten dokument

Analiza finansowania (`docs/funding/alternatywy-finansowania-2026.md`, deep-research 22 tezy potwierdzone 3-0) wykazała: **AGROSTRATEG ma sens dla AgriClaw wyłącznie w wariancie konsorcjalnym z partnerem naukowym.** Formalnie moglibyśmy startować solo, ale program wymaga realnych **eksperymentalnych prac rozwojowych**, min. 1 mln zł i punktuje doskonałość naukową — czego pojedynczy startup nie udźwignie. Ten dokument opisuje projekt tak, by (a) zainteresować partnerów naukowych, (b) jasno rozdzielić role i budżet, (c) posłużyć jako baza wniosku.

Równolegle (ścieżka bezzwrotna, solo, otwarta teraz) rekomendujemy **CASSINI Business Accelerator** (€75k, dane Copernicus) — nie koliduje z AGROSTRATEG i finansuje rozwój produktu, podczas gdy AGROSTRATEG finansuje część badawczą.

---

## 1. Streszczenie projektu

**AGRO-ORBITA: cyfrowy agronom AI dla gospodarstw 10–200 ha — integracja teledetekcji Sentinel-1/2 z konwersacyjną, wyjaśnialną sztuczną inteligencją w języku polskim, walidowana polowo na 100 gospodarstwach.**

Projekt odpowiada na udokumentowaną barierę cyfryzacji polskiego rolnictwa: w rozdrobnionych regionach **66% gospodarstw nie używa żadnej technologii cyfrowej**, a główne bariery to koszt, brak kompetencji i **brak zaufania do niesprawdzonych narzędzi** (badania adopcji 2024–2026, m.in. JRC 2025 i przegląd 149 badań — sekcja 8). Istniejące narzędzia teledetekcyjne wymagają wiedzy eksperckiej i penetracja w gospodarstwach 10–200 ha pozostaje marginalna.

Konsorcjum opracuje i **zwaliduje polowo** platformę, która **odwraca paradygmat interfejsu**: zamiast panelu z mapami rolnik dostaje konkretne, wyjaśnione zalecenie po polsku przez komunikator (WhatsApp), generowane przez agenta AI łączącego (a) teledetekcję Sentinel-1/2 z maskowaniem chmur, (b) modele agronomiczne kalibrowane do PL (BBCH/GDD, bilans wodny FAO-56, presja chorób, plan azotowy zgodny z Programem azotanowym), (c) duży model językowy ugruntowany w danych gospodarstwa i **krajowym rejestrze ŚOR MRiRW**.

Rdzeń badawczy — i to jest część fundowalna przez AGROSTRATEG — to trzy elementy, których w Polsce nie ma: **(1)** pierwszy otwarty **benchmark halucynacji agronomicznych PL (AgroHalu-PL)**, **(2)** modele predykcji chorób **walidowane polowo** (nie tylko literaturowo — nauka o DSS wskazuje słabość walidacji jako główną lukę), **(3)** warstwa **wyjaśnialności (XAI)** rekomendacji jako warunek zaufania. Wyjście: komercyjna usługa <150 zł/mies. i ścieżka 3 000 gospodarstw w 3 lata.

---

## 2. Problem i dowody potrzeby (dlaczego to jest badawczo istotne)

| Teza (zweryfikowana w badaniach adopcji) | Konsekwencja dla projektu |
|---|---|
| 66% gospodarstw w rozdrobnionej PL bez żadnej technologii cyfrowej | ogromny, niezagospodarowany rynek; potrzeba niskiego progu i prostoty |
| Najczęściej adoptowana kategoria = wykrywanie chorób ze zdjęć (26%) | diagnoza + predykcja chorób to właściwy klin wejścia |
| Zaufanie i wyjaśnialność, nie wiek, decydują o adopcji | XAI i „wsparcie decyzji, nie polecenie" jako rdzeń, nie dodatek |
| Rolnicze DSS słabo walidowane polowo (mało miejsc/sezonów) | walidacja na 100 gospodarstwach = publikowalny wkład naukowy |
| Doradztwo (ODR) to kluczowy facylitator adopcji; CAP Art. 15 nakłada mandat doradczy | ODR w konsorcjum + integracja z krajowym IPM (eDWIN/OPWS) |

Pełne cytaty i źródła: sekcja 8 oraz `docs/research/audyt-i-strategia-2026-07.md`.

---

## 3. Cele i innowacja

**Cel główny:** podnieść działający prototyp (TRL 6) do wdrożonej, zwalidowanej polowo usługi (TRL 9), rozwiązując trzy problemy badawcze, które blokują zaufanie do AI w agronomii.

**Cele szczegółowe / nowość naukowa:**
1. **Agent odporny na halucynacje (WP2).** Pierwszy otwarty benchmark „AgroHalu-PL" mierzący błędy merytoryczne agenta w polskiej agronomii; cel operacyjny <2% halucynacji na benchmarku. Ugruntowanie w rejestrze ŚOR + etykietach jako jedyne źródło zaleceń środków.
2. **Predykcja chorób kalibrowana i walidowana do PL (WP3).** Modele septorioza/fuzarioza/zaraza na fuzji Sentinel + meteo + BBCH; walidacja retrospektywna (10 lat) i prospektywna (pilotaż), cel AUC > 0,8, porównanie z krajowym IPM (eDWIN/OPWS).
3. **Wyjaśnialność rekomendacji (przekrojowo).** Każde zalecenie pokazuje „dlaczego" (które dane, jaki próg, odesłanie do etykiety/źródła) — mierzony wpływ na zaufanie i adopcję w walidacji polowej.

**Czym AGRO-ORBITA nie jest:** to nie „kolejny dashboard NDVI". Różnica: interfejs konwersacyjny po polsku + twarda zgodność prawna (rejestr ŚOR w pętli) + walidacja polowa z grupą kontrolną. Analiza konkurencji (SatAgro, OneSoil, xarvio, Climate FieldView, eAgronom) potwierdza: żaden nie łączy polskojęzycznego agenta AI z live rejestrem ŚOR i kanałem WhatsApp.

---

## 4. Pakiety robocze (WBS)

| WP | Nazwa | Lider | Mies. | Typ prac | Kluczowe zadania | Główne rezultaty |
|---|---|---|---|---|---|---|
| **WP1** | Zarządzanie, etyka danych, AI Act | AgriClaw | 1–36 | — | PM, RODO/AI Act, plan zarządzania danymi, otwartość rezultatów | plan zarządzania, raporty okresowe |
| **WP2** | **Agent agronomiczny PL odporny na halucynacje** | Uczelnia (AI/NLP) | 1–18 | badania przemysłowe | korpus agro-PL; RAG na rejestrze ŚOR + etykietach; **benchmark AgroHalu-PL**; guardraile dawek; ewaluacja | benchmark otwarty, agent v2 (<2% halucynacji), 2 publikacje |
| **WP3** | **Predykcja chorób i stresów kalibrowana do PL** | Instytut badawczy | 4–24 | badania przemysłowe | modele chorób na Sentinel+meteo+BBCH; walidacja retrospektywna 10 lat; kalibracja progów PL; porównanie z eDWIN/OPWS | 2 modele (AUC>0,8), raport walidacyjny, publikacja |
| **WP4** | Integracja, wyjaśnialność, skalowanie | AgriClaw | 6–30 | prace rozwojowe | warstwa XAI „dlaczego"; VRA/ISOXML do maszyn; PWA offline; multi-farm dla doradców; cache EO; koszt <2 zł/gosp./mies. | platforma TRL8, eksport ISOXML, tryb doradcy |
| **WP5** | **Walidacja polowa: 100 gospodarstw / 2 sezony** | ODR | 12–36 | prace rozwojowe | rekrutacja; **protokół z grupą kontrolną**; pomiar plonu, zużycia N/ŚOR, decyzji, NPS; szkolenie doradców | raport walidacji (efekt vs kontrola), 30 przeszkolonych doradców |
| **WP6** | Komercjalizacja i upowszechnianie | AgriClaw | 24–36 | — | cennik, wdrożenia przez ODR, publikacje, konferencje, otwarty benchmark | model komercjalizacji, 300 płacących gospodarstw |

---

## 5. Harmonogram i kamienie milowe

```
Mies.  1    6    12   18   24   30   36
WP1   [==========================================]  zarządzanie
WP2   [=================]                            agent + benchmark (1–18)
WP3        [=====================]                   modele chorób (4–24)
WP4            [============================]        integracja + XAI (6–30)
WP5                 [=========================]      walidacja polowa (12–36)
WP6                          [==============]        komercjalizacja (24–36)
```

| Kamień | Mies. | Kryterium |
|---|---|---|
| M1 | 6 | Korpus agro-PL + benchmark AgroHalu-PL v1 gotowe |
| M2 | 12 | Agent v2 <2% halucynacji na benchmarku · 30 gospodarstw sezon 1 |
| M3 | 18 | Warstwa XAI (wyjaśnialność) w produkcji · modele chorób v1 |
| M4 | 24 | Modele chorób AUC>0,8 · 100 gospodarstw sezon 2 · ISOXML w polu |
| M5 | 30 | Raport walidacji polowej (plon, oszczędności N/ŚOR vs kontrola) |
| M6 | 36 | Komercjalizacja: 300 płacących gospodarstw · benchmark i publikacje otwarte |

---

## 6. Konsorcjum — role, wkład, korzyści

| Podmiot | Rola w projekcie | Orientacyjny udział | Co wnosi | Co zyskuje |
|---|---|---|---|---|
| **AgriClaw sp. z o.o.** (lider, przedsiębiorca) | platforma, agent, integracja, XAI, komercjalizacja (WP1/4/6) | ~45% | działający produkt TRL6 na produkcji (agripol.xyz), zespół full-stack + EO, integracja rejestru ŚOR | usługa komercyjna, IP, przewaga rynkowa |
| **Instytut badawczy** (agronomia) | modele chorób, kalibracja progów PL, dane suszowe (WP3) | ~28% | autorytet w monitoringu suszy/gleb/nawożenia, dane historyczne | publikacje, walidacja modeli, transfer do praktyki |
| **Uczelnia** (AI/NLP) | agent PL, benchmark halucynacji, ewaluacja (WP2) | ~15% | kompetencje AI/ML + agro, warsztat ewaluacji | pierwszy benchmark agro-PL, publikacje JCR |
| **Wojewódzki ODR** | rekrutacja gospodarstw, walidacja polowa, szkolenia (WP5) | ~12% | sieć zaufania, dostęp do rolników, trwałość rezultatu | narzędzie dla doradców, przeszkolona kadra |

Wymóg programu (udział kosztów przedsiębiorstw ≥40%) — spełniony przy ~45% po stronie lidera. *Dokładny wymóg %, katalog kosztów kwalifikowanych i tabelę intensywności pomocy publicznej potwierdzić w regulaminie naboru; kwalifikowalność ODR jako konsorcjanta — potwierdzić.*

---

## 7. Budżet (struktura ramowa ~9–10 mln zł)

| Kategoria | Udział | Uwagi |
|---|---|---|
| Personel (B+R, inżynieria, agronomia, doradcy) | ~55% | rdzeń kosztów |
| Walidacja polowa (pilotaż 100 gospodarstw, 2 sezony) | ~15% | WP5 — rekrutacja, pomiary, grupa kontrolna |
| Infrastruktura obliczeniowa i dane satelitarne (CDSE/Planet) | ~10% | cache EO obniża koszt jednostkowy |
| Usługi zewnętrzne (audyt bezpieczeństwa, prawnik AI Act) | ~5% | zgodność |
| Upowszechnianie (publikacje, konferencje, benchmark otwarty) | ~5% | wpływ naukowy |
| Koszty pośrednie | ~10% | wg stawki regulaminu |

Poziom dofinansowania (do potwierdzenia tabelą pomocy publicznej naboru): badania przemysłowe do 80% (MŚP), prace rozwojowe do 60%, jednostki naukowe do 100%.

---

## 8. Wskaźniki i źródła dowodowe

**Wskaźniki produktu:** 1 platforma TRL9 · 2 modele predykcyjne (AUC>0,8) · 1 otwarty benchmark (AgroHalu-PL) · ≥4 publikacje (≥2 JCR) · 1 zgłoszenie IP/znaku.
**Wskaźniki rezultatu:** 100 gospodarstw pilotaż (≥5 000 ha) · redukcja zużycia N ≥8% i zabiegów ŚOR ≥10% vs grupa kontrolna · 300 płacących klientów (M36+12) · 30 przeszkolonych doradców ODR.
**Wskaźniki wpływu:** wsparcie celów WPR/Zielonego Ładu (redukcja N/ŚOR), Programu azotanowego, ekoschematów (w tym „Rolnictwo węglowe" — największa pula 2,78 mld zł).

**Źródła dowodowe potrzeby i wykonalności (primary):**
- JRC 2025, stan cyfryzacji rolnictwa UE (1444 rolników, w tym PL) — publications.jrc.ec.europa.eu/JRC141259
- Adopcja w rozdrobnionej PL (n=389; 66% bez technologii) — Springer 10.1007/s11119-025-10244-2
- Metaanaliza adopcji (wielkość+wykształcenie istotne, wiek nie) — Springer 10.1007/s11119-024-10213-1
- Wartość i walidacja DSS (luka walidacyjna) — Eur. J. Plant Pathology 10.1007/s10658-024-02878-1
- IPM Decisions Platform (wzorzec walidacji, doradca jako kanał) — PMC12605576
- Polskie DSS IPM: eDWIN, OPWS (IPP-NRI); CAP Art. 15 (mandat doradczy/ODR)

---

## 9. Dlaczego wygramy (mapowanie na kryteria oceny)

1. **Istota innowacji:** zmiana interfejsu na konwersacyjny + pierwszy benchmark halucynacji agro-PL + walidacja polowa z grupą kontrolną — luki, których nie zamyka ani konkurencja, ani dotychczasowe DSS.
2. **Wykonalność:** produkt **już działa na produkcji** (agripol.xyz, TRL6 — demo na żywo dla panelu ekspertów). Kluczowy guardrail WP2 (walidacja środków względem rejestru ŚOR MRiRW: ~3 tys. produktów, ~18,5 tys. zastosowań; status prawny, dawka i fazy z rejestru, link do etykiety) **jest już wdrożony** — dowód: `agroagent-rejestr-sor-dowod.pdf`. Framing „wsparcie decyzji, nie polecenie" zrecenzowany przez eksperta akademickiego i wdrożony systemowo.
3. **Kadra:** konsorcjum łączy EO+AI (lider), agronomię (instytut), NLP (uczelnia), dostęp do rolnika (ODR).
4. **Komercjalizacja:** SaaS 99–149 zł/mies., kanał B2B2F przez doradców, CAC mierzony w kampanii Beta 100.
5. **Wpływ:** otwarte rezultaty (benchmark, publikacje), zgodność z WPR/Zielonym Ładem, wsparcie ekoschematów.

---

## 10. Ryzyka i mitygacje

| Ryzyko | Mitygacja |
|---|---|
| Halucynacje LLM | WP2 guardraile + rejestr ŚOR jako jedyne źródło zaleceń środków (**już działa na produkcji**) |
| Zachmurzenie (brak zdjęć optycznych) | fuzja radaru Sentinel-1 (już wdrożona) |
| Niska adopcja | ODR w konsorcjum + WhatsApp zamiast aplikacji + niski próg cenowy |
| Zmiany API dostawców AI | abstrakcja multi-provider (dwa wymienne silniki agenta — już zrealizowane) |
| Jakość walidacji modeli chorób | protokół z grupą kontrolną, walidacja retro (10 lat) + prospektywna (pilotaż) |
| Zdolność finansowa lidera (spółka w rejestracji) | rejestracja spółki przed złożeniem; ścieżka równoległa CASSINI na rozwój produktu |

---

## 11. Do domknięcia przed złożeniem

- [ ] Rejestracja AgriClaw sp. z o.o. (KRS) — warunek zdolności wnioskodawcy
- [ ] Listy intencyjne partnerów naukowych (instytut, uczelnia) + ODR
- [ ] 20+ listów intencyjnych rolników (zbiera kampania Beta 100)
- [ ] Agendy badawcze WP2/WP3 (2 str. każda — piszą partnerzy naukowi)
- [ ] Weryfikacja w regulaminie naboru: dokładny % kosztów przedsiębiorstw, tabela pomocy publicznej, katalog kosztów kwalifikowanych, TRL wejściowy/wyjściowy, kwalifikowalność ODR, maks. czas trwania
- [ ] Formalna samoocena TRL (obecnie deklarujemy 6 — działający prototyp z pilotami)

*Sekcje 1–6 są gotowe jako materiał do PIERWSZYCH ROZMÓW z instytutem / uczelnią / ODR — wysłać wraz z zaproszeniem (`zaproszenie-do-konsorcjum.md`). Deadline 28.08 wymaga zdomkniętego konsorcjum do ~połowy sierpnia; jeśli się nie uda — celować w kolejną edycję z dojrzalszym pilotażem.*
