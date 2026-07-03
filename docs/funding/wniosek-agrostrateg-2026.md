# Wniosek NCBR AGROSTRATEG I — szkic roboczy AgriClaw

**Program:** AGROSTRATEG I konkurs, obszar **T3 Rolnictwo cyfrowe**
**Nabór:** 14.05–28.08.2026 *(⚠ do potwierdzenia świeżym researchem — sekcja 9)*
**Wnioskodawca:** konsorcjum, lider **AgriClaw sp. z o.o.** *(spółka do rejestracji — patrz proces dokończenia §2.1)*
**Wnioskowany budżet:** 9,4 mln PLN / 36 miesięcy
**Wersja:** 0.1 (3.07.2026) — szkic do rozmów z konsorcjantami; format docelowy: LSI NCBR

---

## 1. Tytuł i streszczenie (1 400 znaków)

**„AGRO-ORBITA: Cyfrowy agronom AI dla gospodarstw 10–200 ha — integracja teledetekcji satelitarnej Sentinel-1/2 z konwersacyjną sztuczną inteligencją w języku polskim, walidowana na 100 gospodarstwach pilotażowych"**

Projekt odpowiada na kluczową barierę cyfryzacji polskiego rolnictwa: 83% firm sektora wskazuje deficyt kompetencji cyfrowych rolników (Rolnictwo Zrównoważone, 2025), a istniejące narzędzia teledetekcyjne (mapy NDVI, panele analityczne) wymagają wiedzy eksperckiej, przez co penetracja w gospodarstwach 10–200 ha — stanowiących trzon produkcji roślinnej — pozostaje marginalna. Konsorcjum opracuje i zwaliduje platformę, która **odwraca paradygmat interfejsu**: zamiast panelu z mapami rolnik otrzymuje konkretne zalecenie agronomiczne w języku polskim przez komunikator (WhatsApp), generowane przez agenta AI łączącego: (a) teledetekcję Sentinel-1/2 z maskowaniem zachmurzenia, (b) modele agronomiczne (BBCH/GDD, bilans wodny, presja chorób, plan azotowy zgodny z Programem azotanowym), (c) duży model językowy z ugruntowaniem w danych gospodarstwa i krajowym rejestrze ŚOR. Wyjściowy TRL 6 (działający prototyp na produkcji z pilotami) zostanie podniesiony do TRL 9 poprzez: badania przemysłowe nad polskojęzycznym agentem agronomicznym odpornym na halucynacje (WP2), rozwój modeli predykcji chorób kalibrowanych do warunków PL (WP3) oraz walidację polową na 100 gospodarstwach w 4 województwach przez 2 sezony wegetacyjne (WP5). Rezultat: komercyjna usługa o koszcie <150 zł/mies., plan 3 000 gospodarstw w 3 lata od zakończenia.

## 2. Konsorcjum (do potwierdzenia rozmowami — lipiec 2026)

| # | Podmiot | Rola | Budżet | Uzasadnienie |
|---|---|---|---|---|
| 1 | **AgriClaw sp. z o.o.** (lider, przedsiębiorca) | rozwój platformy, agent AI, komercjalizacja | 45% (4,2 mln) | jedyny działający produkt tej klasy w PL (prod od 2026), zespół full-stack + EO |
| 2 | **IUNG-PIB Puławy** (instytut) | modele agronomiczne, kalibracja progów PL, dane suszowe | 28% (2,6 mln) | krajowy autorytet: monitoring suszy, gleby, nawożenie |
| 3 | **SGGW / Politechnika Poznańska** (uczelnia) | badania NLP/LLM dla agronomii PL, ewaluacja halucynacji, publikacje | 15% (1,4 mln) | kompetencje AI/ML + agro |
| 4 | **ODR wojewódzki (Wielkopolski lub Podlaski)** | rekrutacja 100 gospodarstw, walidacja polowa, szkolenia doradców | 12% (1,2 mln) | sieć zaufania, dostęp do rolników, trwałość rezultatu |

Warunek programu: ≥40% kosztów po stronie przedsiębiorstw — **spełniony (45%)**. *(⚠ zweryfikować dokładny wymóg w regulaminie)*

## 3. Pakiety robocze (WBS)

| WP | Nazwa | Lider | Mies. | Typ | Kluczowe zadania |
|---|---|---|---|---|---|
| WP1 | Zarządzanie i data governance | AgriClaw | 1–36 | — | PM, RODO/AI Act, otwarte dane wyników |
| WP2 | **Polskojęzyczny agent agronomiczny odporny na halucynacje** | SGGW/PP | 1–18 | badania przemysłowe | korpus agro-PL, RAG na rejestrze ŚOR + etykietach, benchmark „AgroHalu-PL" (nowość naukowa), guardraile dawek |
| WP3 | **Predykcja chorób i stresów kalibrowana do PL** | IUNG-PIB | 4–24 | badania przemysłowe | modele septorioza/fuzarioza/zaraza na danych Sentinel+meteo+BBCH, walidacja retrospektywna 10 lat |
| WP4 | Integracja i skalowanie platformy | AgriClaw | 6–30 | prace rozwojowe | VRA/ISOXML, offline PWA, multi-farm dla doradców, cache EO, koszty <2 zł/gosp./mies. |
| WP5 | **Walidacja polowa 100 gospodarstw / 2 sezony** | ODR | 12–36 | prace rozwojowe | rekrutacja, protokół badawczy (grupa kontrolna!), pomiar: plon, zużycie ŚOR/N, decyzje, NPS |
| WP6 | Komercjalizacja i upowszechnianie | AgriClaw | 24–36 | — | cennik, wdrożenia ODR, publikacje, konferencje |

**Kamienie milowe (co 6 mies.):** M6 benchmark AgroHalu-PL v1 + korpus · M12 agent v2 (halucynacje <2% na benchmarku) + 30 gospodarstw sezon 1 · M18 modele chorób AUC>0,8 · M24 100 gospodarstw sezon 2 + ISOXML w polu · M30 raport walidacji (plon/oszczędności) · M36 komercjalizacja: 300 płacących gospodarstw.

## 4. Wskaźniki (draft)

- **Produktu:** 1 platforma TRL9 · 2 modele predykcyjne · 1 benchmark otwarty · 4 publikacje (2 JCR) · 1 zgłoszenie znaku/IP.
- **Rezultatu:** 100 gospodarstw pilotaż (≥5 000 ha) · redukcja zużycia N o ≥8% i zabiegów ŚOR o ≥10% na pilotażu vs kontrola · 300 płacących klientów do M36+12 · 30 przeszkolonych doradców ODR.
- **Wpływu:** wsparcie celów Zielonego Ładu (redukcja ŚOR/N), Programu azotanowego, ekoschematów.

## 5. Budżet (struktura, 9,4 mln PLN)

Personel 55% · pilotaż/walidacja polowa 15% · infrastruktura obliczeniowa i dane satelitarne (CDSE/Planet) 10% · usługi zewnętrzne (audyt bezpieczeństwa, prawnik AI Act) 5% · upowszechnianie 5% · pośrednie 10% (*⚠ stawki i limity kategorii — z regulaminu*).
Poziom dofinansowania: badania przemysłowe 80% (MŚP), prace rozwojowe 60%, jednostki naukowe 100% *(⚠ potwierdzić tabelą pomocy publicznej naboru)*.

## 6. Dlaczego wygramy (mapowanie na kryteria oceny)

1. **Istota innowacji:** nie „kolejny dashboard NDVI" — zmiana interfejsu na konwersacyjny + benchmark halucynacji agro-PL (pierwszy taki); przewaga zweryfikowana analizą konkurencji (SatAgro/Cropwise/eAgronom — żaden nie ma AI-first PL).
2. **Wykonalność:** produkt JUŻ DZIAŁA na produkcji (TRL6, demo dla panelu ekspertów na żywo!), zespół dowiózł 15 releasów w 3 mies. (historia repo), architektura kosztowa policzona.
3. **Kadra:** konsorcjum łączy EO+AI (lider), agronomię (IUNG), NLP (uczelnia), dostęp do rolnika (ODR).
4. **Komercjalizacja:** model SaaS 99–149 zł/mies. z policzonym CAC z kampanii beta (dane realne z sierpnia–października!), kanał B2B2F przez doradców.
5. **Szeroki wpływ:** otwarte rezultaty (benchmark, publikacje), zgodność z WPR/Zielonym Ładem.

## 7. Ryzyka do wniosku

Halucynacje LLM (→ WP2 guardraile + rejestr ŚOR jako jedyne źródło zaleceń środków) · zachmurzenie (→ fuzja S1 radar, już wdrożona) · adopcja (→ ODR w konsorcjum + WhatsApp zamiast appki) · zmiany API dostawców (→ abstrakcja multi-provider, już w kodzie).

## 8. Załączniki do skompletowania

- [ ] 20+ listów intencyjnych rolników (wzór: kampania S3) — **zbiera kampania beta**
- [ ] Zgody konsorcjantów + pełnomocnictwa
- [ ] CV kadry (4–6 osób)
- [ ] Agenda badawcza WP2/WP3 (2 str. każda, piszą partnerzy naukowi)
- [ ] Analiza rynku (gotowa: docs/competition/*)

## 9. ⚠ Do weryfikacji świeżym researchem (2026-07-03)

- [ ] czy nabór faktycznie trwa do 28.08.2026 i czy T3 obejmuje nasz zakres
- [ ] dokładny wymóg % przedsiębiorstw i skład konsorcjum (czy ODR może być konsorcjantem)
- [ ] tabela intensywności pomocy i kategorie kosztów
- [ ] czy wymagany TRL wejściowy/wyjściowy jest zdefiniowany
- [ ] terminy PARP Platformy Startowe IIb (ścieżka równoległa) i programów ESA/EIT (warstwa A)

*Po powrocie researchu sekcja 9 zostanie rozwiązana, a fakty wpisane w treść. Ten szkic wystarcza do PIERWSZYCH ROZMÓW z IUNG/SGGW/ODR — wysłać jako one-pager z sekcji 1–3.*
