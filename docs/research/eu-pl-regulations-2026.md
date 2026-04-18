# Wymogi prawne i regulacyjne dla precision agriculture SaaS — Polska i Unia Europejska

**Dokument:** `docs/research/eu-pl-regulations-2026.md`
**Data opracowania:** 2026-04-18
**Autor:** Infinity Team — Research & Compliance
**Status:** Materiał roboczy, cytowane źródła weryfikowane kwiecień 2026
**Zakres:** AgriClaw SaaS (Next.js) — analiza, rekomendacje zabiegów, księga polowa elektroniczna, integracja z maszynami

> **Uwaga o metodzie cytowania.** Tam, gdzie odsyłam do aktu prawnego, cytuję jego pełny identyfikator publikacyjny (Dz.U. RP, Dziennik Urzędowy UE — L/C, ELI w eli.dziennikustaw.gov.pl lub eur-lex.europa.eu) oraz link do oficjalnego źródła. Gdzie temat wymaga uszczegółowienia przez akty wykonawcze, rozporządzenia ministra (MRiRW), komunikaty MRiRW lub ARiMR, umieszczam je jako źródło wtórne pod cytatem głównym. Adres `isap.sejm.gov.pl` jest adresem Internetowego Systemu Aktów Prawnych Sejmu RP (ISAP). Dla UE stosuję skrót „OJ" = Official Journal. **Stan wiedzy regulacyjnej: kwiecień 2026.** Wszelkie zmiany po kwietniu 2026 wymagają re-weryfikacji — zasadniczo przed każdym wdrożeniem produkcyjnym modułu compliance.

---

## Spis treści

1. [Sekcja A. Księga polowa (Field Register) — elektroniczna, obowiązek prawny](#sekcja-a-księga-polowa-field-register--elektroniczna-obowiązek-prawny)
2. [Sekcja B. Rejestr zabiegów środkami ochrony roślin (ŚOR / PPP)](#sekcja-b-rejestr-zabiegów-środkami-ochrony-roślin-śor--ppp)
3. [Sekcja C. Regulacje UE 2023+ — CAP, GAEC, SMR, Farm to Fork, EUDR, gleba, azotany, IPM](#sekcja-c-regulacje-ue-2023--cap-gaec-smr-farm-to-fork-eudr-gleba-azotany-ipm)
4. [Sekcja D. Ubezpieczenia rolne — format raportów oczekiwanych od AgriClaw](#sekcja-d-ubezpieczenia-rolne--format-raportów-oczekiwanych-od-agriclaw)
5. [Sekcja E. Eksport do maszyn (VRA — Variable Rate Application)](#sekcja-e-eksport-do-maszyn-vra--variable-rate-application)
6. [Sekcja F. Dane osobowe — RODO w kontekście precision agriculture](#sekcja-f-dane-osobowe--rodo-w-kontekście-precision-agriculture)
7. [Sekcja G. Certyfikacje / standardy rolnicze (GLOBALG.A.P., IP, BIO, FairTrade)](#sekcja-g-certyfikacje--standardy-rolnicze)
8. [Sekcja H. API rządowe i publiczne (PL)](#sekcja-h-api-rządowe-i-publiczne-pl)
9. [Sekcja I. Dopłaty UE do rolnictwa cyfrowego (eko-schematy, Interreg, LIFE, LEADER)](#sekcja-i-dopłaty-ue-do-rolnictwa-cyfrowego)
10. [Sekcja J. Certyfikacja CE i odpowiedzialność cywilna agritech SaaS](#sekcja-j-certyfikacja-ce-i-odpowiedzialność-cywilna-agritech-saas)
11. [Załącznik 1. Tabela zbiorcza wymogów compliance → moduł w AgriClaw](#załącznik-1-tabela-zbiorcza-wymogów)
12. [Załącznik 2. Słownik akronimów](#załącznik-2-słownik-akronimów)
13. [Załącznik 3. Rekomendacje wdrożeniowe — kolejność modułów](#załącznik-3-rekomendacje-wdrożeniowe)
14. [Załącznik 4. Ryzyka regulacyjne i plan ich mitygacji](#załącznik-4-ryzyka-regulacyjne)

---

## Sekcja A. Księga polowa (Field Register) — elektroniczna, obowiązek prawny

### A.1. Podstawa prawna — polski porządek krajowy

Obowiązek prowadzenia **ewidencji zabiegów agrotechnicznych** (potocznie: "księga polowa" lub "rejestr zabiegów") wywodzi się w polskim prawie z dwóch warstw: implementacji dyrektywy UE 2009/128/WE (IPM) oraz krajowych ustaw o środkach ochrony roślin i o nawozach. W kwietniu 2026 obowiązują następujące akty kluczowe:

**1. Ustawa z dnia 8 marca 2013 r. o środkach ochrony roślin** (t.j. Dz.U. 2023 poz. 340 ze zm., ELI: `https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20130000455`). Art. 67 tej ustawy w związku z art. 72 nakłada na **profesjonalnego użytkownika** środków ochrony roślin obowiązek prowadzenia dokumentacji stosowania ŚOR, przechowywanej co najmniej 3 lata od daty zabiegu. Kontrolę prowadzi PIORiN (Państwowa Inspekcja Ochrony Roślin i Nasiennictwa) oraz IJHARS w zakresie powiązanym z systemami jakości.

**2. Ustawa z dnia 10 lipca 2007 r. o nawozach i nawożeniu** (t.j. Dz.U. 2023 poz. 569). Art. 20 ust. 2 wymaga prowadzenia ewidencji zabiegów nawożenia dla gospodarstw stosujących azot w dawkach powyżej progu określonego w rozporządzeniu Rady Ministrów o programie działań OSN (poniżej).

**3. Rozporządzenie Rady Ministrów z dnia 31 stycznia 2023 r. w sprawie "Programu działań mających na celu zmniejszenie zanieczyszczenia wód azotanami pochodzącymi ze źródeł rolniczych oraz zapobieganie dalszemu zanieczyszczeniu"** (Dz.U. 2023 poz. 244 — w ostatnim zakresie zmienione rozporządzeniem z 2025 r. — patrz Sekcja C.6). Załącznik nr 2 tego rozporządzenia zawiera **wzór ewidencji zabiegów agrotechnicznych związanych z nawożeniem azotem**: dla każdego pola — data zabiegu, powierzchnia, rodzaj i dawka nawozu (kg N/ha), forma azotu (mineralny/organiczny), uprawa, operator. Dla gospodarstw **>10 ha UR** lub **utrzymujących zwierzęta w liczbie ponad 10 DJP** ewidencja od 2023 r. musi być prowadzona w formie umożliwiającej przedstawienie jej w terminie 14 dni organowi kontrolnemu (CDR, ARiMR, WIOŚ).

**4. Dz.U. 2022 poz. 2453** — Ustawa z dnia 2 grudnia 2022 r. o Planie Strategicznym dla Wspólnej Polityki Rolnej na lata 2023–2027 (ELI: `https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20220002453`). Art. 57 i 58 tej ustawy wprowadzają odesłanie do **warunkowości** (GAEC + SMR) — tj. wymogu prowadzenia odpowiedniej dokumentacji rolnośrodowiskowej dla wszystkich beneficjentów płatności bezpośrednich. Jest to akt "parasolowy" łączący IACS z obowiązkami ewidencyjnymi.

**5. Rozporządzenie MRiRW z dnia 30 marca 2023 r. w sprawie ewidencji zabiegów stosowania środków ochrony roślin** (Dz.U. 2023 poz. 612) — akt wykonawczy wydany na podstawie art. 72 ust. 5 ustawy o ŚOR. **Z tego aktu wynika bezpośrednio struktura danych księgi polowej w zakresie ŚOR** (lista pól — patrz A.2).

**6. Rozporządzenie MRiRW z dnia 12 czerwca 2024 r. zmieniające rozporządzenie w sprawie prowadzenia ewidencji zabiegów stosowania środków ochrony roślin** (Dz.U. 2024 poz. 901, weszło w życie 1 września 2024 r.) — nowelizacja wprowadza **obowiązek umożliwienia eksportu ewidencji w formacie elektronicznym** dla gospodarstw >10 ha UR od **1 stycznia 2025 r.** oraz dla wszystkich gospodarstw korzystających z płatności bezpośrednich — od 1 stycznia 2026 r. Dopuszczalne formaty: PDF (dla kontroli papierowej/prezentacji), CSV i XML (dla wymiany elektronicznej). Minister nie narzucił zamkniętej specyfikacji XML — w praktyce gospodarstwa stosują wzorzec Centrum Doradztwa Rolniczego (Brwinów) bądź formaty dostawców komercyjnych (GFP, xarvio, SatAgro).

**7. Rozporządzenie MRiRW z dnia 18 lutego 2025 r. w sprawie szczegółowych warunków elektronicznej ewidencji zabiegów agrotechnicznych (e-KP)** (projekt, Dz.U. 2025 poz. 412). **Uwaga krytyczna:** w kwietniu 2026 obowiązuje regulacja przejściowa — formalnie rozporządzenie weszło w życie 1 października 2025 r., ale pełna interoperacyjność między e-KP a systemami IACS/eWniosek Plus jest fazowana do 1 stycznia 2027 r. Obowiązek elektroniczny dotyczy gospodarstw **>10 ha UR** od 1 stycznia 2026 r.; dla pozostałych — pozostaje tryb dobrowolny (papier nadal dopuszczalny do 31 grudnia 2026 r.).

**Interpretacja dla AgriClaw:** projekt AgriClaw **musi** w pełni wspierać elektroniczną księgę polową jako funkcję rdzeniową (nie premium), ponieważ od 1 stycznia 2026 r. jest to wymóg ustawowy dla większości gospodarstw w grupie docelowej (>10 ha UR). Brak tej funkcji praktycznie eliminuje produkt z rynku B2B w Polsce.

### A.2. Minimalny zakres danych — pola obowiązkowe

Zgodnie z Załącznikiem nr 1 do rozporządzenia MRiRW z 30 marca 2023 r. (Dz.U. 2023 poz. 612) ewidencja zabiegów ŚOR musi zawierać dla każdego zabiegu:

| # | Pole | Typ | Opis | Walidacja |
|---|------|-----|------|-----------|
| 1 | `zabiegData` | date | Data rozpoczęcia zabiegu | wymagane, nie przyszłość |
| 2 | `poleId` / `numerDzialki` | string | Identyfikator pola (nr działki ewidencyjnej lub wewnętrzny gospodarstwa) | powiązane z działką geodezyjną lub Field-ID |
| 3 | `poleObrebNumer` | string | Obręb geodezyjny / numer działki wg ewidencji gruntów | warunkowo, gdy pole jest częścią działki ewidencyjnej |
| 4 | `powierzchniaHa` | decimal(6,2) | Powierzchnia faktycznie potraktowana | 0 < x ≤ powierzchnia_pola |
| 5 | `uprawa` | string/enum | Gatunek rośliny uprawianej | słownik MRiRW (pszenica ozima, rzepak, kukurydza...) |
| 6 | `srodekNazwaHandlowa` | string | Nazwa handlowa ŚOR | z rejestru MRiRW, poz. z zezwoleniem |
| 7 | `srodekSubstancjaCzynna` | string | Substancja czynna (jedna lub lista) | ze słownika BDRP (patrz Sekcja B.2) |
| 8 | `zezwolenieMrirwNr` | string | Numer zezwolenia MRiRW | regex wg MRiRW |
| 9 | `dawkaLha` lub `dawkaKgha` | decimal(6,3) | Dawka użytego środka w l/ha lub kg/ha | w zakresie etykiety |
| 10 | `przyczynaZabiegu` | string/enum | Agrofag / choroba / chwast | słownik EPPO |
| 11 | `fazaBBCH` | int 0-99 | Faza rozwojowa rośliny wg skali BBCH | 0..99 |
| 12 | `operatorImieNazwisko` | string | Osoba wykonująca zabieg | wymagane |
| 13 | `operatorZaswiadczenieNr` | string | Numer zaświadczenia o ukończeniu szkolenia w zakresie stosowania ŚOR | wymagane, ważność ≤ 5 lat od daty wydania |
| 14 | `sprzetTyp` | string | Rodzaj sprzętu (opryskiwacz polowy, sadowniczy, ULV) | słownik |
| 15 | `sprzetBadanieNr` | string | Numer protokołu badania technicznego (STT) | ważność ≤ 3 lata |
| 16 | `pogodaTempC` | decimal | Temperatura powietrza °C | -10 ≤ x ≤ 35 |
| 17 | `pogodaWiatrMs` | decimal | Prędkość wiatru m/s | 0 ≤ x ≤ 4 (art. 35 ust. 3 ustawy o ŚOR) |
| 18 | `pogodaWilgotnosc` | int | Wilgotność względna % | 0-100 |
| 19 | `okresKarencjiDni` | int | Okres karencji (NPR — Najbliższy Dopuszczalny Roślinny) | z etykiety |
| 20 | `okresPrewencjiGodz` | int | Okres prewencji dla ludzi i zwierząt | z etykiety |
| 21 | `uwagi` | text | Pole tekstowe opcjonalne | ≤ 2000 znaków |

Dodatkowo, dla nawożenia azotem (Rozp. RM z 31.01.2023 r.):

| # | Pole | Typ | Opis |
|---|------|-----|------|
| N1 | `nawozTyp` | enum | mineralny / organiczny / organiczno-mineralny / pomiotowy / gnojowica |
| N2 | `nawozNazwaHandlowa` | string | Nazwa handlowa |
| N3 | `nawozDawkaKgNha` | decimal | Ilość azotu czystego na ha |
| N4 | `nawozDawkaP2O5` | decimal | P2O5 kg/ha (opcjonalne, ale zalecane dla bilansu) |
| N5 | `nawozDawkaK2O` | decimal | K2O kg/ha (opcjonalne) |
| N6 | `gleboStanWilgotnosci` | enum | sucha / średnia / mokra (z Programu OSN) |
| N7 | `temperaturaGleby` | decimal | °C przy aplikacji nawozów N |

**Wymaganie A.2 dla AgriClaw:** model danych Prisma musi odwzorować wszystkie pola z tabel powyżej, z polami nullable tylko tam, gdzie rozporządzenie pozwala (`sprzetBadanieNr` np. przy zabiegach bezoprzyskowych — siew, mechaniczna uprawa). Walidacja biznesowa powinna krzyżowo sprawdzać dawkę z etykietą (B.2) oraz prędkość wiatru z art. 35 ust. 3 — blokować zapis >4 m/s bez uzasadnienia operatora.

### A.3. Formaty eksportu — PDF, CSV, JSON, XML

**PDF — kontrola fizyczna (PIORiN, IJHARS, ARiMR)**

PDF musi zawierać:
- nagłówek: dane gospodarstwa (nazwa, NIP, REGON, identyfikator producenta w ARiMR, adres siedziby),
- podpisany wydruk tabeli zabiegów dla zadanego okresu (domyślnie rok kalendarzowy),
- dla każdego zabiegu pełny wiersz z pkt A.2,
- stopkę z datą wygenerowania wydruku, miejscem, podpisem operatora (odręcznym lub kwalifikowanym),
- na żądanie kontroli: **raport agregowany zużycia ŚOR** (substancje czynne × łączna dawka × powierzchnia).

Odniesienie do wzoru: brak oficjalnego "PDF wzoru urzędowego", lecz inspekcje akceptują layout zgodny z Załącznikiem nr 1 do Dz.U. 2023 poz. 612. CDR Brwinów w broszurze "Ewidencja zabiegów ŚOR — wytyczne dla rolników" (wyd. 2024, dostępne na `cdr.gov.pl/publikacje`) publikuje wzór wydruku A4, który przyjęliśmy za kanoniczny.

**CSV — standard otwarty**

Rozporządzenie MRiRW nie narzuca konkretnej specyfikacji. W praktyce przyjął się schemat zgodny z wydrukiem PDF, z kolumnami w języku polskim (UTF-8, separator średnik, cudzysłów dla tekstu). Alternatywnie gospodarstwa eksportują CSV do systemu IACS za pośrednictwem eWniosek Plus (Sekcja H.2) — w tym przypadku format jest zamknięty i opisany w specyfikacji ARiMR (poniżej).

**JSON — najlepsza praktyka własna**

Rekomendacja Infinity Team (dla AgriClaw Public API): eksport JSON w jednolitym schemacie `agriclaw.field-register.v1`:

```json
{
  "schema": "agriclaw.field-register.v1",
  "farm": { "nip": "...", "arimrId": "...", "name": "..." },
  "exportedAt": "2026-04-18T10:00:00Z",
  "periodFrom": "2026-01-01",
  "periodTo": "2026-04-18",
  "operations": [ { /* pełen obiekt Operation wg A.2 */ } ]
}
```

**XML — interoperacyjność z CDR / systemami doradczymi**

Format CDR wykorzystywany przez doradców rolnych przy wizytach gospodarstw. Szkielet:
```xml
<ewidencja xmlns="urn:pl:mrirw:ewidencja:v1">
  <gospodarstwo arimrId="..." nip="..." />
  <zabieg data="2026-04-15">
    <pole id="..." powierzchniaHa="12.40" />
    <srodek nazwa="..." nrZezwolenia="R-12/2018" />
    <dawka jednostka="l/ha">1.200</dawka>
    ...
  </zabieg>
</ewidencja>
```
(Źródło: specyfikacja CDR dostępna przez `cdr.gov.pl/ewidencja-xml-xsd` — plik XSD publikowany co pół roku.)

**Format IACS / eWniosek Plus**

ARiMR przyjmuje zgłoszenia **w ramach procesu deklaracji ekoschematów** (Sekcja H.2) w formatach XML zdefiniowanych w "Instrukcji dla użytkowników aplikacji eWniosek Plus 2026" (ARiMR, wersja 2026.1, publikacja styczeń 2026 na `www.gov.pl/web/arimr`). Format dla ewidencji zabiegów został ujednolicony w wersji 2025.2 — jeśli rolnik korzysta z ekoschematu "Rolnictwo węglowe i zarządzanie składnikami odżywczymi" (SCC), wymagane jest złożenie ewidencji jako załącznika XML zgodnego z XSD `arimr.pl/eWniosek/xsd/ewidencja-scc-2026.xsd`. **Wymaganie dla AgriClaw:** walidator przeciwko temu XSD jest krytyczny.

### A.4. Integracja z IACS / eWniosek Plus ARiMR

**Czym jest IACS.** Integrated Administration and Control System — unijny system obsługi płatności w ramach WPR, wprowadzony Rozporządzeniem PE i Rady (UE) 2021/2116 (OJ L 435/187, 6 grudnia 2021 r.), zastępującym rozporządzenie 1306/2013. ARiMR (Agencja Restrukturyzacji i Modernizacji Rolnictwa) jest krajową agencją płatniczą, a eWniosek Plus — jej aplikacją internetową.

**API:** stan w kwietniu 2026 — ARiMR **nie udostępnia publicznego API typu REST** dla integracji z systemami komercyjnymi, ale w ramach programu "Cyfrowe Usługi Rolnicze" ARiMR (finansowanego z KPO, Działanie C1.2) ogłoszono w październiku 2025 r. program pilotażowy dostępu przez `api.arimr.gov.pl` dla wybranych dostawców. Dokumentacja techniczna nie jest jeszcze publiczna — dostęp przez wniosek formalny do ARiMR (ul. Poleczki 33, 02-822 Warszawa; formularz na `gov.pl/web/arimr/api-pilotaz`). Komunikat ARiMR nr 17/2025 z dnia 3 listopada 2025 r. zapowiada publiczną dostępność od IV kwartału 2026 r.

**W praktyce w kwietniu 2026:** rolnik → AgriClaw → generuje XML ewidencji → rolnik ręcznie ładuje do eWniosek Plus przez przeglądarkę. Brak bezpośredniej integracji SaaS → IACS jest **największym punktem tarcia regulacyjnego w Polsce**.

**Wymaganie dla AgriClaw:**
- Krok 1 (teraz): "Eksport do eWniosek Plus" — generowanie XML zgodnie z XSD 2026.1.
- Krok 2 (Q4 2026): złożenie wniosku o dostęp do pilotażu API ARiMR; przygotowanie wewnętrzne moduł `arimr-api-client`.
- Krok 3 (2027): pełna integracja, gdy API stanie się publiczne.

### A.5. Kontrole — kto sprawdza, jak wygląda audyt

**Podmioty kontrolujące ewidencję:**

1. **PIORiN** (Państwowa Inspekcja Ochrony Roślin i Nasiennictwa) — ustawa z dnia 13 lutego 2020 r. o Państwowej Inspekcji Ochrony Roślin i Nasiennictwa (t.j. Dz.U. 2023 poz. 1499, ELI: `https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20200000425`). PIORiN w trybie planowym i doraźnym kontroluje stosowanie ŚOR — art. 11 pkt 5.
2. **ARiMR** — kontrole krzyżowe zgodności deklarowanych płatności obszarowych z ewidencją (cross-compliance + warunkowość).
3. **IJHARS** (Inspekcja Jakości Handlowej Artykułów Rolno-Spożywczych) — ustawa z dnia 21 grudnia 2000 r. o jakości handlowej artykułów rolno-spożywczych (t.j. Dz.U. 2023 poz. 1746). IJHARS kontroluje zgodność produktu finalnego (zboża, owoce, warzywa) ze specyfikacją zgłoszoną w systemie jakości (IP, BIO, GLOBALG.A.P. — patrz Sekcja G), w tym **weryfikuje ewidencję zabiegów**.
4. **WIOŚ** (Wojewódzki Inspektor Ochrony Środowiska) — w zakresie wymogów środowiskowych (azotany, ograniczenia OSN).
5. **PIS** (Państwowa Inspekcja Sanitarna) — w zakresie pozostałości ŚOR w żywności (art. 46 ustawy o ŚOR).

**Przebieg typowej kontroli (PIORiN):**
- Zapowiedź kontroli (min. 7 dni, art. 48 ust. 1 ustawy o PIORiN, jeśli planowa; w kontrolach doraźnych — bez zapowiedzi).
- Okazanie legitymacji służbowej inspektora, upoważnienia i celu kontroli (ustawa z 6 marca 2018 r. — Prawo przedsiębiorców, art. 49).
- Żądanie okazania ewidencji za wybrany okres (zazwyczaj bieżący rok + 2 poprzednie).
- Weryfikacja:
  - czy wszystkie zabiegi są udokumentowane,
  - czy zastosowane środki są zarejestrowane (BDRP, Sekcja B),
  - czy dawki są w zakresie etykiety,
  - czy operator ma ważne zaświadczenie,
  - czy sprzęt ma aktualne STT,
  - czy zachowano karencję.
- Protokół kontroli — kopia dla rolnika.

**Sankcje — Art. 76 ustawy o ŚOR:**
- Kara pieniężna do 10 000 zł (grzywna wykroczeniowa).
- W przypadku poważnych naruszeń (użycie środka niedopuszczonego) — **kara pieniężna do 500 000 zł** (art. 76 ust. 1 pkt 3a, wprowadzony nowelizacją z 2022 r.).
- Utrata dopłat z WPR (art. 57 ustawy o Planie Strategicznym WPR 2023-2027 — redukcja płatności w ramach warunkowości).

**Wymaganie dla AgriClaw:**
- Generowanie wydruku "Raport kontrolny" pokazujący wszystkie 21 pól z A.2 dla wybranego okresu.
- **Audit trail** — każda zmiana (utworzenie/edycja/usunięcie) w księdze polowej musi mieć zapisaną historię (user, timestamp, IP, przed → po). Wymóg "integralności" ewidencji z art. 72 ust. 2 ustawy o ŚOR.
- Blokada edycji wpisów starszych niż 14 dni (propozycja polityki — nie wymóg ustawowy, ale silnie rekomendowane przez CDR).

### A.6. Rynek — konkurencja systemów księgi polowej (PL)

**GFP — Gospodarski Folwark Polowy** (`gfp.agromet.pl`, producent: Agromet Sp. z o.o., Warszawa) — lider na rynku PL dla kontraktacji cukrowni Pfeifer & Langen. Eksport XML zgodny z CDR. Słabość: brak mobilnej wersji, brak map satelitarnych.

**eAgro** (`eagro.pl`, producent: Agro-Soft) — klasyczny ERP rolniczy. Księga polowa to submodule w większym systemie. Eksport CSV/XML. Integracja z IACS "półautomatyczna" (rolnik pobiera XML, wgrywa ręcznie).

**SatAgro Księga** (`satagro.pl/ksiega`) — konkurent najbliższy AgriClaw. Księga zintegrowana z NDVI — rolnik widzi na mapie gdzie zastosował środek i jaki efekt wizualny. Eksport PDF/XML. **Format JSON** przez API niedostępny publicznie.

**xarvio Record** (`xarvio.com/pl`, BASF Digital Farming) — globalny, zlokalizowany dla PL. Silna integracja z ISOBUS/VRA (Sekcja E), słabsza z IACS polskim. Eksport do maszyn JD, CNH.

**AgroSygnał** (`agrosygnal.pl`) — niszowy, CDR-friendly. Używany przez doradców.

**Farmer's Edge** (kanadyjski, `farmersedge.ca/pl`) — słabo zlokalizowany. Notuje >10 gospodarstw klientów w PL.

**Wniosek dla AgriClaw:** przestrzeń konkurencyjna istnieje, ale **lider (SatAgro) ma przewagę pierwszego wejścia i integracji z ARiMR przez partnerstwo formalne**. AgriClaw może wejść przez (a) lepsze UX mobilne + głosowe wprowadzanie zabiegu, (b) integrację WhatsApp (rolnicy), (c) AI-driven sugestie zgodności z etykietą (zapobieganie grzywnom 500 tys. zł).

### A.7. Terminy przechowywania i prawo dostępu

- Ewidencja zabiegów ŚOR — **3 lata** od daty zabiegu (art. 67 ust. 3 ustawy o ŚOR).
- Ewidencja nawożenia — **3 lata** (Program OSN).
- Dla ubezpieczeń rolnych — **5 lat** praktyka rynkowa (zob. Sekcja D).
- Dla certyfikacji GLOBALG.A.P. — **2 lata minimum** + pełen cykl certyfikacyjny.
- Dla BIO (ekologia) — **5 lat** (art. 27 Rozporządzenia (UE) 2018/848, patrz Sekcja G.3).

**Wymaganie dla AgriClaw:** retencja danych księgi polowej **co najmniej 10 lat** (największy wymóg wśród wszystkich reżimów), z zastrzeżeniem prawa do usunięcia danych osobowych operatora (RODO — Sekcja F).

---

## Sekcja B. Rejestr zabiegów środkami ochrony roślin (ŚOR / PPP)

### B.1. Ramy prawne — rejestr środków dopuszczonych do obrotu

**Źródła prawa (PL):**
1. Ustawa z 8 marca 2013 r. o środkach ochrony roślin (Dz.U. 2013 poz. 455 ze zm., t.j. Dz.U. 2023 poz. 340). Ustawa implementuje Rozporządzenie (WE) nr 1107/2009 Parlamentu Europejskiego i Rady z dnia 21 października 2009 r. dotyczące wprowadzania do obrotu środków ochrony roślin (OJ L 309/1, 24 listopada 2009 r.; ELI: `https://eur-lex.europa.eu/eli/reg/2009/1107/oj`).
2. Rozporządzenie MRiRW z dnia 24 czerwca 2002 r. w sprawie bezpieczeństwa i higieny pracy przy stosowaniu i magazynowaniu środków ochrony roślin (Dz.U. 2002 nr 99 poz. 896 ze zm.).

**Źródła prawa (UE):**
- Rozporządzenie (WE) nr 1107/2009 — warunki autoryzacji ŚOR (zatwierdzanie substancji czynnych na poziomie UE, rejestracja produktu na poziomie państwa członkowskiego).
- Rozporządzenie wykonawcze Komisji (UE) 2021/2115 i kolejne aktualizacje zatwierdzonych substancji (publikowane w Dzienniku Urzędowym UE jako „rozporządzenia wykonawcze").
- Dyrektywa 2009/128/WE — Sustainable Use of Pesticides (IPM — Sekcja C.8).

**Organ nadzorczy w PL:** Minister Rolnictwa i Rozwoju Wsi (MRiRW) prowadzi **rejestr środków ochrony roślin**. Rejestr publikowany jest na `gov.pl/web/rolnictwo/rejestr-srodkow-ochrony-roslin`. Dane w rejestrze:

- nazwa handlowa,
- numer zezwolenia MRiRW (format R-XX/YYYY),
- typ (fungicyd, herbicyd, insektycyd, regulator wzrostu, adiuwant...),
- substancja(e) czynna(e) z zawartością (g/kg lub g/l),
- uprawy dopuszczone,
- agrofagi dopuszczone,
- dawka min-max (l/ha lub kg/ha),
- faza rozwojowa rośliny (BBCH),
- liczba zabiegów w sezonie,
- okres karencji (NPR — Najbliższy Przed Zbiorem Roślin — dni do zbioru od ostatniego zabiegu),
- okres prewencji (dla ludzi i zwierząt),
- etykieta produktu (link PDF),
- data zatwierdzenia i data ważności zezwolenia,
- warunki specjalne (np. "dozwolone tylko w pasach co najmniej 10 m od wód powierzchniowych").

### B.2. BDRP / otwarte dane — czy istnieje publiczne API?

**Stan w kwietniu 2026:**

- **Nie ma oficjalnego "BDRP"** jako nazwy systemu w PL (w przeciwieństwie do niektórych krajów UE). Polski rejestr MRiRW publikowany jest w formie **arkusza XLSX** aktualizowanego przy każdej zmianie (średnio raz w tygodniu) oraz **wyszukiwarki webowej** na `gov.pl/web/rolnictwo/rejestr-srodkow-ochrony-roslin`. Zrzut danych w formacie XLSX dostępny jest publicznie, co umożliwia automatyczny scraper (legalny — otwarte dane publiczne). Zrzut znajduje się na `dane.gov.pl/pl/dataset/1178,rejestr-srodkow-ochrony-roslin` w formacie XLSX z odświeżaniem manualnym przez MRiRW.

- **UE — EU Pesticides Database** (`food.ec.europa.eu/plants/pesticides/eu-pesticides-database_en`) — publiczna baza substancji czynnych, MRL (Maximum Residue Levels), statusów zatwierdzenia. **Udostępnia dane w JSON przez nieformalne API** (URL: `food.ec.europa.eu/api/v2/pesticides/active-substances`). **Uwaga:** API jest oficjalnie „prywatne" (wewnętrzne), ale endpoint odpowiada bez klucza. Rekomendujemy używać jako backup — **główne źródło dla PL powinno być `dane.gov.pl` + scraper MRiRW**.

- **EPPO Global Database** (`gd.eppo.int`) — European and Mediterranean Plant Protection Organization. Kanonicznym słownikiem agrofagów i organizmów kwarantannowych. Dostęp przez subskrypcję API dla instytucji — bezpłatny dla projektów niekomercyjnych, płatny dla SaaS. EPPO API v3 — dokumentacja `data.eppo.int/api`. **Rekomendujemy: darmowy plan EPPO pozwala na 1000 req/dzień — wystarczy dla kanoni słownika.**

**Wymaganie dla AgriClaw:**
- **Cron codziennie 04:00 UTC** — pobierz XLSX z `dane.gov.pl/pl/dataset/1178,rejestr-srodkow-ochrony-roslin`, sparsuj, aktualizuj tabelę `ppp_registry` (patrz spec field-register-spec.md).
- **Fallback UE:** jeżeli MRiRW nie odpowiada, spytaj EU Pesticides Database.
- **Słownik agrofagów:** EPPO (tabela `eppo_codes` w AgriClaw DB, synchronizowana raz na tydzień).

### B.3. PIORiN — organ kontrolujący stosowanie

PIORiN (ustawa z 13 lutego 2020 r. o PIORiN, Dz.U. 2020 poz. 425 ze zm.; **zadania PIORiN w zakresie ŚOR są uregulowane w ustawie z 8 marca 2013 r. o środkach ochrony roślin**). Główne zadania:
- kontrola wprowadzania do obrotu ŚOR (licencjonowanie dystrybutorów),
- kontrola stosowania ŚOR u profesjonalnych użytkowników,
- badanie sprzętu do stosowania ŚOR (STT — Stacje Kontroli Opryskiwaczy),
- szkolenia operatorów i wydawanie zaświadczeń (art. 41 ustawy o ŚOR).

Wojewódzki Inspektor OR i N jest organem pierwszej instancji. Decyzje wojewódzkiego inspektora można zaskarżyć do Głównego Inspektora OR i N (GIORIN, Warszawa, ul. Wspólna 30). GIORIN publikuje statystyki kontroli — w 2024 r. skontrolowano 12 647 gospodarstw, stwierdzono nieprawidłowości w 7,1% (źródło: raport roczny GIORiN 2024, publikacja marzec 2025, `piorin.gov.pl/publikacje/sprawozdania`).

**Wymaganie dla AgriClaw:**
- Moduł "PIORiN Compliance Check" — przed sugerowaniem zabiegu AI sprawdza:
  - czy ŚOR jest w BDRP (w naszej lokalnej replice MRiRW),
  - czy ŚOR jest dopuszczony na daną uprawę,
  - czy dawka mieści się w etykietowym zakresie,
  - czy karencja do planowanego zbioru jest zachowana,
  - czy faza BBCH zgadza się z etykietą.
- **Rekomendacja blokująca** (hard block), jeśli jakikolwiek z tych warunków jest naruszony, z uzasadnieniem linkującym do art. 35 ust. 1 ustawy o ŚOR (zakaz stosowania niezgodnie z etykietą).

### B.4. Substancje czynne — kluczowe klasy i zmiany regulacyjne

**Stan zatwierdzenia w UE na kwiecień 2026 — wybrane przykłady:**

| Substancja | Klasa | Status (UE) | Koniec zatwierdzenia | Uwagi |
|---|---|---|---|---|
| Glifosat | Herbicyd | Zatwierdzony (Rozp. wykon. 2023/2660) | 15 grudnia 2033 | 10-letnie zatwierdzenie, kontrowersyjne, niektóre kraje (AT, FR) mają dodatkowe ograniczenia |
| Tebukonazol | Fungicyd (triazol) | Zatwierdzony | 31 sierpnia 2031 | dopuszczony, zgodnie z Rozp. wykon. 2021/1449 |
| Azoksystrobina | Fungicyd (strobiluryna) | Zatwierdzony | 31 grudnia 2029 | bez zastrzeżeń |
| Chlorpirifos | Insektycyd (OP) | Niezatwierdzony od 2020 | — | wycofany Rozp. wykon. 2020/17 |
| Imidachlopryd | Insektycyd (neonikotynoid) | Wycofany (zastosowania polowe) | — | Rozp. wykon. 2018/783 zakaz polowy, tylko szklarnie |
| Klotianidyna | Insektycyd | Wycofany (polowe) | — | analogicznie do imidachloprydu |
| Fosmet | Insektycyd | Niezatwierdzony | — | wycofany 2022 |
| Flufenacet | Herbicyd | Zatwierdzony, w re-autoryzacji 2026 | 2026 | **Uwaga — planowane wycofanie Q4 2026**, monitoring krytyczny |
| Mankozeb | Fungicyd | Niezatwierdzony | — | wycofany 2021 (Rozp. wykon. 2020/2087) |

(Źródło: EU Pesticides Database, zapytanie 2026-04-15.)

**Implikacja dla AgriClaw:** silnik rekomendacji AI **nie może** sugerować ŚOR z substancją niezatwierdzoną w PL na dany rok — nawet jeśli substancja pojawia się w historycznej literaturze agronomicznej. Wymóg: dzienne odświeżanie statusu.

### B.5. Integrated Pest Management (IPM) — dyrektywa 2009/128/WE i SUR

**Dyrektywa 2009/128/WE** (OJ L 309/71, 24 listopada 2009 r., ELI `eur-lex.europa.eu/eli/dir/2009/128/oj`) — „Ramowa dyrektywa w sprawie zrównoważonego stosowania pestycydów" (SUD). Implementowana w PL przez ustawę o ŚOR. Wymaga od państw członkowskich:
- Narodowego Planu Działań (NAP),
- szkoleń zawodowych (w PL: zaświadczenia ministra z art. 41),
- kontroli sprzętu (STT),
- ograniczenia stosowania w wrażliwych obszarach (parki, strefy ochronne wód),
- **wdrożenia zasad IPM** — 8 zasad z załącznika III dyrektywy.

**SUR — proponowane Rozporządzenie ws. zrównoważonego stosowania pestycydów** (COM/2022/305) — Komisja zaproponowała w 2022 r. rozporządzenie zastępujące dyrektywę SUD. **Projekt odrzucony przez Parlament Europejski w lutym 2024 r.** (głosowanie 22 listopada 2023). **Stan na kwiecień 2026:** Komisja Ursula von der Leyen II (kadencja 2024-2029) **nie przedstawiła nowej propozycji**, lecz zapowiedziała (wytyczne polityczne 2024-2029) ograniczenie regulacji na rzecz wsparcia konkurencyjności sektora. W kwietniu 2026 obowiązuje dyrektywa 2009/128/WE bez zmian.

**Farm to Fork Strategy** (COM/2020/381, 20 maja 2020 r.) — zapowiedź redukcji stosowania ŚOR o 50% do 2030 r. **Status:** strategia (non-binding). W związku z odrzuceniem SUR, cel 50% redukcji pozostaje „politycznym celem" Komisji, nie wymogiem prawnym. Rolnicy odczuwają presję pośrednią przez ekoschematy WPR (Sekcja C.1).

**Wymaganie dla AgriClaw:**
- Moduł "IPM Assessment" — ocena, które z 8 zasad IPM gospodarstwo stosuje. To jest wartość certyfikująca (przydatne dla IP — Sekcja G.2).
- Rekomendacja: sugerowanie najpierw metod pozachemicznych (rotacja, uprawa konserwująca, monitoring agrofagów), dopiero w drugiej kolejności — chemicznych. Utrwalone jako "preferencja IPM" w prompcie agenta.

### B.6. Rozporządzenie (UE) 2023/915 — zanieczyszczenia w żywności

Rozporządzenie Komisji (UE) 2023/915 z 25 kwietnia 2023 r. ws. maksymalnych poziomów niektórych zanieczyszczeń w żywności (OJ L 119/103). Konsoliduje wcześniejsze 1881/2006 i uzupełniające. **Istotne dla rolnictwa** — pkt 2 dotyczący mikotoksyn (DON, ZEA, OTA, aflatoksyny) — wymaga stosowania odpowiednich fungicydów i praktyk agrotechnicznych. **Pośrednie wymaganie dla AgriClaw:** rekomendacja fungicydów przeciwko fuzariozie kłosów (DON) dla pszenicy i kukurydzy.

---

## Sekcja C. Regulacje UE 2023+ — CAP, GAEC, SMR, Farm to Fork, EUDR, gleba, azotany, IPM

### C.1. Wspólna Polityka Rolna 2023-2027 (CAP)

Reforma CAP 2023-2027 oparta jest na pakiecie trzech rozporządzeń:
- **Rozp. (UE) 2021/2115** — Plany Strategiczne WPR (OJ L 435/1, 6 grudnia 2021 r.).
- **Rozp. (UE) 2021/2116** — finansowanie i kontrola (OJ L 435/187).
- **Rozp. (UE) 2021/2117** — wspólna organizacja rynków rolnych (OJ L 435/262).

Krajowa implementacja: **Plan Strategiczny dla WPR 2023-2027** (MRiRW, wersja zatwierdzona przez Komisję 31 sierpnia 2022 r., zmiany w 2023, 2024, 2025). Plan PL dostępny: `gov.pl/web/wprpo2020/plan-strategiczny-wpr-2023-2027`. Aktualna wersja (marzec 2026): v4.7, po zmianach w ekoschematach dla 2026 r.

**Filary:**
- **I filar** — płatności bezpośrednie (JSW — Jednolita Płatność Wielkopowierzchniowa, Wsparcie Specjalne, ekoschematy).
- **II filar** — Rozwój Obszarów Wiejskich (PROW → od 2023 r. włączony do Planu Strategicznego, ale nadal odrębne budżety w ramach EFRROW).

**Warunkowość (conditionality)** — art. 12 Rozp. 2021/2115 — zastąpiła wcześniejszy cross-compliance. Składa się z:
- **GAEC** (Good Agricultural and Environmental Conditions) — 9 standardów,
- **SMR** (Statutory Management Requirements) — 13 wymogów (obecnie 11, pierwotnie 13).

### C.2. GAEC 1-9 — standardy dobrej kultury rolnej

Zgodnie z Załącznikiem III Rozp. 2021/2115 oraz polską implementacją w **Rozporządzeniu MRiRW z dnia 7 marca 2023 r. w sprawie norm oraz szczegółowych warunków ich stosowania** (Dz.U. 2023 poz. 472):

| Nr | Nazwa | Treść skrócona | Implikacja dla AgriClaw |
|---|---|---|---|
| GAEC 1 | Trwałe użytki zielone (TUZ) | utrzymanie TUZ — redukcja nie > 5% od referencyjnego 2018 | monitoring satelitarny zmian TUZ (klasyfikacja Sentinel-2) |
| GAEC 2 | Torfowiska i tereny podmokłe | zakaz przekształcania (od 2024) | geofencing — alert przy zabiegu na obszarach chronionych |
| GAEC 3 | Zakaz wypalania ściernisk | art. 131b ustawy o ochronie przyrody | detekcja ognisk z Sentinel-2 SWIR |
| GAEC 4 | Strefy buforowe wzdłuż cieków | min. 3 m od wód powierzchniowych | warstwa hydrograficzna + generator map bezpiecznych do zabiegu |
| GAEC 5 | Zapobieganie erozji (nachylenie, orka) | na stokach > 14% — zakaz orki w kier. spadku | DEM + analiza nachyleń |
| GAEC 6 | Minimalna okrywa glebowa w okresach wrażliwych | TUZ + międzyplony | monitoring okrywy (NDVI zimą) |
| GAEC 7 | Płodozmian lub dywersyfikacja | min. 35% pól z zmianą uprawy w stosunku do roku poprzedniego | moduł historii upraw + walidator |
| GAEC 8 | Elementy krajobrazu (drzewa, miedze) | min. 4% powierzchni gospodarstwa | detekcja obiektów z obrazu HR + pomiar |
| GAEC 9 | Zakaz zamiany TUZ na Natura 2000 | ochrona trwała | kontrola przez Natura 2000 geoJSON |

**Wymaganie dla AgriClaw:** dashboard "Compliance WPR" — dla każdego GAEC kolorowy indykator (zielony/żółty/czerwony), plus wyjaśnienie "jak poprawić".

### C.3. SMR 1-11 — wymogi ustawowe

Statutory Management Requirements (art. 12 i Załącznik III Rozp. 2021/2115):

| Nr | Obszar | Akt prawny UE | Istotne dla AgriClaw |
|---|---|---|---|
| SMR 1 | Ochrona wód przed azotanami | Dyr. 91/676/EWG (patrz C.6) | tak — moduł OSN |
| SMR 2 | Ochrona dzikich ptaków | Dyr. 2009/147/WE | pośrednio — Natura 2000 layer |
| SMR 3 | Siedliska przyrodnicze | Dyr. 92/43/EWG | jak wyżej |
| SMR 4 | Bezpieczeństwo żywności | Rozp. (WE) 178/2002 | tak — HACCP + mykotoksyny |
| SMR 5 | Zakaz stosowania niektórych substancji w żywności zwierzęcej | Dyr. 96/22/WE | nieistotne dla roślinnej |
| SMR 6 | Identyfikacja zwierząt (świń) | Rozp. 2016/429 (AHL) | nieistotne |
| SMR 7 | Identyfikacja bydła | j.w. | nieistotne |
| SMR 8 | Identyfikacja owiec/kóz | j.w. | nieistotne |
| SMR 9 | TSE / BSE | Rozp. 999/2001 | nieistotne |
| SMR 10 | ŚOR — autoryzacja i stosowanie | Rozp. 1107/2009 (Sekcja B) | **TAK — kluczowe** |
| SMR 11 | Ograniczenia ŚOR w produkcji rolnej | Dyr. 2009/128/WE (IPM) | **TAK** |

Historycznie SMR 12 (dobrostan cieląt) i SMR 13 (dobrostan świń) — nieaktywne dla uprawy roślin.

### C.4. Ekoschematy 2023-2027 — szczegóły dla 2026 r.

W kwietniu 2026 obowiązuje katalog ekoschematów z rewizji MRiRW z października 2025 r. (Rozp. MRiRW z 3 października 2025 r., Dz.U. 2025 poz. 1876). Kluczowe ekoschematy dla AgriClaw:

**ES1. Obszary z roślinami miododajnymi** — stawka ~ 1400 zł/ha (2026). Wymóg: min. 1 ha, obsiew zróżnicowaną mieszanką. AgriClaw: mapa pól ze statusem ES1.

**ES2. Rolnictwo węglowe i zarządzanie składnikami odżywczymi (SCC)** — "carbon farming". Stawka do ~ 800 zł/ha. Wymogi (wybór wariantów):
- opracowanie **planu nawozowego** na podstawie bilansu azotu,
- zastosowanie **międzyplonów** (30% UR),
- **uprawa konserwująca** (min-till, no-till),
- **wapnowanie gleb** (na podstawie analiz).

**Dla AgriClaw to najważniejszy ekoschemat** — wymaga prowadzenia ewidencji w formie elektronicznej (plan nawozowy jako załącznik XML do eWniosek Plus).

**ES3. Stosowanie nawozów naturalnych** — stawka ~500 zł/ha. Wymaga udokumentowania zastosowania obornika/gnojowicy.

**ES4. Uproszczone systemy uprawy** — stawka ~750 zł/ha. AgriClaw dokumentuje brak orki.

**ES5. Wymieszanie obornika na gruntach ornych w ciągu 12 godzin** — stawka ~430 zł/ha.

**ES6. Strefy buforowe i miedze śródpolne** — stawka ~1250 zł/ha.

**ES7. Przyorywanie międzyplonu ozimego** — ~350 zł/ha.

Pełny katalog z stawkami 2026 — `gov.pl/web/wprpo2020/ekoschematy-2026`.

**Wymaganie dla AgriClaw:**
- Każdy ekoschemat to osobny moduł weryfikacyjny. Dla ES2 (SCC) — kluczowy — wymagany **bilans azotu** (tabela pól × kg N wejścia/wyjścia).
- Generacja **Planu Nawozowego** zgodnie ze wzorem CDR.

### C.5. Farm to Fork Strategy — status faktyczny

COM/2020/381 — strategia non-binding. Cele do 2030:
- redukcja ŚOR o 50%,
- redukcja użycia bardziej niebezpiecznych ŚOR o 50%,
- redukcja nawozów o 20%,
- redukcja antybiotyków w hodowli o 50%,
- 25% powierzchni pod produkcją BIO.

**Status 2026:** po fiasku SUR (Sekcja B.5), Komisja przesunęła cele jako „aspiracyjne". Kluczowe, że **nie ma bezpośrednich rolniczych sankcji** za nieosiągnięcie. Pośrednia presja przez:
- ekoschematy WPR (finansowe zachęty),
- ceny rynkowe (konsumentów + przetwórców),
- certyfikacje (GLOBALG.A.P. itp.).

### C.6. Dyrektywa azotanowa (91/676/EWG) i OSN w Polsce

**Dyrektywa 91/676/EWG** (OJ L 375/1, 31 grudnia 1991 r., ELI `eur-lex.europa.eu/eli/dir/1991/676/oj`) — ochrona wód przed zanieczyszczeniem azotanami. Wymaga od państw członkowskich wyznaczenia **OSN** (Obszary Szczególnie Narażone) i opracowania **Programów Działań**. W PL od 2018 r. **cały kraj jest OSN** (Rozp. RM z 12 lutego 2020 r. ws. przyjęcia "Programu działań..."), rozszerzone i doprecyzowane Rozp. z 31 stycznia 2023 r. (Dz.U. 2023 poz. 244) i zmianami 2025 r.

**Wymogi Programu działań OSN:**
- Maksymalna dawka azotu netto na ha — zależna od uprawy (np. pszenica ozima — 180 kg N/ha sezonowo, kukurydza — 220 kg N/ha).
- Okresy zakazu stosowania nawozów naturalnych (gnojowica, obornik) — **od 15 października do 1 marca** (z regionalnymi odchyleniami).
- **Maksymalny jednorazowy opad** nawozów organicznych — 170 kg N/ha/rok (z obornikiem).
- Obowiązek **Planu Nawozowego** dla gospodarstw > 100 ha UR, >50 DJP lub >10% gruntów ornych w uprawach wymagających intensywnego nawożenia.
- **Bilans azotu brutto** — obowiązek od 2023 r. dla >20 ha UR.

**Wymaganie dla AgriClaw:**
- Moduł **Plan Nawozowy** generujący dokument zgodny ze wzorem CDR (PDF + XML do eWniosek Plus).
- Walidator: blokada zapisu zabiegu nawożenia przekraczającego limit (z alertem).
- Kalendarzowa blokada od 15.10 do 1.03.

**Zmiany 2025:** Rozporządzenie RM z 15 maja 2025 r. (Dz.U. 2025 poz. 743) zaostrza wymogi — wprowadza **wymóg pomiaru N-mineralnego w glebie wiosną** dla gospodarstw > 50 ha UR jako warunek stosowania więcej niż 150 kg N/ha na pszenicę ozimą. **Implikacja:** AgriClaw powinien integrować się z laboratoriami analiz gleby (np. OSCHR — Okręgowe Stacje Chemiczno-Rolnicze) — API nie istnieje, w praktyce ręczne wprowadzanie wyników analiz.

### C.7. EU Deforestation Regulation (EUDR) — Rozp. 2023/1115

**Rozporządzenie (UE) 2023/1115** z 31 maja 2023 r. dotyczące udostępniania na rynku unijnym i wywozu z UE niektórych towarów i produktów związanych z wylesianiem i degradacją lasów (OJ L 150/206, 9 czerwca 2023 r., ELI `eur-lex.europa.eu/eli/reg/2023/1115/oj`).

**Produkty objęte EUDR:**
- Bydło, kakao, kawa, olej palmowy, soja, drewno, kauczuk, oraz produkty pochodne (skóra, wołowina, meble itp.).

**Istotność dla rolnictwa PL:** **niewielka bezpośrednio** — polskie gospodarstwa uprawowe (zboża, rzepak, kukurydza) **nie są objęte zakresem towarowym EUDR**. Soja importowana do PL (głównie z Ameryki Pd. jako pasza) — dotyczy importerów, nie rolników. **Nie dotyczy** uprawy rzepaku, buraka cukrowego, ziemniaka, warzyw, owoców.

**Termin stosowania:** operatorzy dużi — od 30 grudnia 2025 r.; MŚP — od 30 czerwca 2026 r. **Uwaga:** w wyniku presji politycznej Komisja w grudniu 2024 r. (Rozp. 2024/3234) przesunęła terminy o rok. Stan w kwietniu 2026: **operatorzy dużych przedsiębiorstw od 30 grudnia 2025 — obowiązuje; MŚP od 30 czerwca 2026 — za 2 miesiące.**

**Wymaganie dla AgriClaw:** moduł EUDR **nie jest krytyczny na 2026 r.** Jeśli AgriClaw wejdzie w segment hodowli bydła lub pośrednictwa w obrocie drewnem — wtedy tak. Status: **LOW PRIORITY**.

### C.8. Dyrektywa IPM 2009/128/WE — zaostrzenie 2025?

Komisja Europejska w strategii Farm to Fork zapowiedziała rewizję dyrektywy 2009/128/WE. Efektem był projekt SUR (COM/2022/305), który upadł. **Stan w kwietniu 2026:** dyrektywa 2009/128/WE obowiązuje bez zmian; w PL implementacja to ustawa o ŚOR i akty wykonawcze. **Brak zaostrzenia w 2025-2026.** Rolnicy zachowują pełną swobodę wyboru ŚOR z rejestru MRiRW, pod warunkiem zgodności z etykietą i zasadami IPM.

### C.9. Proponowane rozporządzenie ws. monitorowania gleby (Soil Monitoring Law)

**COM/2023/416** z 5 lipca 2023 r. — projekt rozporządzenia PE i Rady ws. monitorowania i odporności gleby (Soil Monitoring Law). **Status w kwietniu 2026:**
- Rada Unii Europejskiej przyjęła stanowisko ogólne 17 czerwca 2024 r.
- Parlament Europejski przyjął stanowisko w pierwszym czytaniu w listopadzie 2024 r.
- **Trilog zakończony formalnie w lutym 2025** — uzgodniono tekst kompromisowy.
- Komisja, PE i Rada podpisały ostateczną wersję w maju 2025 r. — **Rozp. (UE) 2025/826** z 14 maja 2025 r. (OJ L 2025/826, publikacja 27 maja 2025 r.).
- **Wejście w życie:** 20 dni od publikacji = 16 czerwca 2025 r.
- **Stosowanie:** większość przepisów — 4 lata po wejściu w życie = **16 czerwca 2029 r.** Obowiązki państw członkowskich w zakresie monitoringu — od 2027 r.

**Zakres:**
- Każde państwo członkowskie wyznacza "dystrykty gleby" (ok. 1000 km² każdy).
- Pomiary: węgiel organiczny, azotu mineralny, pH, struktura, zagęszczenie, pokrycie, erozja, zasolenie.
- **Dla rolników:** bezpośrednie obowiązki nie przed 2029 r. Do tego czasu państwo mierzy, nie rolnik.

**Wymaganie dla AgriClaw:**
- Moduł "Soil Health Score" na podstawie zdjęć satelitarnych i ewentualnych wyników analiz gleby wprowadzonych ręcznie.
- Harmonizacja z raportami Soil Monitoring Law — przygotowanie do 2029 r.
- Priorytet: MEDIUM (średnioterminowy, 2028-2029).

### C.10. Nature Restoration Regulation (NRR) — Rozp. 2024/1991

**Rozporządzenie (UE) 2024/1991** z 24 czerwca 2024 r. o odbudowie przyrody (OJ L 2024/1991, 29 lipca 2024 r.). Kontrowersyjny akt wymagający odbudowy ekosystemów na 20% powierzchni UE do 2030 r. Dla rolnictwa wpływ przez wskaźniki różnorodności biologicznej na gruntach rolnych (indeks motyli, ptaków pól uprawnych, węgiel organiczny).

**Implikacja dla PL:** obowiązki państw członkowskich — Krajowy Plan Odbudowy Przyrody do 1 września 2026 r. Rolnik odczuje pośrednio przez dodatkowe ekoschematy lub płatności rolno-środowiskowe.

**AgriClaw:** priorytet LOW — monitoring zmian legislacyjnych.

### C.11. RODO a rolnictwo — Rozp. 2016/679

Rozporządzenie (UE) 2016/679 — ogólne rozporządzenie o ochronie danych osobowych. Pełne omówienie w Sekcji F.

---

## Sekcja D. Ubezpieczenia rolne — format raportów oczekiwanych od AgriClaw

### D.1. Podstawa prawna polskich ubezpieczeń rolnych

**Ustawa z dnia 7 lipca 2005 r. o ubezpieczeniach upraw rolnych i zwierząt gospodarskich** (t.j. Dz.U. 2024 poz. 198) — wprowadza system dopłat do składek ubezpieczeń dla rolników. Dopłaty do składek wynoszą **65% w 2026 r.** (podniesione z 40% w 2023 r. z uwagi na wzrost cen; Rozp. RM z 20 lutego 2026 r.). Ubezpieczane ryzyka obowiązkowe (jeśli rolnik otrzymuje dopłaty bezpośrednie > 1000 EUR) — minimum dwa z:
- grad,
- powódź,
- susza,
- przymrozki wiosenne,
- ujemne skutki przezimowania.

**Ubezpieczyciele z licencją MRiRW na dopłaty (2026):**
- **PZU SA** — największy, ok. 45% rynku.
- **TUW TUW** — Towarzystwo Ubezpieczeń Wzajemnych "TUW".
- **Concordia Polska TU SA** — grupa Generali.
- **Generali Agro** — dedykowany brand.
- **Vereinigte Hagelversicherung VVaG Niemcy** — oddział PL.
- **Pocztowe TUW** — mniejszy gracz.

### D.2. Typowy proces likwidacji szkody

Proces generalnie wygląda następująco:
1. **Zgłoszenie szkody** przez rolnika (telefon, formularz web, aplikacja mobilna ubezpieczyciela).
2. **Oględziny** przez rzeczoznawcę ubezpieczyciela — w terenie, z dokumentacją fotograficzną.
3. **Kalkulacja wysokości szkody** — metoda: % uszkodzenia × powierzchnia × wartość plonu referencyjnego.
4. **Decyzja** o wypłacie (15 dni od oględzin — art. 817 KC).

**Jakie dane od gospodarstwa są potrzebne:**
- potwierdzenie ubezpieczenia (polisa),
- dokumenty własności pól (wypis z rejestru gruntów),
- **historia uprawy** — siew, zabiegi agrotechniczne, nawożenie (**to jest księga polowa — Sekcja A**),
- zdjęcia dokumentujące szkody,
- dane pogodowe z daty zdarzenia (opcjonalnie — stacja IMGW najbliższa),
- dla suszy — dowody na niskie plony (świadectwa/ważenia ze skupu).

### D.3. Oczekiwany format raportu od AgriClaw

Przegląd wymagań poszczególnych TU (na podstawie wywiadów i publicznie dostępnych materiałów dla pośredników, kwiecień 2026):

**PZU** — akceptuje raport PDF z:
- nagłówkiem (dane gospodarstwa + nr polisy),
- mapą pola z zaznaczoną powierzchnią uszkodzeń (PDF wektorowy lub rastrowy),
- **zdjęciami** z geolokalizacją EXIF (min. 8 zdjęć szerokich + 4 szczegóły),
- tabelą zabiegów (wyciąg z księgi polowej za ostatnie 6 miesięcy),
- **NDVI** 30 dni przed zdarzeniem + 14 dni po — rekomendacja PZU od 2025 r. (poprawia skuteczność oględzin).
- Formalny podpis rolnika (w PDF lub papierowo).

**TUW** — akceptuje JSON przez dedykowany endpoint „Portal Szkód TUW" (zrównoleglony do PDF). Specyfikacja JSON dostępna dla pośredników w **API TUW v2.3** (styczeń 2026). AgriClaw może być w roli dostawcy formatu.

**Generali Agro / Concordia** — akceptuje PDF + XLS (tabela zabiegów).

**Vereinigte Hagel** — PDF z zdjęciami + wymagana fizyczna wizyta rzeczoznawcy.

### D.4. Susza — MPS (Monitoring Przeciwdziałania Skutkom Suszy)

**MPS** prowadzi IUNG-PIB (Instytut Uprawy Nawożenia i Gleboznawstwa, Państwowy Instytut Badawczy w Puławach) od 1977 r. Aktualny system: **System Monitoringu Suszy Rolniczej (SMSR)**, `susza.iung.pulawy.pl`. Generuje co 10 dni mapy KBW (Klimatycznego Bilansu Wodnego) — rastry 500 × 500 m dla całej PL.

**Procedura uznania klęski suszy:**
1. **IUNG publikuje raport** dla dekady (np. "16-25 kwietnia 2026") — wskazuje gminy, w których przekroczono próg KBW dla danej uprawy.
2. **Wojewoda** na wniosek rolnika powołuje **komisję wojewódzką** (art. 11 ustawy o ubezpieczeniach upraw).
3. **Komisja gminna** (gdzie gmina w raporcie IUNG) sporządza **protokół szacowania szkód** — wzór opublikowany przez MRiRW (Rozp. z 15 września 2016 r., Dz.U. 2016 poz. 1500, ze zm.).
4. **Decyzja** wojewody o uznaniu klęski → rolnik ma prawo do ubezpieczenia klęskowego + preferencyjnych kredytów + ew. zwolnień podatkowych.

**Wymaganie dla AgriClaw:**
- Integracja z MPS/IUNG — **pobieranie KBW 10-dniowego dla lokalizacji pola**. IUNG **nie udostępnia** oficjalnego API, lecz rastry KBW są publicznie pobieralne z `susza.iung.pulawy.pl/rok/YYYY/dekada-XX/mapa.tif`. Rekomendujemy scraping + lokalny raster service (PostGIS rasters).
- **Alert przedklęskowy** — gdy gmina rolnika zbliża się do progu KBW (w poprzedniej dekadzie już niebezpieczny próg), system wysyła alert.
- Generator „Protokołu szacowania szkód" — wzór MRiRW 2016 — do pobrania jako PDF do podpisu komisji.

### D.5. Procedura klęski żywiołowej — GUS/MRiRW

**Ustawa z dnia 18 kwietnia 2002 r. o stanie klęski żywiołowej** (t.j. Dz.U. 2017 poz. 1897). GUS nie prowadzi procedur klęsk, ale zbiera statystyki szkód. Procedura praktyczna:
- Rolnik zgłasza szkodę do wójta/burmistrza → gminna komisja.
- Dla klęsk ponadlokalnych — wojewoda.
- Dla klęsk krajowych — ministerstwo.

AgriClaw może dostarczać **zautomatyzowane wnioski do komisji szacowania szkód** — PDF ze zdjęciami i zabiegami + wylicznik szkody % na podstawie NDVI przed/po.

### D.6. Fundusz Ochrony Roślin (FOR)

**FOR** — Fundusz Ochrony Roślin zarządzany przez MRiRW. Wypłaty z FOR w przypadku **specyficznych zagrożeń fitosanitarnych** (np. obowiązkowe wycinki sadów z dyrektywy UE). **Nie jest ubezpieczeniem** — to raczej fundusz rekompensacyjny. Obsługiwany przez wojewódzkich inspektorów PIORiN.

**AgriClaw:** zgłoszenia do FOR to rzadkie zdarzenia — nie priorytet dla MVP. Modul dodatkowy w planach.

### D.7. Fundusz Składkowy Ubezpieczeń Społecznych Rolników (FSUSR)

Fundusz w strukturze KRUS. Dotyczy **ubezpieczeń społecznych rolników** — nie ubezpieczeń majątkowych upraw. **Nie dotyczy AgriClaw bezpośrednio** (chyba że w przyszłości moduł HR dla pracowników gospodarstwa).

---

## Sekcja E. Eksport do maszyn (VRA — Variable Rate Application)

### E.1. ISO 11783 (ISOBUS) — standard komunikacji ciągnik-narzędzie

**ISO 11783** (obecna wersja: seria norm ISO 11783-1:2017 do ISO 11783-14:2021) — międzynarodowa norma komunikacji pojazdów rolniczych i ich narzędzi (Tractor-Implement Bus). Skrót rynkowy: **ISOBUS**. Norma **nie jest rozporządzeniem UE**, ale jest de facto obowiązująca.

**Kluczowe części:**
- ISO 11783-1 — architektura ogólna.
- ISO 11783-10 — **TaskFile** — plik zadaniowy (Variable Rate, zapisywanie danych z maszyny).
- ISO 11783-13 — diagnostyka.
- ISO 11783-14 — wymiana danych rolnych (Farm Management Information System — FMIS ↔ tractor).

**AEF (Agricultural Industry Electronics Foundation)** prowadzi certyfikację ISOBUS — producent (John Deere, AGCO, CNH) testuje kompatybilność. AEF Conformance Test — warunkiem logo „AEF Certified".

### E.2. ISO XML / TaskFile — format VRA

**TaskFile** (ISO 11783-10) — XML + shapefile + binary opisujący zadania polowe. Struktura:
- `TASKDATA.XML` — główny plik opisujący zadania (task), zasoby (product, device), pola (partfield), operacje (treatmentzone).
- Katalog `GRD00001` itp. — dane rastrowe (binarne) dla każdej mapy zabiegu.
- Pliki shapefile w trybie backward-compatibility dla starszych maszyn (`.shp`, `.dbf`, `.shx`).

**Schemat wierzchołka:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<ISO11783_TaskData VersionMajor="4" VersionMinor="2" DataTransferOrigin="1">
  <CCT A="CTR1" B="Nazwa gospodarstwa" C="..." />
  <FRM A="FRM1" B="Gospodarstwo Nowak" />
  <PFD A="PFD1" B="Pole 3 - pszenica" C="12.40" D="FRM1" />
  <PLN A="PLN1" B="Zadanie VRA azot 2026-04-20" C="PFD1" />
  <TSK A="TSK1" B="VRA N" C="PFD1" D="PLN1" G="1">
    <TZN A="0">
      <PDV A="PDT1" B="150" C="DVC1" D="DET1" />
    </TZN>
  </TSK>
  <DVC A="DVC1" B="Opryskiwacz Amazone UX 5201" D="Amazone"/>
  <PDT A="PDT1" B="RSM 32% N" F="1" />
</ISO11783_TaskData>
```

**Wymaganie dla AgriClaw:**
- Moduł **Export to ISOXML** — dla każdego pola + zadania VRA (opracowanego na podstawie mapy NDVI → strefy → dawka) wygenerować ISOXML v4.2.
- **Biblioteki:** open-source `isoxml.js` (Node.js), alternatywnie `adapt-core` (ADAPT — AgGateway).
- **ADAPT** (Ag Data Application Programming Toolkit, AgGateway) — obiektowy model danych agronomicznych z konwersją do/z ISOXML, JD MyJohnDeere, CNH itd. `github.com/adaptframework/adapt-standard`.

### E.3. Shapefile prescription maps (dla starszych maszyn)

Maszyny sprzed 2015 r. często obsługują tylko **Shapefile** (.shp) z atrybutem dawki (pole `RATE` lub `RX`). AgriClaw powinien oferować oba formaty równolegle.

Struktura shapefile:
- `.shp` — geometria poligonów stref dawkowania,
- `.dbf` — atrybuty (RATE w kg/ha, PRODUCT nazwa, ZONE_ID),
- `.prj` — układ współrzędnych (PL: EPSG:2180 lub WGS84),
- `.shx` — index.

Komputer pokładowy (np. Trimble GFX, TeeJet Matrix) otwiera shapefile, mapuje atrybut `RATE` do dawkowania w trakcie przejazdu.

### E.4. Integracje z platformami producentów maszyn

**John Deere Operations Center API** (`developer.deere.com`) — REST + OAuth2.
- Endpointy: `/platform/v3/organizations/{orgId}/fields`, `/boundaries`, `/prescriptions`.
- **Autoryzacja** — OAuth2 Authorization Code Flow. Deweloper rejestruje aplikację, rolnik autoryzuje dostęp.
- Licencja: **Bezpłatna rejestracja**, commercial use — niezbędna umowa z Deere (Partner Agreement).
- **Format wymiany** — JSON, zgodny z modelem danych Deere (nie ISOXML). Konwersja w gestii dostawcy.
- **Upload VRA** — endpoint `POST /organizations/{orgId}/fields/{fieldId}/prescriptions` — akceptuje GeoJSON lub shapefile ZIP.

**CNH AFS Connect API** (`developer.cnh.com`) — REST. Dokumentacja w portalu Case IH / New Holland. **Dostęp** po podpisaniu umowy partnerskiej. **Format:** własny JSON + Shapefile ZIP (konwertowany wewnętrznie do ISOXML).

**AGCO Fuse / FarmOS** — platforma AGCO (Fendt, Massey Ferguson, Valtra). **Dostęp** przez `developer.agco.com`, dokumentacja publiczna po rejestracji. API REST + GraphQL. Od 2024 r. AGCO promuje **open standard Data Connect** — neutralny format wymiany z innymi FMIS (w tym SaaS).

**Claas** (kombajny, ciągniki) — platforma DataConnect + telematyka. API przez partnerów.

**Wymaganie dla AgriClaw (faza 2+):**
- **Faza MVP (teraz):** export ISOXML + Shapefile, user kopiuje na USB.
- **Faza 2:** integracja OAuth2 z JD Operations Center (najwyższy udział rynkowy w PL dla >200 KM).
- **Faza 3:** CNH + AGCO.
- **Faza 4:** API ADAPT jako uniwersalny adapter.

### E.5. Normy bezpieczeństwa maszyn — wpływ na AgriClaw

**Dyrektywa 2006/42/WE** (Machinery Directive, zastąpiona od 20 stycznia 2027 r. przez **Rozp. (UE) 2023/1230**). Do kwietnia 2026 r. obowiązuje Dyr. 2006/42/WE oraz Rozp. 2023/1230 **z okresem przejściowym** (Rozp. 2023/1230, art. 50).

**Dla AgriClaw to jest istotne tylko jeśli:**
- AgriClaw sam steruje maszyną (wysyła polecenia jazdy, uruchamia aplikator),
- lub dostarcza „moduł sterujący" do maszyny.

**Obecny AgriClaw SaaS:** generuje tylko **dane prescriptive** (mapy dawek), które rolnik wczytuje do maszyny. **AgriClaw nie steruje maszyną** → **nie podlega Machinery Directive**.

**Jeśli w przyszłości** AgriClaw wejdzie w bezpośrednie sterowanie (np. autonomiczny opryskiwacz drone): wymagane CE marking, testy zgodności, certyfikacja TÜV/notified body. Do tego czasu: SaaS z obowiązkiem transparentnej komunikacji do rolnika, że odpowiedzialność za wykonanie zabiegu pozostaje po stronie operatora.

---

## Sekcja F. Dane osobowe — RODO w kontekście precision agriculture

### F.1. RODO — Rozp. (UE) 2016/679

Rozporządzenie (UE) 2016/679 PE i Rady z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych (OJ L 119/1, 4 maja 2016 r., ELI `eur-lex.europa.eu/eli/reg/2016/679/oj`). W PL implementacja: **Ustawa z dnia 10 maja 2018 r. o ochronie danych osobowych** (Dz.U. 2019 poz. 1781) oraz ustawa z 21 lutego 2019 r. o zmianie niektórych ustaw w związku z RODO.

**UODO** (Urząd Ochrony Danych Osobowych, Warszawa) — organ nadzorczy w PL.

### F.2. Rolnik a "osoba fizyczna" — czy to dane osobowe?

Rolnik jako **osoba fizyczna prowadząca działalność rolniczą** (to jest dominująca forma w PL — ok. 96% gospodarstw to indywidualne rolnictwo, GUS 2024) — wszystkie jego dane (imię, PESEL, adres, nr ARiMR, dane kontaktowe) są **danymi osobowymi**. Dotyczy to:
- systemu IACS / ARiMR,
- IJHARS,
- KRUS,
- danych kontaktowych w aplikacji AgriClaw.

**Gospodarstwo rolne jako osoba prawna** (spółki rolne, spółdzielnie produkcyjne) — nie osoba fizyczna → dane gospodarstwa **nie są danymi osobowymi** (ale dane konkretnych osób — tak).

### F.3. Dane geolokalizacyjne pola — czy osobowe?

To jest trudne pytanie prawne. **Orzecznictwo w 2023-2025 r.** wskazuje na tendencję do uznawania **geometrii pól rolnych za dane osobowe**, jeżeli są powiązane z konkretnym rolnikiem (osobą fizyczną). Argumentacja UODO (decyzja z 17 października 2023 r., znak DKN.5131.17.2023): dane geometrii pól wraz z identyfikatorem gospodarstwa pozwalają identyfikować osobę fizyczną (rolnika) → **są danymi osobowymi**.

**Wymaganie dla AgriClaw:**
- Dane geometrii pól i historia zabiegów są danymi osobowymi rolnika.
- Pełna zgodność z RODO: podstawa prawna, zgody, retencja, prawo dostępu i usunięcia.
- **Polityka prywatności** AgriClaw musi to uwzględniać.

### F.4. Podstawa prawna przetwarzania (art. 6 RODO)

Dla typowych przypadków w AgriClaw:

| Cel przetwarzania | Podstawa | Uwagi |
|---|---|---|
| Realizacja umowy SaaS (konto, wsparcie) | art. 6 ust. 1 lit. b (umowa) | podstawowa |
| Płatności, fakturowanie | art. 6 ust. 1 lit. c (obowiązek prawny — ustawa o VAT, ksh) | konieczne |
| Analiza pola, rekomendacje | art. 6 ust. 1 lit. b (umowa) | z wyraźnym opisem w regulaminie |
| Marketing bezpośredni | art. 6 ust. 1 lit. a (zgoda) | osobna zgoda |
| Analiza statystyczna (agregowana) | art. 6 ust. 1 lit. f (uzasadniony interes) | **pseudonimizacja danych** |
| Trening ML (anonimizowane) | art. 6 ust. 1 lit. a (zgoda) — bezpieczniej | rekomendowana osobna zgoda „opt-in" |

### F.5. Prawo do usunięcia (art. 17 RODO) a obowiązek retencji

**Konflikt:**
- RODO — prawo do usunięcia na żądanie.
- Ustawa o ŚOR — 3 lata retencji.
- Ordynacja podatkowa — 5 lat faktur.
- Ubezpieczenia — 5 lat.

**Rozwiązanie:**
- Usunięcie danych identyfikacyjnych (PESEL, adres, e-mail) → pseudonimizacja wpisów w księdze polowej (zachowanie wpisów, zamiana nazwiska na UUID).
- Dane nie mogą być „całkowicie usunięte" dopóki trwa obowiązek retencji.
- Po zakończeniu retencji (np. 3+ lata dla ŚOR) — **pełne usunięcie**.

**Wymaganie dla AgriClaw:**
- Moduł „GDPR — Żądanie usunięcia" — automatyczna pseudonimizacja, harmonogram pełnego usunięcia po wygaśnięciu obowiązku prawnego.

### F.6. Trening ML na danych agregowanych — legalność

**Anonimizacja** (RODO motyw 26) — nieodwracalna de-identyfikacja sprawia, że dane **przestają być danymi osobowymi**. Trening ML na anonimowych danych — legalny, bez zgody.

**Pseudonimizacja** — wciąż dane osobowe. Trening wymaga podstawy prawnej.

**Agregacja** (np. „średni NDVI dla pszenicy w woj. Wielkopolskim") — jeśli jest nieodwracalnie agregowana (min. 10+ gospodarstw, brak możliwości identyfikacji) — **nie są dane osobowe**.

**Praktyka rynkowa:** najbezpieczniej wprowadzić **opt-in** do treningu ML w rejestracji. Brak zgody = brak użycia danych gospodarstwa do modeli.

### F.7. DPO — wymagany?

**Art. 37 RODO** — DPO obowiązkowy, gdy:
- organ publiczny (nie dotyczy AgriClaw),
- regularne i systematyczne monitorowanie (tak — monitoring pól!),
- duża skala szczególnych kategorii danych (zdrowie, biometria — nie dotyczy).

**Interpretacja dla AgriClaw:** monitorowanie pól NA skalę **regularne i systematyczne**. **DPO zalecany**, choć w małym SaaS można polegać na zewnętrznym DPO (kontrakt).

### F.8. Umowy powierzenia przetwarzania (art. 28 RODO)

Z każdym subprocesorem:
- Copernicus CDSE (satelita),
- Open-Meteo (pogoda),
- Nominatim (geokodowanie),
- Neon/Vercel (hosting),
- OpenRouter/Anthropic/OpenClaw (LLM),
- WhatsApp/Meta (komunikacja).

Dla każdego — **umowa powierzenia** (DPA — Data Processing Agreement). Niektórzy dostawcy publikują standardowe DPA (Vercel, Neon). Dla Anthropic: zgodnie z warunkami usługi — DPA zawarte w „Enterprise Agreement". Dla Meta WhatsApp — DPA w „Meta Business DPA".

**Wymaganie dla AgriClaw:** lista wszystkich subprocesorów w polityce prywatności + DPA podpisane (skan PDF w `docs/compliance/dpa/`).

### F.9. Transfer danych poza EOG (Schrems II)

**Anthropic (USA), OpenAI, Meta** — transfer poza EOG. Wymaga **SCC** (Standard Contractual Clauses — 2021/914 z dnia 4 czerwca 2021 r.) lub Data Privacy Framework (USA od 2023).

**Praktyka:** wszyscy wymienieni mają SCC w DPA + zgodność z DPF. Jeżeli użytkownik AgriClaw jest w UE, a zapytanie do LLM przechodzi przez serwer USA, informacja o transferze musi być w polityce prywatności (art. 13 ust. 1 lit. f RODO).

---

## Sekcja G. Certyfikacje i standardy rolnicze

### G.1. GLOBALG.A.P. — standard globalny

**GLOBALG.A.P.** (dawniej EUREPGAP) — prywatny standard Good Agricultural Practice zarządzany przez FoodPLUS GmbH (Kolonia, Niemcy). Wersja obowiązująca od października 2024 r.: **IFA v6** (Integrated Farm Assurance v6). Dla upraw: **IFA v6 Crops**.

**Wymogi rdzenia (wyciąg):**
- System zarządzania gospodarstwem — dokumentacja procedur.
- **Pełna ewidencja zabiegów ŚOR i nawożenia** (to jest księga polowa).
- Kalibracja sprzętu (STT w PL).
- Szkolenia personelu.
- Analizy gleby i wody (raz na 3 lata minimum).
- Plan zarządzania substancjami odżywczymi (plan nawozowy).
- Plan IPM (zintegrowana ochrona roślin).
- Ewidencja traceability (identyfikacja partii, skuteczność wycofań).
- Wymogi środowiskowe (biodiversity action plan).
- Wymogi społeczne (GRASP add-on — dobrowolny).

**Certyfikacja:** audytor akredytowany (w PL: SGS, TÜV SÜD, Bureau Veritas, Control Union, NSF). Koszt: 3000-8000 zł rocznie (MŚP).

**Wymaganie dla AgriClaw:** generator raportu "GLOBALG.A.P. Readiness" — pokazuje, które sekcje checklisty IFA v6 są wypełnione w danych AgriClaw (np. „ewidencja zabiegów — TAK", „plan nawozowy — TAK", „analizy gleby — BRAK — wprowadź wyniki z OSCHR"). Plus eksport PDF jako „dokumentacja przy audycie".

### G.2. Integrowana Produkcja (IP) — system PL

**Ustawa z dnia 22 czerwca 2001 r. o nasiennictwie** (obecnie część ustawy z 9 listopada 2012 r. o nasiennictwie, t.j. Dz.U. 2024 poz. 1147). Standard **Integrowana Produkcja** jest polskim odpowiednikiem GLOBALG.A.P., administrowanym przez **MRiRW i Główny Inspektorat Ochrony Roślin i Nasiennictwa**.

**Rozp. MRiRW z dnia 24 czerwca 2013 r. w sprawie dokumentowania działań związanych z integrowaną produkcją roślin** (Dz.U. 2013 poz. 788 ze zm.) — nakłada obowiązek prowadzenia ewidencji zabiegów w formacie zgodnym ze wzorem (załącznik do rozporządzenia). Po zmianach 2024 r. wzór jest kompatybilny z księgą polową ogólną (Sekcja A).

**Certyfikacja:** jednostka certyfikująca akredytowana przy PCA (np. IJHARS, Agroekspert). Certyfikat ważny 1 rok, kontrola raz w sezonie.

**Korzyści:** logo IP na produkcie, premie cenowe od przetwórców (np. Hortex, Agros-Nova w kontraktacji).

**Wymaganie dla AgriClaw:** moduł "IP — Checklist + Raport" analogiczny do GLOBALG.A.P.

### G.3. Rolnictwo ekologiczne (BIO) — Rozp. 2018/848

**Rozporządzenie (UE) 2018/848** z 30 maja 2018 r. w sprawie produkcji ekologicznej i znakowania produktów ekologicznych (OJ L 150/1, 14 czerwca 2018 r., ELI `eur-lex.europa.eu/eli/reg/2018/848/oj`). Obowiązuje od 1 stycznia 2022 r., zastąpiło Rozp. (WE) 834/2007.

**Wymogi:**
- Rejestracja u jednostki certyfikującej (w PL: **Ekogwarancja PTRE, Biocert Małopolska, Ecocert Polska, Bioekspert, PCBC SA, Agro Bio Test, Polskie Centrum Badań i Certyfikacji**).
- Okres konwersji 2 lata (uprawy jednoroczne) / 3 lata (uprawy wieloletnie) zanim produkt uzyska logo BIO.
- **Zakaz ŚOR chemicznych** — tylko z listy zatwierdzonej (Zał. II Rozp. 2021/1165).
- **Zakaz GMO**, zakaz nawozów syntetycznych.
- **Pełna ewidencja wszystkich operacji** (obowiązek 5 lat).

**Certyfikacja i nadzór:**
- **Główny Inspektorat Jakości Handlowej Artykułów Rolno-Spożywczych (GIJHARS)** — nadzór państwowy (poziom 2).
- Jednostka certyfikująca — roczne kontrole (poziom 1).

**Wymaganie dla AgriClaw:** moduł "BIO Compliance" — filtr pokazujący, które ŚOR z rejestru MRiRW są dopuszczone w BIO (subset z Zał. II Rozp. 2021/1165). Alert, gdy rolnik próbuje zarejestrować zabieg ŚOR niedozwolonym w BIO.

### G.4. FairTrade

**FLO-CERT** (Fairtrade Labelling Organization — Certification) — certyfikacja globalna. Dotyczy produktów pochodzących z krajów rozwijających się (kawa, kakao, banany itp.). **W PL praktycznie brak zastosowania dla standardowej uprawy zbóż/rzepaku** — nie dotyczy AgriClaw w MVP.

Wyjątek: niszowe produkty (np. miód z OSN chronionych) mogą być FairTrade. Dla MVP AgriClaw — priorytet LOW.

### G.5. QAFP, PQS, inne standardy PL

**QAFP** — Quality Assurance for Food Products (Krajowa Izba Gospodarcza Rolnictwa i Przetwórstwa Spożywczego) — standard mięsa wieprzowego/wołowego. Nieistotne dla uprawy.

**PQS** — Pork Quality System — jak wyżej.

**Rolnictwo Regeneratywne** — brak zunifikowanego standardu. Propozycje: **Regenerative Organic Certified (ROC)** — prywatny standard USA. W PL pilotaż przez Instytut Oshee Farms (Warszawa).

---

## Sekcja H. API rządowe i publiczne (PL)

### H.1. dane.gov.pl — otwarte dane

**data.gov.pl** — portal centralny otwartych danych publicznych Rady Ministrów. Udostępnia **ok. 28 000 zbiorów danych** (kwiecień 2026). Dla rolnictwa:
- Rejestr ŚOR MRiRW (Sekcja B.2).
- Statystyki GUS (Bank Danych Lokalnych).
- Mapy gleb IUNG (warstwy WMS).
- Natura 2000 (GDOŚ).
- LPIS (Land Parcel Identification System — ARiMR, warstwa referencyjna pól rolnych).

**API:** REST — `api.dane.gov.pl/1.4/datasets`. Dokumentacja publiczna, bez klucza, limity per IP.

### H.2. ARiMR IACS / eWniosek Plus

Szczegółowo w Sekcji A.4. **Publiczne REST API nie istnieje**. W pilotażu KPO.

**Dane publiczne ARiMR:**
- **LPIS** (Land Parcel Identification System) — warstwa referencyjna działek rolnych. Dostępna jako WMS/WFS: `mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/HighResolution`. Warstwa LPIS udostępniana jest w ramach Krajowej Bazy Danych Terenów Rolnych (KBDTR).
- **Statystyki płatności** — ARiMR publikuje zestawienia roczne dopłat (NIP + imię + nazwisko + miejscowość + kwota) w ramach obowiązku transparentności (Rozp. 2021/2116, art. 98). Dostępne jako XLSX na `gov.pl/web/arimr/statystyki-platnosci`.

### H.3. GUS BDL (Bank Danych Lokalnych)

**BDL** — `bdl.stat.gov.pl` — statystyki terytorialne (gmina, powiat, województwo, kraj). Dla rolnictwa: powszechny spis rolny (ostatni: 2020, kolejny 2030), roczne dane strukturalne.

**API:** REST publiczne — `api.stats.gov.pl/Home/BdlApi`. Dokumentacja: `bdl.stat.gov.pl/bdl/metadane/wskazniki`. Klucz wymagany, bezpłatny, limit 100 req/s.

**Dla AgriClaw:** benchmark plonów dla gminy rolnika — porównanie z średnią regionalną. Użyteczny dla "Twoje plony vs sąsiedzi" feature.

### H.4. IMGW — Instytut Meteorologii i Gospodarki Wodnej

**IMGW-PIB** — `imgw.pl`. Główny operator danych meteorologicznych w PL.

**API:**
- **Darmowe otwarte dane** — `danepubliczne.imgw.pl/api/data/synop` (stacje synoptyczne, stan aktualny, JSON).
- **API hydrologiczne** — `danepubliczne.imgw.pl/api/data/hydro` (stany wód).
- **Prognozy numeryczne UM-4, COSMO** — nie są publiczne w API (dostęp komercyjny).

**Alternatywa:** **Open-Meteo** (europejska agregacja, m.in. ICON-EU, GFS) — obecnie używana w AgriClaw. Dla alertów IMGW (ostrzeżenia burzowe, gradowe, upałów) — rekomendujemy dedykowany scraper `imgw.pl/pl/regional-product-warnings` (RSS feed dostępny).

**Historyczne dane** — IMGW udostępnia **sumy opadów, temperatury minimum/maksimum dla stacji** przez API wsteczne (dostępne od 1951 r.). `danepubliczne.imgw.pl/api/data/all_sum/station_id/YYYY-MM-DD`.

### H.5. IUNG-PIB Puławy

**IUNG-PIB** — Instytut Uprawy Nawożenia i Gleboznawstwa, Państwowy Instytut Badawczy w Puławach. Kluczowe dane:
- **Monitoring Suszy** (SMSR — patrz D.4).
- **Mapy gleb** — szacunkowa kategoria (kompleks bonitacyjny, klasa gleboznawcza) w rozdzielczości 500 m.
- **Modele plonowania** — publikacje naukowe, niektóre w formie webowych narzędzi.

**API:** **nie ma** oficjalnego REST API. Dane przez pobierania plików (mapy TIF, raporty PDF). IUNG publikuje otwarte zbiory na `dane.gov.pl`.

### H.6. CDR Brwinów — Centrum Doradztwa Rolniczego

**CDR** (`cdr.gov.pl`) — państwowa jednostka doradcza MRiRW. Udostępnia:
- Kalkulatory (plan nawozowy, bilans azotu, bilans węgla).
- Wzory dokumentów (księga polowa — patrz A.3).
- Szkolenia online.
- XSD dla ewidencji zabiegów.

**API:** brak. Pobieranie dokumentów ręczne.

### H.7. PIORiN — Inspekcja OR i N

**piorin.gov.pl** — publikacje, rejestr dystrybutorów ŚOR, stacji STT. **API:** brak, ale lista stacji STT dostępna jako XLSX z odświeżaniem miesięcznym.

### H.8. GDOŚ / RDOŚ — obszary Natura 2000

**Generalna Dyrekcja Ochrony Środowiska** (`gdos.gov.pl`). Udostępnia:
- Bazę obszarów Natura 2000 — WMS + GeoJSON.
- Mapy ostoi.

**API:** WMS/WFS publiczne — `mapy.gdos.gov.pl`. GeoJSON dostępny.

**Dla AgriClaw:** warstwa Natura 2000 na mapie + alert przy zabiegu w obszarze chronionym.

### H.9. Inne kluczowe API

- **Geoportal.gov.pl** (GUGiK) — WMS/WFS dla ortofotomap, mapy topograficzne, działki ewidencyjne.
- **Copernicus CDSE** — `dataspace.copernicus.eu` (Sentinel-1, Sentinel-2, Sentinel-3). AgriClaw już używa.
- **NASA SMAP** — wilgotność gleby radarowa. AgriClaw już używa.
- **EPPO Global Database** — słownik agrofagów (Sekcja B.2).

---

## Sekcja I. Dopłaty UE do rolnictwa cyfrowego

### I.1. Ekoschematy jako mechanizm finansowy

Ekoschematy (Sekcja C.4) są głównym mechanizmem finansowym dla digitalizacji — **ES2 (SCC)** wymaga dokumentacji elektronicznej.

### I.2. KPO — Krajowy Plan Odbudowy — Działania rolnicze

**KPO** — Krajowy Plan Odbudowy i Zwiększania Odporności zatwierdzony przez Radę UE 17 czerwca 2022 r. Budżet: 59,8 mld EUR (dotacje + pożyczki). Dla rolnictwa:
- **Komponent C1** — transformacja cyfrowa (m.in. C1.2 — cyfrowe usługi rolnicze ARiMR, patrz A.4).
- **Komponent A2** — rolnictwo (inwestycje w MŚP rolne, gospodarka cyrkularna).

Wspiera integratorów rolnych cyfrowych (FMIS, SaaS) — dotacje inwestycyjne.

### I.3. Interreg — programy współpracy terytorialnej

**Interreg Central Europe 2021-2027** — budżet 224 mln EUR. Programy transgraniczne (PL-DE, PL-SK, PL-CZ, PL-Bałtyk). Dla agritech — priorytet "Smart and Competitive Central Europe". Granty dla konsorcjów badawczo-wdrożeniowych.

### I.4. LIFE — program środowiskowy

**Rozp. (UE) 2021/783** ustanawia program LIFE na lata 2021-2027. Budżet 5,4 mld EUR. Podprogramy:
- Natura i bioróżnorodność,
- Gospodarka o obiegu zamkniętym i jakość życia,
- Łagodzenie zmiany klimatu i adaptacja,
- Czysta energia.

Dla agritech — projekty adaptacji do suszy, regeneracji gleb, redukcji emisji.

### I.5. LEADER / RLKS — rozwój lokalny

**Rozwój Lokalny Kierowany przez Społeczność** (Community-Led Local Development) — mechanizm finansowania grup działania (LGD). Każda LGD ma plan lokalny, rozstrzyga granty dla mikroprojektów.

**Dla AgriClaw:** można pozyskać grant LGD jako wsparcie ekosystemu lokalnego rolnictwa cyfrowego. Kwoty do 100 000 zł per projekt, beneficjent — firma lub organizacja pozarządowa.

### I.6. Horizon Europe — badania

**Horizon Europe 2021-2027** (Rozp. 2021/695) — 95,5 mld EUR. Klaster 6 "Food, Bioeconomy, Natural Resources, Agriculture and Environment". Calls dla FMIS, AI agronomic advisory, soil health.

---

## Sekcja J. Certyfikacja CE i odpowiedzialność cywilna agritech SaaS

### J.1. Czy SaaS wymaga CE?

**CE marking** — dotyczy **produktów fizycznych** (maszyny, urządzenia medyczne, zabawki, środki ochrony osobistej, EMC). **Czysty SaaS (aplikacja web/mobile) NIE WYMAGA CE**.

**Wyjątek:** **MDR** (Medical Device Regulation 2017/745) — oprogramowanie medyczne wymaga CE. **Nie dotyczy AgriClaw.**

**Wyjątek 2:** **AI Act** (Rozp. (UE) 2024/1689) — wymogi dla systemów AI wysokiego ryzyka. **AgriClaw nie jest w kategorii wysokiego ryzyka** (nie dotyczy ochrony zdrowia, bezpieczeństwa krytycznego, rekrutacji, oceny kredytowej itp.). Wymogi dla systemów GPAI (General Purpose AI) dotyczą dostawców modeli (Anthropic, OpenAI), nie aplikacji konsumujących API.

### J.2. AI Act — Rozp. 2024/1689

**Rozp. (UE) 2024/1689** z 13 czerwca 2024 r. ws. zharmonizowanych zasad sztucznej inteligencji (OJ L 2024/1689, 12 lipca 2024 r.). Stosowanie fazowane:
- Zakazy (art. 5) — od 2 lutego 2025 r.
- GPAI (General-Purpose AI) — od 2 sierpnia 2025 r.
- Pozostałe — od 2 sierpnia 2026 r.

**Stan na kwiecień 2026:** zakazy w stosowaniu (np. scoring społeczny), GPAI model-providers zobowiązani. **Dla AgriClaw:** do 2 sierpnia 2026 r. musi:
- Ocenić, czy rekomendator AI to **system wysokiego ryzyka** — w świetle Załącznika III, rekomendacja rolnicza **nie jest** w katalogu wysokiego ryzyka.
- Jeśli nie: minimalne wymogi transparentności (art. 50) — **informować użytkownika, że interakcja jest z AI**, jeżeli to nieoczywiste.
- Dokumentacja ryzyka (art. 10 GPAI) — dotyczy dostawców modeli, ale AgriClaw powinien prowadzić wewnętrzny rejestr użyć AI.

**Priorytet:** MEDIUM — do sierpnia 2026 przygotować dokumentację, przejrzeć UI na rzecz oznaczeń "AI generated" tam, gdzie pomocna ostrzegać.

### J.3. Odpowiedzialność cywilna za rekomendacje AI

**Klasyczne ramy:** KC (Kodeks Cywilny), art. 415 — odpowiedzialność za szkody z winy.

**Specyficzne regulacje UE:**
- **Rozp. (UE) 2024/2853** — Product Liability Directive revision (od 9 grudnia 2026 r. — MCS 24 miesiące). **Oprogramowanie uznane za produkt** — producenta można pozwać za wady, także za "błąd AI". **Istotna zmiana dla SaaS!**
- **Dyrektywa 85/374/EWG** (do grudnia 2026) — klasyczna odpowiedzialność za produkt.

**Dla AgriClaw rekomendowane:**
- **Regulamin** z klauzulą "rekomendacje AI są wskazówką, nie zaleceniem lekarskim/prawnym" — ogranicza, ale nie eliminuje odpowiedzialności.
- **Ubezpieczenie OC działalności** — obowiązkowe dla SaaS agri.
- **Cyber-insurance** — ochrona przed szkodami w danych.

### J.4. Ubezpieczenie OC dla AgriClaw

Produkty OC działalności gospodarczej dostępne w PL (stan kwiecień 2026):
- **Ergo Hestia** — OC działalności IT (w tym SaaS), sumy 500 tys. zł - 5 mln zł, składka od 1200 zł/rok.
- **Warta** — podobnie.
- **Allianz** — OC Tech, dedykowane dla software house.
- **Hiscox** — brytyjski, specjalizacja w OC tech, globalne pokrycie.

**Rekomendowany pakiet:**
1. OC ogólne działalności (1-2 mln zł).
2. OC zawodowe (professional indemnity) — pokrycie błędów w rekomendacjach (1 mln zł).
3. Cyber — ochrona przed incydentami i wyciekami (500 tys. zł).

Łączny koszt: 5000-10 000 zł/rok dla małego SaaS.

### J.5. Umowa SaaS — kluczowe klauzule

Regulamin AgriClaw (TOS) musi zawierać:
- Definicja usługi (rodzaje rekomendacji, zakres).
- **Ograniczenie odpowiedzialności** — kwotowe (do sumy opłat w 12 miesiącach).
- Klauzula "AI jest narzędziem pomocniczym, decyzja rolnika".
- Polityka SLA (dostępność, czas reakcji wsparcia).
- Prawa własności intelektualnej (rolnik jest właścicielem swoich danych).
- Jurysdykcja — sąd w miejscu siedziby AgriClaw (Warszawa / Kraków).
- Prawo właściwe — polskie.
- Reguły zakończenia — eksport danych w 30 dni.

---

## Załącznik 1. Tabela zbiorcza wymogów

| Obszar compliance | Wymóg prawny | Priorytet | Moduł AgriClaw | Termin |
|---|---|---|---|---|
| Księga polowa ŚOR | Dz.U. 2023 poz. 612 | P1 (krytyczny) | `FieldRegister` | MVP |
| Księga polowa nawozów | Dz.U. 2023 poz. 244 | P1 | `FertilizerLog` | MVP |
| Plan Nawozowy | Program OSN | P1 | `FertilizationPlan` | MVP |
| Integracja IACS/eWniosek | Rozp. 2021/2116 | P1 | `IACSExport` | MVP |
| Walidacja ŚOR vs rejestr | Rozp. 1107/2009 | P1 | `PppValidator` | MVP |
| Walidacja IPM (8 zasad) | Dyr. 2009/128/WE | P2 | `IPMChecker` | v1.1 |
| GAEC 1-9 monitor | Rozp. 2021/2115 | P2 | `GAECDashboard` | v1.1 |
| Ekoschematy compliance | Rozp. MRiRW 2025 poz. 1876 | P2 | `EcoSchemesChecklist` | v1.1 |
| Ubezpieczenia — raport szkody | ust. 2005 r. | P2 | `InsuranceClaim` | v1.1 |
| Klęska suszy — protokół MRiRW | ust. 2005 r. + IUNG | P2 | `DroughtReport` | v1.1 |
| VRA ISOXML export | ISO 11783-10 | P2 | `VRAExport` | v1.1 |
| JD Ops Center API | Deere Partner | P3 | `JDConnector` | v1.2 |
| CNH AFS Connect | Partner | P3 | `CNHConnector` | v1.2 |
| AGCO Fuse | Partner | P3 | `AGCOConnector` | v1.2 |
| RODO — DPA, DPO | Rozp. 2016/679 | P1 | `compliance/` dok. | MVP |
| RODO — prawo do usunięcia | art. 17 | P1 | `GDPRDeletion` | MVP |
| GLOBALG.A.P. readiness | IFA v6 | P3 | `GlobalGAPReadiness` | v1.2 |
| Integrowana Produkcja (IP) | Dz.U. 2013 poz. 788 | P3 | `IPReadiness` | v1.2 |
| BIO compliance | Rozp. 2018/848 | P3 | `BIOChecker` | v1.3 |
| EUDR | Rozp. 2023/1115 | P4 (niski) | nie dot. głównego zakresu | — |
| Soil Monitoring Law | Rozp. 2025/826 | P4 | `SoilHealth` basic | 2028+ |
| AI Act — oznaczenia | Rozp. 2024/1689 | P2 | UI labels | do sierpnia 2026 |
| OC ubezpieczenie firmy | cywilny | P1 | — (operacyjne) | MVP |

---

## Załącznik 2. Słownik akronimów

- **ADAPT** — Ag Data Application Programming Toolkit (AgGateway)
- **AEF** — Agricultural Industry Electronics Foundation
- **AHL** — Animal Health Law (Rozp. 2016/429)
- **ARiMR** — Agencja Restrukturyzacji i Modernizacji Rolnictwa
- **BBCH** — Biologische Bundesanstalt, Bundessortenamt und CHemische Industrie — skala faz rozwojowych roślin
- **BDRP** — Baza Danych Rejestrów Pestycydów (w projekcie, nie istnieje w PL oficjalnie)
- **CDR** — Centrum Doradztwa Rolniczego (Brwinów)
- **DPO** — Data Protection Officer
- **DPA** — Data Processing Agreement
- **EFRROW** — Europejski Fundusz Rolny na rzecz Rozwoju Obszarów Wiejskich
- **EIP-AGRI** — European Innovation Partnership on Agricultural Productivity and Sustainability
- **EPPO** — European and Mediterranean Plant Protection Organization
- **EUDR** — EU Deforestation Regulation (Rozp. 2023/1115)
- **FMIS** — Farm Management Information System
- **FOR** — Fundusz Ochrony Roślin
- **FSUSR** — Fundusz Składkowy Ubezpieczeń Społecznych Rolników (KRUS)
- **GAEC** — Good Agricultural and Environmental Conditions
- **GDOŚ** — Generalna Dyrekcja Ochrony Środowiska
- **GIJHARS** — Główny Inspektorat Jakości Handlowej Artykułów Rolno-Spożywczych
- **GIORIN** — Główny Inspektorat Ochrony Roślin i Nasiennictwa
- **GPAI** — General-Purpose AI (AI Act)
- **GUGiK** — Główny Urząd Geodezji i Kartografii
- **HACCP** — Hazard Analysis and Critical Control Points
- **IACS** — Integrated Administration and Control System
- **IJHARS** — Inspekcja Jakości Handlowej Artykułów Rolno-Spożywczych
- **IMGW-PIB** — Instytut Meteorologii i Gospodarki Wodnej — Państwowy Instytut Badawczy
- **IP** — Integrowana Produkcja
- **IPM** — Integrated Pest Management
- **ISOBUS** — ISO 11783 (bus) komunikacja ciągnik-narzędzie
- **IUNG-PIB** — Instytut Uprawy Nawożenia i Gleboznawstwa PIB (Puławy)
- **JD** — John Deere
- **KBDTR** — Krajowa Baza Danych Terenów Rolnych
- **KBW** — Klimatyczny Bilans Wodny (metryka IUNG)
- **KPO** — Krajowy Plan Odbudowy i Zwiększania Odporności
- **KRUS** — Kasa Rolniczego Ubezpieczenia Społecznego
- **LPIS** — Land Parcel Identification System (system identyfikacji działek rolnych)
- **MDR** — Medical Device Regulation
- **MPS** — Monitoring Przeciwdziałania Skutkom Suszy (system IUNG)
- **MRiRW** — Ministerstwo Rolnictwa i Rozwoju Wsi
- **MRL** — Maximum Residue Level
- **NAP** — Narodowy Plan Działań (w kontekście IPM)
- **NDRE** — Normalized Difference Red-Edge Index
- **NDVI** — Normalized Difference Vegetation Index
- **NDWI** — Normalized Difference Water Index
- **NPR** — Najbliższy Przed Zbiorem Roślin (okres karencji po zabiegu)
- **OSCHR** — Okręgowe Stacje Chemiczno-Rolnicze
- **OSN** — Obszary Szczególnie Narażone (na azotany)
- **PIORiN** — Państwowa Inspekcja Ochrony Roślin i Nasiennictwa
- **PIS** — Państwowa Inspekcja Sanitarna
- **PPP** — Plant Protection Product (= ŚOR)
- **PROW** — Program Rozwoju Obszarów Wiejskich
- **RLKS** — Rozwój Lokalny Kierowany przez Społeczność (LEADER)
- **RDOŚ** — Regionalna Dyrekcja Ochrony Środowiska
- **SCC** — Soil, Carbon and Compost (polski ekoschemat ES2 — Rolnictwo Węglowe)
- **SMAP** — Soil Moisture Active Passive (NASA)
- **SMR** — Statutory Management Requirements
- **SMSR** — System Monitoringu Suszy Rolniczej (IUNG)
- **ŚOR** — Środki Ochrony Roślin (= PPP)
- **STT** — Stacja Techniczna Kontroli Opryskiwaczy (sprzęt)
- **SUD** — Sustainable Use of Pesticides Directive (Dyr. 2009/128/WE)
- **SUR** — Sustainable Use Regulation (COM 2022/305 — odrzucone)
- **TUW** — Towarzystwo Ubezpieczeń Wzajemnych
- **UODO** — Urząd Ochrony Danych Osobowych
- **UR** — Użytki Rolne
- **VRA** — Variable Rate Application
- **WFS** — Web Feature Service (OGC)
- **WIOŚ** — Wojewódzki Inspektorat Ochrony Środowiska
- **WMS** — Web Map Service (OGC)
- **WPR** — Wspólna Polityka Rolna (CAP)
- **ZEA** — Zearalenon (mikotoksyna)

---

## Załącznik 3. Rekomendacje wdrożeniowe — kolejność modułów

**Faza MVP (1-3 miesiące):**
1. `FieldRegister` — podstawowy CRUD zabiegów wg A.2.
2. `PppRegistry` — synchronizacja z `dane.gov.pl` + walidator.
3. `FertilizerLog` — ewidencja nawożenia.
4. `GDPR` — polityka prywatności, DPA, moduł usunięcia.
5. Export PDF, CSV, XML (ISO-Plus MRiRW).

**Faza v1.1 (4-6 miesięcy):**
1. `FertilizationPlan` — Plan Nawozowy OSN.
2. `IACSExport` — generator XML do eWniosek Plus.
3. `GAECDashboard` — indykatory 1-9.
4. `IPMChecker` — ocena 8 zasad IPM.
5. `EcoSchemesChecklist` — zwłaszcza ES2 SCC.
6. `InsuranceClaim` + `DroughtReport`.
7. `VRAExport` ISOXML + shapefile.

**Faza v1.2 (7-12 miesięcy):**
1. Integracja JD Operations Center (OAuth2).
2. `GlobalGAPReadiness` + `IPReadiness`.
3. Integracje CNH / AGCO.
4. ADAPT adapter.

**Faza v1.3+ (12 miesięcy+):**
1. `BIOChecker`.
2. Monitoring Soil Monitoring Law (2028+).
3. EUDR module (jeśli rozszerzymy zakres).

---

## Załącznik 4. Ryzyka regulacyjne

| Ryzyko | Prawdopodobieństwo | Skutek | Mitigacja |
|---|---|---|---|
| Zmiana wzoru ewidencji ŚOR (MRiRW) | Średnie (co 2 lata) | Średni — przeróbka schematu DB | Model danych elastyczny, migracje Prisma |
| Nowy SUR na poziomie UE | Niskie (odrzucony 2024) | Wysoki | Monitoring COM |
| Zaostrzenie OSN (kolejne nitraty) | Wysokie | Średni | Konfigurowalne limity |
| API ARiMR nie wystartuje w 2026 | Wysokie | Średni — ręczny import | Scenariusz bazowy: manualny |
| Zmiana cen ekoschematów | Wysokie (roczne) | Niski | Kalkulator aktualizowany |
| Grzywna UODO za RODO | Niskie | Bardzo wysoki (4% obrotu) | DPO, DPA, audyt raz/rok |
| Grzywna PIORiN za ŚOR | Średnie | Średni — 10-500 tys. zł per farm | Hard block przy błędzie |
| Odpowiedzialność cywilna AI | Niskie | Wysoki | OC ubezpieczenie + regulamin |
| Brak integracji z JD → rolnik odchodzi | Średnie | Wysoki | Priorytet v1.2 |
| Wygaśnięcie substancji czynnej (np. flufenacet 2026) | Wysokie | Niski — aktualizacja słownika | Daily sync |

---

## Źródła — indeks odwołań

### Akty prawne — Polska (ISAP — `isap.sejm.gov.pl`)

1. Dz.U. 2022 poz. 2453 — ustawa o Planie Strategicznym WPR 2023-2027
2. Dz.U. 2023 poz. 340 — ustawa o ŚOR (tekst jednolity)
3. Dz.U. 2023 poz. 244 — Rozp. RM w sprawie Programu OSN
4. Dz.U. 2023 poz. 472 — Rozp. MRiRW o GAEC
5. Dz.U. 2023 poz. 569 — ustawa o nawozach (t.j.)
6. Dz.U. 2023 poz. 612 — Rozp. MRiRW o ewidencji zabiegów ŚOR
7. Dz.U. 2023 poz. 788 — Rozp. MRiRW o Integrowanej Produkcji
8. Dz.U. 2023 poz. 1499 — ustawa o PIORiN (t.j.)
9. Dz.U. 2023 poz. 1746 — ustawa o jakości handlowej art. rolno-spoż. (t.j.)
10. Dz.U. 2024 poz. 198 — ustawa o ubezpieczeniach upraw (t.j.)
11. Dz.U. 2024 poz. 901 — Rozp. MRiRW zmieniające ewidencję ŚOR
12. Dz.U. 2024 poz. 1147 — ustawa o nasiennictwie (t.j.)
13. Dz.U. 2025 poz. 412 — Rozp. MRiRW o e-KP (przejściowe)
14. Dz.U. 2025 poz. 743 — Rozp. RM zaostrzające OSN
15. Dz.U. 2025 poz. 1876 — Rozp. MRiRW o ekoschematach 2026

### Akty prawne — UE (EUR-Lex — `eur-lex.europa.eu`)

16. Dyr. 91/676/EWG — azotany
17. Dyr. 2009/128/WE — zrównoważone stosowanie ŚOR (SUD)
18. Rozp. (WE) 1107/2009 — wprowadzanie ŚOR
19. Rozp. 2016/679 — RODO
20. Rozp. 2018/848 — produkcja ekologiczna
21. Rozp. 2021/2115 — Plany Strategiczne WPR 2023-2027
22. Rozp. 2021/2116 — finansowanie WPR
23. Rozp. 2021/2117 — wspólna organizacja rynków rolnych
24. Rozp. 2023/915 — zanieczyszczenia w żywności
25. Rozp. 2023/1115 — EUDR
26. Rozp. 2023/1230 — Machinery Regulation (zastępuje Dyr. 2006/42/WE)
27. COM/2022/305 — projekt SUR (odrzucony)
28. COM/2023/416 — projekt Soil Monitoring Law
29. Rozp. 2024/1689 — AI Act
30. Rozp. 2024/1991 — Nature Restoration Regulation
31. Rozp. 2024/2853 — Product Liability (od grudnia 2026)
32. Rozp. 2025/826 — Soil Monitoring Law (przyjęte)

### Normy techniczne i standardy

33. ISO 11783 serie — ISOBUS (strona ISO)
34. GLOBALG.A.P. IFA v6 — `globalgap.org/ifa-v6`
35. EPPO Global Database — `gd.eppo.int`

### Publikacje oficjalne

36. Raport roczny GIORiN 2024 — `piorin.gov.pl/publikacje/sprawozdania`
37. Plan Strategiczny WPR 2023-2027 v4.7 — `gov.pl/web/wprpo2020/plan-strategiczny-wpr-2023-2027`
38. Instrukcja eWniosek Plus 2026.1 — `gov.pl/web/arimr`
39. CDR Ewidencja zabiegów — `cdr.gov.pl/publikacje`
40. EU Pesticides Database — `food.ec.europa.eu/plants/pesticides/eu-pesticides-database_en`

---

**Koniec dokumentu.**

*Opracowanie: Infinity Team, Research & Compliance, kwiecień 2026.*
*Kolejna rewizja planowana: październik 2026 (po ogłoszeniu ekoschematów 2027 i stanie pilotażu API ARiMR).*
