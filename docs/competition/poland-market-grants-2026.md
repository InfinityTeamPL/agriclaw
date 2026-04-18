# AgriClaw — Research rynku agritech w Polsce/CEE oraz programy dotacji 2025-2027

**Stan:** kwiecień 2026
**Autor:** Infinity Tech (contact@infinityteam.io)
**Dokument wewnętrzny — Part of AgriClaw competitive intelligence stack**

---

## Spis treści

1. [Executive summary](#executive-summary)
2. [Część A — Polska konkurencja (SaaS dla rolnika)](#część-a--polska-konkurencja-saas-dla-rolnika)
3. [Część B — Polski rynek rolny (context)](#część-b--polski-rynek-rolny-context)
4. [Część C — Dotacje UE i krajowe 2025-2027](#część-c--dotacje-ue-i-krajowe-2025-2027)
5. [Część D — China: dotacje dla one-person AI startupów](#część-d--china-dotacje-dla-one-person-ai-startupów)
6. [Część E — TOP 3 najlepsze strzały dla AgriClaw](#część-e--top-3-najlepsze-strzały-dla-agriclaw)
7. [Dodatek F — Fundusze VC/CVC specjalizujące się w agritech](#dodatek-f--fundusze-vccvc-specjalizujące-się-w-agritech)
8. [Dodatek G — Kontakty i linki](#dodatek-g--kontakty-i-linki)

---

## Executive summary

Polski rynek agritech SaaS w 2026 r. jest paradoksalny: mamy **1,31 mln gospodarstw** (drugi wynik w UE po Rumunii), ale głęboko rozdrobnionych (średnio 11,75 ha), a penetracja cyfrowych narzędzi agronomicznych pozostaje niska — **44% firm agrotech ocenia poziom cyfryzacji jako "niedostateczny"**, a **83% wskazuje brak kompetencji cyfrowych wśród rolników jako główną barierę** (badanie Rolnictwo Zrównoważone, luty 2025). Jednocześnie klimat i polityka unijna (WPR 2023-2027, KPO, FENG, EFRROW) pompują w ten sektor rekordowe pieniądze — **tylko KPO A1.4.1 Rolnictwo 4.0 to 1,189 mld PLN**, AGROSTRATEG NCBR 2026 — 300 mln PLN, FENG Ścieżka SMART — 700 mln PLN na pojedynczy nabór. Równolegle eksploduje segment **"carbon farming"** (eAgronom, Agreena) — rolnik dostaje pieniądze za praktyki regeneratywne.

Najważniejsi gracze w Polsce to **SatAgro** (Polska, Sentinel-2 NDVI, 1-7 PLN/ha/rok), **Agronomist/SatAgro** (BNP Paribas, darmowy dla klientów banku), **Cropwise Operations** (Syngenta, enterprise), **eAgronom** (Estonia → Polska, carbon farming), **Agrivi** (Chorwacja, 19-69 EUR/mies.), **OneSoil** (Szwajcaria, freemium), **xFarm** (Szwajcaria, IoT + FMS) oraz regionalni gracze (Agrinavia, RolnikON, AgroApp, eDWIN). **Żaden z nich nie jest prawdziwie lokalnym, AI-first, wertykalnym SaaS dla polskiego rolnika <50 ha** — to luka dla AgriClaw.

Chiny — zwłaszcza Shenzhen (Longgang "Lobster Ten Measures" — do **10 mln RMB ≈ 1,4 mln USD** per projekt), Hangzhou Dream Town, Wuxi, Changshu, Nanjing — otwarcie rekrutują solo AI-founderów, z darmowym biurem, GPU credits i bez wymogu obywatelstwa. To realna opcja "bazy mateczkowej" dla AgriClaw, jeśli chcesz zoptymalizować cashflow w fazie R&D.

**TOP 3 strzały dla AgriClaw (szczegóły w Części E):**

1. **PARP Platformy Startowe Komponent IIb** (FEPW, Polska Wschodnia) — do **2 mln PLN bezzwrotnej dotacji** po inkubacji. Deadline kolejnego naboru: Q3/Q4 2026.
2. **NCBR AGROSTRATEG I konkurs** — obszar T3 "Rolnictwo cyfrowe" — min. 1 mln PLN, max 25 mln PLN; nabór 14 maja – 28 sierpnia 2026.
3. **FENG Ścieżka SMART MŚP — nabór wdrożeniowy** — dotacja warunkowa do 70% kosztów netto; nabór 14 maja – 11 czerwca 2026; budżet 700 mln PLN na konkurs.

Łączny potencjalny stack dotacyjny dla AgriClaw w horyzoncie 18 miesięcy: **od 3 do 15 mln PLN** niegranulacyjnego dofinansowania, plus equity-free €50k z EIT Food FAN i opcjonalnie 10 mln RMB z Shenzhen.

---

## Część A — Polska konkurencja (SaaS dla rolnika)

### 1. SatAgro

| Pole | Dane |
|---|---|
| URL | https://satagro.pl/ , https://app.satagro.net/ |
| Kraj pochodzenia | Polska (Warszawa), spin-off CBK PAN |
| Rok startu | 2015 |
| Dostępne kraje | Polska, Czechy, Litwa, Słowacja, USA |
| Liczba rolników/ha | Brak publikowanych statystyk globalnych; partnerstwo z Vantage Polska (dystrybucja), BNP Paribas (Agronomist.pl), TopFarms. Szacunkowo kilka tys. gospodarstw w Polsce, kilkaset tys. ha pod monitoringiem. |
| Ceny | 1-7 PLN/ha/rok (powyżej 50 ha obszaru), zależnie od modułów. Dla <50 ha — abonament ryczałtowy (~400-800 PLN/rok) |
| Satelity | **Landsat 8, Sentinel-2, Planet Labs** — pełne spektrum zewnętrznych konstelacji, w tym komercyjny PlanetScope dla wysokiej rozdzielczości |
| Features | Monitoring NDVI/NDRE/kondycji roślin, mapowanie produktywności, plany nawożenia (VRA), mapy aplikacyjne eksport do maszyn (ISOBUS, Shapefile), integracja z ciągnikami John Deere/CLAAS, dokumentacja pól, generowanie raportów, planowanie badań gleby, alertowanie (termin zabiegu, deszcz, szkodniki) |
| Plusy | + polski produkt (wsparcie w PL), + bardzo konkurencyjna cena, + dojrzałość (11 lat na rynku), + integracja z maszynami, + współpraca z BNP Paribas daje kanał dystrybucji |
| Minusy | − brak AI/ML predykcji chorób (tylko wskaźniki NDVI), − interfejs jest "inżynierski", nie marketingowy — trudny dla rolnika <50 ha, − brak modułu carbon farming, − brak własnej aplikacji mobilnej (tylko responsywny web) |
| Segment | Średnie i duże gospodarstwa (50-500 ha), prosumeryzujący rolnik z wiedzą agronomiczną; B2B dla doradców i firm skupowych |
| Źródła | [SatAgro.pl](https://satagro.pl/), [Vantage Polska](https://vantagepolska.pl/platforma-obserwacji-satelitarnych-sat-agro/), [Agropolska: Rolnictwo precyzyjne satelitarne](https://www.agropolska.pl/technika-rolnicza/rolnictwo-precyzyjne/rolnictwo-precyzyjne-napedzane-obserwacjami-satelitarnymi-czy-to-sie-oplaca,95.html), [Wieści Rolnicze: SatAgro2](https://wiescirolnicze.pl/technika/z-kosmosu-na-pola/satagro2/), [Nawozy.eu Aplikacja SatAgro](https://nawozy.eu/wiedza/porady-ekspertow/nawozenie/aplikacja-satagro-satelitarny-monitoring-pol-uprawnych-i-wsparcie-rolnictwa-precyzyjnego) |

### 2. Agrivi

| Pole | Dane |
|---|---|
| URL | https://www.agrivi.com/pl/ |
| Kraj pochodzenia | Chorwacja (Zagrzeb), międzynarodowy zespół |
| Rok startu | 2013 |
| Dostępne kraje | 150+ krajów, pełna wersja PL od 2017-2018 |
| Liczba rolników | **30 000+ globalnie** (publiczne dane spółki) |
| Ceny (ostatnie publikowane 2017) | Starter 19 EUR/mies., Professional 39 EUR/mies., Premium 69 EUR/mies.; nowsze pricing tylko enterprise (na zapytanie) — szacowane 10-50 EUR/ha/rok w wersji enterprise B2B |
| Satelity | Sentinel-2 (NDVI monitoring), integracja z zewnętrznymi źródłami (Planet, DroneDeploy), stacje pogodowe IoT |
| Features | Planowanie prac polowych (task management), śledzenie zużycia nawozów/pestycydów, finanse/księgowość gospodarstwa, magazyn + inwentaryzacja, monitoring stacji pogodowych, alertowanie chorób (AI-light), ESG/sustainability reporting, integracja ERP, API dla B2B |
| Plusy | + bardzo szeroki feature set, + enterprise-grade (używają m.in. Nestlé, Heineken jako "Agrivi Enterprise"), + wielojęzyczne wsparcie, + dojrzała aplikacja mobilna Android/iOS |
| Minusy | − Drogie dla indywidualnego małego rolnika (>800 PLN/mies. dla Premium), − UX zaprojektowany globalnie — nie uwzględnia polskiej specyfiki (KRUS, ARiMR, IRZ), − brak integracji z ARiMR/IRZplus, − słaby support PL (tłumaczenie + outsourcing) |
| Segment | Średnie/duże farmy (100+ ha), agro-biznesy, kooperatywy, firmy skupujące (Nestlé, Heineken) |
| Źródła | [Agrivi.com/pl](https://www.agrivi.com/pl/), [Sady Ogrody: Agrivi w Polsce](https://www.sadyogrody.pl/logistyka_i_opakowania/107/aplikacja_wspomagajaca_zarzadzanie_gospodarstwem_rolnym_od_agrivi,10953.html), [WRP: nowa firma Agrivi](https://www.wrp.pl/nowa-firma-agrotechniczna-agrivi-juz-polsce/) |

### 3. eAgronom

| Pole | Dane |
|---|---|
| URL | https://www.eagronom.com/pl |
| Kraj pochodzenia | Estonia (Tartu), ekspansja Baltics → Polska → UE |
| Rok startu | 2016 |
| Dostępne kraje | Estonia, Łotwa, Litwa, **Polska (pełne PL)**, Bułgaria, Ukraina, Czechy |
| Liczba rolników | ~4 000+ gospodarstw, **>3 mln ha** pod zarządzaniem (stan 2024) — szybki wzrost przez program węglowy |
| Ceny | FMS (farm management) — freemium + płatne moduły ~5-15 EUR/ha/rok; **program węglowy (carbon farming) — bezpłatne wejście**, eAgronom dzieli się przychodami z certyfikatów VCS/Verra, typowy payout dla rolnika: 20-40 EUR/ha/rok za praktyki regeneratywne |
| Satelity | Sentinel-2, własne algorytmy MRV (Monitoring, Reporting, Verification) dla carbon credits, integracja z stacjami IoT |
| Features | Farm management (pola, prace, magazyn), **carbon farming program** (flagship — certyfikaty VCS, płatności za międzyplony, no-till, przykrywanie gleby), cyfrowy dziennik, MRV automatyczny, integracja z ekoschematami ARiMR (dopłaty bezpośrednie dodatkowo do carbon credits) |
| Plusy | + unikalny model carbon farming (podwójny przychód rolnika: eko-schematy ARiMR + eAgronom carbon credits), + backed by Swedbank, EBRD, bardzo silny kapitałowo, + szybka ekspansja w Polsce (zespół PL, konferencje, case studies), + dobra aplikacja mobilna |
| Minusy | − minimalne wielkości gospodarstwa do programu węglowego (zwykle >50-100 ha), − proces onboardingu long (6+ miesięcy do pierwszej wypłaty), − ryzyko regulacyjne (CSRD, EU ETS zmiany mogą wpływać na wartość kredytów) |
| Segment | Średnie/duże gospodarstwa 50-1000 ha, rolnicy chcący monetyzować praktyki regeneratywne, rolnicy z międzyplonami |
| Źródła | [eAgronom.com/pl](https://www.eagronom.com/pl), [topagrar.pl: eAgronom](https://www.topagrar.pl/articles/tags/eagronom/) |

### 4. Cropwise Operations (Syngenta)

| Pole | Dane |
|---|---|
| URL | https://www.syngenta.pl/serwisy/cropwise-operations , https://www.cropwise.com/pl/ |
| Kraj pochodzenia | Globalne (Syngenta Digital, HQ Bazylea), zakupione od Strider Brasil + Cropio (Ukraina) |
| Rok startu w PL | 2019 (rebranding Cropwise od 2021) |
| Liczba rolników | Globalnie >150 mln ha pod Cropwise, w Polsce kilka tys. klientów (lokalnie sprzedawane przez Syngenta Poland) |
| Ceny | Nie ujawnione publicznie — dostępne w sklepie Syngenta w wersji **rocznej (abonament Premium)** i **miesięcznej**; szacowane 400-1500 PLN/rok dla małego/średniego gospodarstwa |
| Satelity | Sentinel-2, integracja z DroneDeploy, stacje pogodowe IoT (Pessl Metos, Davis) |
| Features | 3 moduły: **Crop Health** (NDVI, bioimaging, disease alerts), **AgroOperations** (task management, logistyka, magazyn), **Telematics** (monitoring maszyn, GPS tracking); prognoza plonów, rekomendacje agronomiczne, integracja ERP/SAP, **SeedSelector** (wybór odmian), **Protector Water** (zalecenia nawadniania) |
| Plusy | + backing Syngenta (ogromna baza klientów nawozów/agrochemii), + integracja z produktami Syngenta ("ekosystem lock-in"), + wysoka jakość rekomendacji opartych o dekady badań, + silny trening modeli disease detection |
| Minusy | − bias na produkty Syngenta w rekomendacjach, − drogie dla małych gospodarstw, − złożony UX wymagający szkolenia (Syngenta robi workshopy), − nie wyspecjalizowany pod PL (ogólnoeuropejski) |
| Segment | Średnie/duże gospodarstwa z kontraktami nawozowymi Syngenta, firmy skupowe, agrohurtownie, Agri-Food company |
| Źródła | [Syngenta.pl — Rolnictwo cyfrowe](https://www.syngenta.pl/rolnictwo-cyfrowe), [Sklep Syngenta Cropwise](https://sklep.syngenta.pl/cropwise-operations-roczna.html), [Farmer.pl Cropwise](https://www.farmer.pl/technika-rolnicza/maszyny-rolnicze/od-pola-do-magazynu-kompleksowe-zarzadzanie-z-syngenta-cropwise-operations,128920.html), [Cropwise.com/pl](https://www.cropwise.com/pl/precision-farming) |

### 5. Agronomist.pl (BNP Paribas)

| Pole | Dane |
|---|---|
| URL | https://agronomist.pl/ |
| Kraj pochodzenia | Polska (portal banku BNP Paribas Bank Polska S.A.) |
| Rok startu | 2019 |
| Liczba użytkowników | Brak publikowanych, ale portal ma >200 tys. rolników-klientów BNP Paribas + **kilkadziesiąt tysięcy użytkowników nieklienta** korzystających z darmowej warstwy |
| Ceny | **Rejestracja free.** Moduły satelitarne i FMS — **darmowe, ale tylko dla klientów BNP Paribas** z kontem firmowym |
| Satelity | Partnerstwo z **SatAgro** — te same dane Sentinel-2 + NDVI + VRA |
| Features | Kalkulatory kredytowe rolnicze (pierwszy w PL kalkulator kredytu inwestycyjnego z harmonogramem spłat i symulacją kosztu finansowania), prognozy cen mięsa/owoców/mleka/zbóż (biweekly), serwis pogodowy, baza wydarzeń, satelitarny monitoring pól (SatAgro embed), FMS (aplikacja 3rd party), ekspercka platforma doradcza, magazyn wiedzy |
| Plusy | + darmowe dla klientów banku (efektywny lock-in bankowy), + combo FinTech + AgriTech (unikalne w Polsce), + dojrzały content marketing |
| Minusy | − zamknięte dla nieklientów banku (paywall pośredni), − brak własnego IP algorytmicznego (wszystko white-label z SatAgro i partnerów), − nie jest to prawdziwy FMS, tylko portal zawierający linki |
| Segment | Klienci BNP Paribas — głównie średnie/duże gospodarstwa z kredytami bankowymi |
| Źródła | [Agronomist.pl](https://agronomist.pl/), [BNP Paribas: Rolnicy](https://www.bnpparibas.pl/rolnicy), [Farmer: Agronomist BNP](http://www.farmer.pl/biznes/przedsiebiorczosc/agronomist-nowy-portal-dla-rolnikow-i-przetworcow-od-banku-bgz-bnp-paribas,84685.html), [Media BNP Paribas: Agronomist rok później](https://media.bnpparibas.pl/pr/495454/agronomist-pl-autorski-portal-banku-bnp-paribas-dla-nowoczesnych-rolnikow-i-przetworcow-ma-juz-rok) |

### 6. OneSoil

| Pole | Dane |
|---|---|
| URL | https://onesoil.ai/pl |
| Kraj pochodzenia | Szwajcaria/Białoruś (Minsk → Zug) |
| Rok startu | 2017 |
| Dostępne kraje | Globalnie, pełna wersja PL |
| Liczba rolników | >250 000 użytkowników globalnie, kilka tys. w Polsce |
| Ceny | **Darmowa app mobilna** (NDVI, podział pól, historia) + płatne moduły dla firm (OneSoil Pro) ~ kilka EUR/ha/rok |
| Satelity | Sentinel-2, własne algorytmy ML (segmentation pól, predykcja plonów) |
| Features | Zdjęcia satelitarne pól (10-dniowe aktualizacje), NDVI, wyznaczenie granic pól automatycznie, mapy nawożenia zmiennego (VRA), notyfikacje, logbook prac, planowanie rotacji |
| Plusy | + naprawdę darmowe dla rolnika indywidualnego, + szybka adopcja (apka mobilna), + dobre UX, + pierwszy gracz, który wypuścił PL localization |
| Minusy | − brak integracji z ARiMR / Polish ekoschematami, − brak modułu księgowego/magazynowego, − brak IoT, − ograniczona funkcjonalność w free (tylko monitoring, brak VRA w niektórych regionach bez Pro) |
| Segment | Mali i średni rolnicy (10-200 ha), młodsi (digital-native), tani |
| Źródła | [OneSoil.ai/pl](https://onesoil.ai/pl), [Farmer: OneSoil po polsku](https://www.farmer.pl/produkcja-roslinna/rolnictwo-precyzyjne-dla-kazdego-aplikacja-onesoil-od-teraz-dostepna-jest-w-jezyku-polskim,116962.html), [Agrotechnology OneSoil](https://agrotechnology.pl/produkt/aplikacja-onesoil/) |

### 7. xFarm Technologies

| Pole | Dane |
|---|---|
| URL | https://www.xfarm.ag/ |
| Kraj pochodzenia | Szwajcaria (Lugano) |
| Rok startu | 2017 |
| Dostępne kraje | 150+ krajów, PL od 2022 |
| Liczba rolników | 370 000+ użytkowników globalnie, 10+ mln ha |
| Ceny | **Freemium:** podstawowa wersja (digital notebook, malá farma) darmowa. Moduły płatne: protection (doradztwo ochrony roślin) — ~50-150 EUR/rok, irrigation, carbon, Smart Scouting — różne ceny |
| Satelity | Sentinel-2, integracja z Climate FieldView (Bayer), własne IoT (xSense, xSmart) |
| Features | **Modularny FMS:** Field mgmt, task mgmt, treatments, warehouse, crop rotation, weather, team mgmt, carbon farming, irrigation, protection; integracja IoT (własne czujniki wilgotności/temperatury gleby), integracja z ciągnikami (ISOBUS, John Deere Operations Center), marketplace agrochemii, aplikacja mobilna premium |
| Plusy | + bardzo silny growth i kapitał (>€36M zebrane, w tym od Kärcher New Venture), + rozwinięte IoT (własny hardware), + integracje BASF, Bayer, Syngenta, + strategie "xFarm Connect" — partnerships z lokalnymi koopratywami |
| Minusy | − trudne pricing dla lowcost polskiego rolnika, − wiele modułów płatnych osobno ("nickle and dime") |
| Segment | Średnie/duże farmy 50-500 ha, winiarze/sadownicy, B2B (kooperatywy) |
| Źródła | [xFarm.ag](https://www.xfarm.ag/en), [Farmer.pl xFarm Technologies](https://www.farmer.pl/technika-rolnicza/maszyny-rolnicze/wiele-marek-maszyn-w-jednym-programie-do-zarzadzania-gospodarstwem-xfarm-technologies,143333.html), [Google Play xFarm](https://play.google.com/store/apps/details?id=ag.xfarm.xfarm) |

### 8. Agrinavia (NAVI-polska)

| Pole | Dane |
|---|---|
| URL | https://agrinavia.pl/ , https://navi-polska.pl/ |
| Kraj pochodzenia | Dania (SEGES DLBR NAVI) → licencja PL od NAVI-polska Sp. z o.o. |
| Rok startu w PL | 2008 |
| Liczba rolników w PL | ~2 000 gospodarstw, głównie duże |
| Ceny | FMS Basic ~1 200 PLN/rok, Plus ~2 400 PLN/rok, Premium ~4 800 PLN/rok (różne moduły); GPS (MARK + RTK) — 5-20 tys. PLN jednorazowo |
| Satelity | Integracja z Sentinel-2 przez moduł MARK Map (dodatkowy) |
| Features | Bardzo rozbudowany FMS (Field, Task, Storage, Economy, Crop Protection), **GPS naprowadzanie** (Agrinavia Mark), integracja z maszynami (AEF ISOBUS, John Deere, Claas, CNHI), **VRA** z mapami, księgowość polowa, raporty dla ARiMR, Inspektoriat Ochrony Roślin (PIORiN) |
| Plusy | + dojrzały produkt (15+ lat na rynku), + silne wsparcie dealerów maszyn (Kramp, AGCO, JD), + GPS hardware własny, + zgodność z polskimi regulacjami (PIORiN, ARiMR) |
| Minusy | − przestarzały UX (desktop-first, Windows), − brak prawdziwego "AI" (tylko statystyka), − drogi dla małych, − aplikacja mobilna słabsza niż OneSoil/xFarm |
| Segment | Duże gospodarstwa 200+ ha z własnymi maszynami, gospodarstwa hodowlane |
| Źródła | [NAVI-polska.pl](https://navi-polska.pl/), [Agrinavia.pl](https://agrinavia.pl/), [NAVI-polska: Cena programu do zarządzania](https://navi-polska.pl/program-do-zarzadzania-gospodarstwem/), [NAVI FMS — koszt](https://navi-polska.pl/farm-management-system-fms/) |

### 9. RolnikON

| Pole | Dane |
|---|---|
| URL | https://rolnikon.pl/ |
| Kraj pochodzenia | Polska |
| Rok startu | ~2010 |
| Liczba rolników | >10 000 (PL; weteran rynku) |
| Ceny | 300-800 PLN/rok, w zależności od modułów (Pola/Magazyn/Maszyny) |
| Satelity | Brak (FMS klasyczny, bez teledetekcji) |
| Features | Historia uprawy pól, ewidencja zabiegów (aktualizowana dla ekoschematów i kontroli PIORiN), magazyn (automatyczne odpisy produktów i nawozów), park maszynowy (przypomnienia o przeglądach, ubezpieczeniach), raporty dla ARiMR |
| Plusy | + w pełni polski, + tani, + prosta obsługa, + zgodność z polskimi regulacjami (PIORiN, ARiMR, ekoschematy) |
| Minusy | − brak teledetekcji, − brak AI, − aplikacja mobilna ograniczona, − klasyczny "desktop FMS" |
| Segment | Mali i średni polscy rolnicy preferujący lokalne narzędzia; księgowość polowa |
| Źródła | [Uprawiajmy.pl: 5 aplikacji](https://uprawiajmy.pl/oprogramowanie-dla-rolnikow-5-aplikacji-usprawniajacych-zarzadzanie/), [Traktor24 2026 aplikacje](https://traktor24.pl/smartfon-zamiast-notesu-najlepsze-darmowe-i-platne-aplikacje-dla-rolnika-na-sezon-2026/) |

### 10. eDWIN (Ministerstwo Rolnictwa / CDR / ODR)

| Pole | Dane |
|---|---|
| URL | https://edwin.gov.pl/ |
| Kraj pochodzenia | Polska (publiczny, rozwijany przez ODR we współpracy z MRiRW) |
| Rok startu | 2020 |
| Liczba użytkowników | >50 000 rolników (za darmo, rządowy) |
| Ceny | **Darmowy** (finansowany z KPO/PROW) |
| Satelity | Sentinel-2 (via COPERNICUS, bezpośrednie pobieranie przez API) |
| Features | Wirtualne gospodarstwo (ewidencja pól), doradztwo online (z ODR), **sygnalizacja agrofagów** (flagship — system powiadomień o zagrożeniach chorobami i szkodnikami w regionie), stacje pogodowe, publikacje ODR, e-dziennik roślinny, pomoc w rejestracji zabiegów ochrony roślin |
| Plusy | + darmowy i rządowy, + sygnalizacja agrofagów wciąż najlepsza w PL (dane z PIORiN), + dostęp do doradców ODR, + zgodność z polskimi regulacjami (PIORiN, ekoschematy) |
| Minusy | − UX nadal "państwowy", − brak prawdziwego AI/ML, − aplikacja mobilna słaba, − niestabilny (reguła: rządowe systemy mają wolne update cykle) |
| Segment | Mali rolnicy (10-50 ha), przede wszystkim ci, co boją się kosztów komercyjnych aplikacji |
| Źródła | [eDWIN.gov.pl](https://edwin.gov.pl/), [Uprawiajmy.pl — 5 aplikacji](https://uprawiajmy.pl/oprogramowanie-dla-rolnikow-5-aplikacji-usprawniajacych-zarzadzanie/) |

### 11. AgroApp (AgroAplikacje / Food Farmer)

| Pole | Dane |
|---|---|
| URL | https://www.agroapp.com.pl/ , https://play.google.com/store/apps/details?id=pl.foodfarmer.mobile |
| Kraj pochodzenia | Polska |
| Rok startu | ~2015 |
| Liczba użytkowników | >50 000 (wg Google Play) |
| Ceny | Free + in-app (kalkulatory, atlasy chorób premium ~30-100 PLN/rok) |
| Satelity | Brak (mobilne apki narzędziowe — kalkulatory, atlasy) |
| Features | Atlas chorób, atlas szkodników, kalkulatory (nawożenia, siewu, zbiorów), plan sprayów, terminarz |
| Plusy | + popularna wśród rolników, + prosta, + tania |
| Minusy | − brak FMS i satelitów, − tylko narzędzia referencyjne |
| Segment | Mali rolnicy wspomagający się w polu; uzupełnienie do FMS, nie substytut |
| Źródła | [AgroApp.com.pl](https://www.agroapp.com.pl/), [Google Play Food Farmer](https://play.google.com/store/apps/details?id=pl.foodfarmer.mobile) |

### 12. FarmPortal (Rolnik DGR)

| Pole | Dane |
|---|---|
| URL | https://farmportal.eu/ |
| Kraj pochodzenia | Polska (IGŻ PAN / zespół badawczy) |
| Rok startu | 2020 |
| Liczba użytkowników | Brak publikacji, ale projekt badawczy dotowany z EFRROW |
| Ceny | **Free** (projekt badawczy/pilot) |
| Satelity | Sentinel-2 |
| Features | FMS free, crop management, darmowa mobile app, "Rolnictwo 4.0"-branded |
| Plusy | + darmowy, + PL, + mobilny |
| Minusy | − słaba adopcja, − projekt bardziej akademicki niż komercyjny |
| Źródła | [FarmPortal.eu](https://farmportal.eu/en) |

### 13. SatAgro-adjacent / Vantage Polska

| Pole | Dane |
|---|---|
| URL | https://vantagepolska.pl/platforma-obserwacji-satelitarnych-sat-agro/ |
| Relacja | Dystrybutor SatAgro i dostawca sprzętu Trimble (GPS RTK); nie własny FMS |
| Segment | Duże gospodarstwa 300+ ha z maszynami RTK |
| Źródła | [Vantage Polska SatAgro](https://vantagepolska.pl/platforma-obserwacji-satelitarnych-sat-agro/) |

### 14. Cerber (kamery w polu, Walbrzych / SpyShop)

| Pole | Dane |
|---|---|
| URL | https://cerber.walbrzych.pl/ , https://www.spyshop.pl/system-detektorow-sejsmicznych-do-ochrony-granic-cerber-33-czujniki-w-zestawie-2815.html |
| Kraj pochodzenia | Polska |
| Charakterystyka | **NIE jest to SaaS** — to firma oferująca hardware (kamery IP, alarmy, system CERBER 33 z detektorami sejsmicznymi). Stosowana przez rolników do ochrony gospodarstwa przed kradzieżami i (rzadziej) monitoringu dzików |
| Ceny | Hardware 2-30 tys. PLN jednorazowo |
| Features | CCTV, detekcja ruchu, alarmy, GSM komunikacja |
| Plusy dla AgriClaw | Potencjalny partner integracyjny (dostarcza hardware, AgriClaw mógłby dostarczać software layer z detekcją AI) |
| Źródła | [Cerber Walbrzych](https://cerber.walbrzych.pl/), [SpyShop System Cerber](https://www.spyshop.pl/system-detektorow-sejsmicznych-do-ochrony-granic-cerber-33-czujniki-w-zestawie-2815.html), [Cerber Alarmy Leszno](https://cerberalarmy.pl/) |

### 15. Pozostałe (do weryfikacji)

Następujące brandy były wymienione w briefie użytkownika, ale **nie udało się zweryfikować jako aktywne SaaS w Polsce w kwietniu 2026:**

- **Farmbot / Farmbox** — "Farmbot" to open-source robot ogrodowy (USA); w PL brak lokalnego agritech-SaaS pod tą nazwą ([Antyweb: aplikacje dla rolników](https://antyweb.pl/aplikacje-dla-rolnikow)).
- **AgroSMART** — nazwa używana przez kilka firm regionalnych (Agrosmart.pl to sklep z nawozami, AgroSmart Brasil to międzynarodowy FMS, ale w PL brak znaczącego gracza).
- **AgroFIS** — nie znaleziono.
- **AgroSync** — nazwa używana przez małe lokalne agencje i IT consultancies; brak znaczącego SaaS.
- **Lato.io** — nie znaleziono aktywnego produktu agritech SaaS w PL pod tą nazwą.
- **AgroKod** — nie znaleziono (może chodzić o GS1 AgroKody do kodów kreskowych w agrofood; brak SaaS).
- **Agrilinks Polska** — Agrilinks to amerykańska platforma USAID o rozwoju rolniczym w krajach rozwijających się, brak polskiego lokalnego ekwiwalentu.
- **GeoAgriCulture (Politechnika Wrocławska)** — brak publicznie widocznego produktu SaaS; możliwy projekt badawczy w PWr (sprawdzić przez KRK Zarządzanie Badaniami PWr).
- **Farmlog Polska** — nie znaleziono aktywnego produktu.
- **eAgro.pl** — domena jest przekierowaniem, brak aktywnego SaaS.

### Mapa luk konkurencyjnych — gdzie jest przestrzeń dla AgriClaw

| Wymiar | SatAgro | Agrivi | eAgronom | Cropwise | xFarm | OneSoil | RolnikON/eDWIN | **AgriClaw (luka)** |
|---|---|---|---|---|---|---|---|---|
| Fully Polish UX | ✓ | ~ | ~ | ~ | ~ | ✓ | ✓ | ✓ |
| Cena <500 PLN/rok (<50 ha) | ✓ | ✗ | ~ | ✗ | ~ | ✓ | ✓ | ✓ |
| Sentinel-2 NDVI | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| **AI disease prediction** (nie tylko NDVI) | ✗ | ~ | ✗ | ✓ | ~ | ✗ | ✗ | **✓ (killer feature)** |
| AI pest/wildlife detection (kamery) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **✓ (killer feature)** |
| Integracja ARiMR / ekoschematy | ~ | ✗ | ✓ | ~ | ✗ | ✗ | ✓ | ✓ |
| Carbon farming embedded | ✗ | ~ | ✓ | ✗ | ✓ | ✗ | ✗ | ✓ (roadmap) |
| **LLM Copilot rolnika** (Polish) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **✓ (killer feature)** |
| Aplikacja mobilna native PWA | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ✓ |
| Małe gospodarstwo 10-50 ha | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | **✓ (targeting)** |

**Wniosek strategiczny:** AgriClaw powinien pozycjonować się jako **"polski AI-Copilot dla rolnika <100 ha z ekoschematami"** — łączący to, co SatAgro robi dla dużych, z UX i cenową filozofią OneSoil, ale dodając warstwę LLM/AI-first (rekomendacje, chat po polsku, wykrywanie chorób z telefonu, integracja z kamerami detekcji zwierzyny Cerber).

---

## Część B — Polski rynek rolny (context)

### B1. Liczba gospodarstw i średnia powierzchnia

- **Łączna liczba gospodarstw rolnych w Polsce (GUS):** **~1,31 mln** (Powszechny Spis Rolny 2020, zaktualizowane szacunki 2024-2025). ([GUS Rolnictwo](https://stat.gov.pl/obszary-tematyczne/rolnictwo-lesnictwo/rolnictwo/))
- **Liczba rolników składających wniosek o dopłaty bezpośrednie 2025 (ARiMR):** ~1,19 mln. ([Wieści Rolnicze: ile hektarów przeciętny rolnik](https://wiescirolnicze.pl/pozostale-ceny-rolnicze/tyle-hektarow-ma-przecietny-polski-rolnik-najnowsze-dane-z-arimr,23337/))
- **Średnia powierzchnia UR (użytków rolnych) na gospodarstwo:**
  - 2023: 11,42 ha
  - 2024 (wrzesień): 11,59 ha ([ARiMR: średnia powierzchnia 2024](https://www.gov.pl/web/arimr/srednia-powierzchnia-gruntow-rolnych-w-gospodarstwie-w-2024-roku))
  - **2025: 11,75 ha** ([Kobieta w sadzie: 11,75 ha w 2025](https://kobietawsadzie.pl/ile-ziemi-ma-przecietny-rolnik-arimr-podaje-1175-ha-w-2025-roku/))

### B2. Struktura według wielkości

Dane ARiMR/GUS za 2024-2025 (szacunki, dopłaty bezpośrednie):

| Klasa | Liczba gospodarstw | % ogółu | Powierzchnia UR | % UR |
|---|---|---|---|---|
| <1 ha | nieopłata bezpośrednia | — | — | — |
| 1-5 ha | ~650 000 | ~50% | ~11% UR | niska |
| 5-10 ha | ~324 000 | ~25% | — | — |
| 10-20 ha | ~175 000 | ~13% | — | — |
| 20-50 ha | ~106 000 | ~8% | — | — |
| 50-100 ha | ~30 000 | ~2,3% | — | — |
| 100-200 ha | ~9 000 | ~0,7% | — | — |
| 200-500 ha | ~3 000 | ~0,2% | — | — |
| >500 ha | ~700-1 000 | ~0,05% | — | — |
| **RAZEM** | ~1,31 mln | 100% | ~14,7 mln ha | 100% |

Źródło: ARiMR szacunki dopłat bezpośrednich 2024, Farmer.pl "Ile gospodarstw w Polsce ma ponad 500 ha" ([Farmer.pl: struktura gospodarstw](https://www.farmer.pl/farmer-po-godzinach/ile-gospodarstw-rolnych-w-polsce-jaka-jest-struktura-gospodarstw,139601.html); [Wieści Rolnicze: przeciętny rolnik 2024](https://wiescirolnicze.pl/analizy-rynkowe/ile-hektarow-ma-przecietny-polski-rolnik-dane-arimr-za-2024-rok/)).

**Regionalne zróżnicowanie:**
- Zachodniopomorskie: średnia 33,50 ha (największe)
- Wielkopolskie: 105 tys. PLN/ha cena ziemi (najwyższa), średnia powierzchnia powyżej średniej krajowej
- Małopolska: średnia 4,36 ha (najmniejsze)

### B3. Główne uprawy

Zbiory 2024-2025 (GUS, szacunki produkcyjne):

| Uprawa | Powierzchnia | Produkcja (mln t) |
|---|---|---|
| **Pszenica** (łącznie ozima + jara) | ~2,2 mln ha | ~11-12 mln t |
| **Kukurydza na ziarno** | ~1,4-1,5 mln ha | ~8-9 mln t |
| **Rzepak** (ozimy + jary) | ~1,0 mln ha | ~3,6 mln t (2025 szacunek) |
| **Jęczmień** | ~0,7 mln ha | ~3 mln t |
| **Ziemniak** | ~0,2 mln ha | ~6 mln t |
| **Burak cukrowy** | ~0,25 mln ha | ~16 mln t |
| **Żyto** | ~0,7 mln ha | ~2,5 mln t |
| **Owies, pszenżyto, etc.** | ~1,5 mln ha | ~6 mln t |

Zbiory zbóż podstawowych z mieszankami 2025: **25,4 mln t** ([WRP: plony 2025 prognoza](https://www.wrp.pl/prognozy-zbiorow-zboz-i-rzepaku-nadal-optymistyczne-ale-susza-moze-wiele-zmienic/)).

### B4. Penetracja smartfonów i cyfryzacji

- **Smartfony w gospodarstwach domowych:** ~87% (GUS "Społeczeństwo informacyjne w Polsce 2024")
- **Smartfony na wsi specifically:** ~80-85% (dane CBOS 2024)
- **Poziom cyfryzacji rolnictwa (samoocena firm agrotech, luty 2025):** **44% firm ocenia jako niedostateczny** ([Rolnictwo Zrównoważone: badanie cyfrowe rolnictwo](https://rolnictwozrownowazone.pl/rolnictwo-zrownowazone/badanie-rolnictwo-cyfrowe-w-polsce/))
- **Główne bariery adopcji:**
  - 83% — brak wiedzy i kompetencji cyfrowych
  - Wysokie koszty inwestycji
  - Trudności z integracją z istniejącymi maszynami

- **Penetracja GPS w ciągnikach:** ~20-25% gospodarstw powyżej 50 ha (szacunki NaviAgro/Agrosklad)
- **Penetracja NDVI / teledetekcja satelitarna:** <10% gospodarstw (wśród dużych 100+ ha — ~30-40%)
- **Rolnictwo 4.0 "pełne" (VRA, IoT, AI):** <3% gospodarstw

### B5. Straty klimatyczne i choroby — ostatnie 5 lat

**Susza w Polsce (PIE, IUNG-PIB):**
- Średnia roczna strata: **3-11 mld PLN**
- 2018: ~3,5 mld PLN
- 2019: ~4 mld PLN
- 2022: ~4 mld PLN (susza średnia)
- 2023: ~6 mld PLN (ciężka susza) — PIE szacował do **6,5 mld PLN** ([Klimat RP: susza kosztowna](https://klimat.rp.pl/susza/art38704531-susza-w-polsce-znow-kosztowna))
- 2024: budżet pomocy suszowej 1,497 mld PLN ([Farmer: wniosek suszowy 2024](https://www.farmer.pl/produkcja-roslinna/skladasz-wniosek-suszowy-za-2024-sprawdz-gdzie-mozna-znalezc-wyszacowany-procent-strat,149574.html))
- 2025: susza notyfikowana w setkach gmin, najbardziej dotknięte: lubuskie, zachodniopomorskie, łódzkie, kujawsko-pomorskie, wielkopolskie ([Agrofakt: raport suszowy IUNG 2025](https://www.agrofakt.pl/raport-suszowy-iung-2025-deficyt-wody-i-zapowiedz-ulew-czy-plony-sa-juz-stracone/))

**Prognoza PIE:** Do 2050 r. plony mogą spaść o blisko **20%** ([Farmer: cena bierności miliardy strat](https://www.farmer.pl/fakty/cena-biernosci-w-rolnictwie-miliardy-strat-i-spadki-plonow-czy-polski-system-zywnosciowy-jest-gotowy-na-przyszlosc,173651.html)).

**Choroby/szkodniki - główne straty 2023-2025:**
- Fuzariozy pszenicy: straty 10-30% w zbożach
- Septorioza liści: powszechna, straty 15-25%
- Rdza żółta/brunatna pszenicy: pojawiła się nasilenie w 2024-2025
- Chowacze rzepaku (łodygowy, podobojczykowy): 2023-2025 bardzo silna populacja
- Stonka kukurydziana: ekspansja na nowe województwa (wcześniej głównie Podkarpacie, teraz Małopolska, Lubuskie)
- Omacnica prosowianka (kukurydza): ~20% strat bez ochrony

**Plony (średnie, t/ha, 2020-2024):**
- Pszenica ozima: 4,5-5,5 t/ha (target 6+ t/ha)
- Kukurydza na ziarno: 6-8 t/ha (target 8-10 t/ha)
- Rzepak: 2,8-3,5 t/ha (target 3,5-4 t/ha)
- Ziemniak: 25-30 t/ha
- Burak cukrowy: 60-70 t/ha

Próg rentowności (Farmer 2024): **6 t/ha pszenicy, 3,5 t/ha rzepaku, 8 t/ha kukurydzy jest dzisiaj zbyt mało** na pokrycie kosztów produkcji ([Farmer: 6t/ha pszenicy za mało](https://www.farmer.pl/produkcja-roslinna/zboza/6t-ha-pszenicy-3-5-t-ha-rzepaku-i-8t-ha-kukurydzy-to-za-malo-na-pokrycie-kosztow-produkcji,135095.html)).

---

## Część C — Dotacje UE i krajowe 2025-2027

### C1. FENG (Fundusze Europejskie dla Nowoczesnej Gospodarki) — Ścieżka SMART

**Organizator:** PARP (dla MŚP), NCBR (dla dużych i konsorcjów)
**Program:** Fundusze Europejskie dla Nowoczesnej Gospodarki (FENG) 2021-2027
**URL główne:** https://feng.parp.gov.pl/component/grants/grants/sciezka-smart
**Ministerstwo:** Ministerstwo Funduszy i Polityki Regionalnej

#### Co finansuje

Moduł obligatoryjny to **B+R** lub **Wdrożenie innowacji**. Opcjonalne: Infrastruktura B+R, Cyfryzacja, Zazielenienie, Internacjonalizacja, Kompetencje.

Cel: rozwijanie zdolności B+R przedsiębiorstw, wdrażanie innowacji produktowych/procesowych, cyfryzacja, zrównoważony rozwój, internacjonalizacja, kompetencje. **AgriClaw pasuje idealnie w B+R + Cyfryzację + Zazielenienie (klima).**

#### Stawki i maksymalne kwoty

| Kategoria | Max dofinansowanie | Intensywność |
|---|---|---|
| MŚP (pojedynczo) | **50 mln PLN** | B+R: 70-80% koszty badań podstawowych + 45-60% badań przemysłowych; Wdrożenie: **do 70% kosztów netto** (dotacja warunkowa, częściowo zwrotna) |
| Duże przedsiębiorstwa | 70 mln PLN | Niższa intensywność (50-65%) |
| Konsorcja | 140 mln PLN | Zależy od uczestników |

Intensywność wsparcia **do 70%** w projektach wdrożeniowych w formie **dotacji warunkowej** (częściowo zwrotnej: część dotacji zwracana, jeśli projekt się komercjalizuje powyżej progu). ([Euro-Funding: FENG 2026](https://euro-funding.com/pl/blog/nowy-harmonogram-naborow-feng-2026-nadchodzace-mozliwosci-dla-przedsiebiorcow/))

#### Harmonogram naborów 2026

| Typ | Nabór | Organizator |
|---|---|---|
| **MŚP — projekty wdrożeniowe** | **14 maja – 11 czerwca 2026** | PARP |
| **MŚP — projekty B+R** | **29 października – 29 grudnia 2026** | PARP |
| Duże — B+R | 23 marca – 22 maja 2026 | NCBR |
| Konsorcja I — B+R | 9 kwietnia – 12 czerwca 2026 | NCBR |
| Konsorcja II — B+R | 7 sierpnia – 16 października 2026 | NCBR |

Źródło: [BizPlanner: Ścieżka SMART 2026](https://bizplanner.pl/sciezka-smart-nabor-feng-2026/), [Ministerstwo: aktualizacja harmonogramu FENG](https://www.nowoczesnagospodarka.gov.pl/strony/aktualnosci/aktualizacja-harmonogramu-naborow-na-2025-i-2026-r-w-programie-fundusze-europejskie-dla-nowoczesnej-gospodarki-2021-2027), [NoweDotacjeUnijne: Ścieżka SMART](https://nowedotacjeunijne.eu/wkrotce-wystartuje-kolejny-nabor-wnioskow-w-programie-feng-sciezka-smart-2026/).

#### Budżet konkursu

- Dla pojedynczych przedsiębiorstw MŚP (wdrożeniowe + B+R): **700 mln PLN** ([Ministerstwo: Ścieżka SMART duże](https://www.funduszeunijne.gov.pl/nabory/sciezka-smart-dla-duzych-przedsiebiorstw-nabor-feng0101-ip01-00126/))

#### Uprawnieni

- Mikro, mali i średni przedsiębiorcy (<250 FTE, obrót <50 mln EUR, suma bilansowa <43 mln EUR)
- Działalność gospodarcza prowadzona w RP
- Nie w stanie upadłości, bez zaległości ZUS/US

#### Jak aplikować

1. Rejestracja w Systemie **LSI (Lokalny System Informatyczny)** — https://lsi.parp.gov.pl/
2. Wniosek na formularzu elektronicznym
3. Załączniki: biznesplan (~60-100 stron), harmonogram, budżet w Excelu, CV kluczowych członków zespołu, oświadczenia, opinia doradcy innowacji
4. Panel ekspercki (ocena merytoryczna przez 2-3 ekspertów branżowych + panelista PARP)
5. Lista rankingowa, decyzja zwykle 4-6 miesięcy po zamknięciu naboru
6. Umowa, zaliczka (30-40%), refundacja kosztów co kwartał

**Koszt przygotowania wniosku z doradcą (grantera):** 30-80 tys. PLN (fixed) + **success fee 3-7%** od przyznanej kwoty. Zalecani: ECDF, Grupa4, Euro-Funding, Sekwencja, Bizplanner.

### C2. PARP — Platformy Startowe (Komponenty IIa i IIb)

**Program:** Fundusze Europejskie dla Polski Wschodniej (FEPW) 2021-2027
**URL:** https://feng.parp.gov.pl/component/grants/grants/platformy-startowe-dla-nowych-pomyslow-1
**Alt URL:** https://fepw.parp.gov.pl/component/grants/grants/2023-platformy-startowe-dla-nowych-pomyslow-komponent-iia---wsparcie-rozwoju-dzialalnosci-gospodarczej-startupu

#### Co finansuje

- **Komponent I (inkubacja):** Ścieżka darmowej inkubacji startupu (usługi podstawowe: biuro, prawo, księgowość, marketing; usługi specjalistyczne: rozwój produktu, walidacja modelu biznesowego) **w Polsce Wschodniej** (woj. lubelskie, podlaskie, podkarpackie, świętokrzyskie, warmińsko-mazurskie, część mazowieckiego z wyłączeniem Warszawy).
- **Komponent IIa — Wsparcie rozwoju startupu po inkubacji** — **bezzwrotna dotacja do 600 000 PLN**.
- **Komponent IIb — Wsparcie rozwoju startupu zaawansowanego** — **bezzwrotna dotacja do 2 mln PLN**.

#### Warunki

- Pomysł biznesowy o charakterze innowacji produktowej na poziomie co najmniej krajowym.
- Gotowość założenia spółki kapitałowej w Polsce Wschodniej (sp. z o.o. lub SA).
- Udział w programie inkubacji z indywidualnym planem.

#### Harmonogram 2026

- **Komponent IIa — V edycja:** nabór 20 stycznia 2026 – 2 kwietnia 2026 (złożono 153 wnioski na 86,92 mln PLN; rozstrzygnięcie spodziewane Q3 2026). Budżet: **30 mln PLN** ([PARP — platformy startowe](https://www.fepw.gov.pl/strony/aktualnosci/30-mln-zl-dla-startupow-z-polski-wschodniej-parp-oglasza-nowy-nabor/))
- **Komponent IIb:** nabór 11 grudnia 2025 – 10 lutego 2026 (złożono 28 wniosków na 51,13 mln PLN)
- **Kolejny nabór IIa i IIb:** prawdopodobnie Q3/Q4 2026 (do potwierdzenia w [harmonogramie PARP](https://www.parp.gov.pl/harmonogram-naborow))

#### Jak aplikować

1. Najpierw wejść w inkubator (jedna z Platform Startowych partnerujących PARP: Unicorn Hub (Rzeszów), Connect Poland Prize, Platforma Startowa Unicorn Hub, Hub of Talents 2, Start in Podlaskie, Huge Thing, Platforma Startowa Lubelsko-Warmińska, etc.)
2. W inkubacji: MVP, business model, walidacja.
3. Po ukończeniu — rekomendacja Platformy do Komponentu II.
4. Wniosek w systemie PARP LSI.
5. Ocena, lista rankingowa.

**Wymaganie siedziby w Polsce Wschodniej** jest realnym obciążeniem. Dla AgriClaw jedno z rozwiązań: **founded spółka w Lublinie/Rzeszowie, z remote teamem.**

Źródła: [PARP: Platformy Startowe IIa](https://www.parp.gov.pl/component/grants/grants/2023-platformy-startowe-dla-nowych-pomyslow-komponent-iia---wsparcie-rozwoju-dzialalnosci-gospodarczej-startupu), [PARP: IIb](https://www.parp.gov.pl/component/grants/grants/platformy-startowe-dla-nowych-pomyslow-1-1-komponent-IIb), [PARP: 30 mln PLN IIa 2026](https://www.fepw.gov.pl/strony/aktualnosci/30-mln-zl-dla-startupow-z-polski-wschodniej-parp-oglasza-nowy-nabor/).

### C3. EFRROW / PROW 2023-2027 — poddziałania dla agritech i rolnictwa cyfrowego

**Europejski Fundusz Rolny na rzecz Rozwoju Obszarów Wiejskich (EFRROW)** — aktualnie wdrażany przez **Plan Strategiczny dla Wspólnej Polityki Rolnej 2023-2027** (PS WPR), zastępuje PROW 2014-2020. Wdrażany przez ARiMR.

#### Poddziałanie 4.1 — Modernizacja gospodarstw (WPR 2023-2027)

- **Cel:** inwestycje zwiększające konkurencyjność (maszyny, budynki, sady, etc.)
- **Beneficjenci:** rolnicy (nie startupy)
- **Stawki:** 500 tys. – 1,5 mln PLN na gospodarstwo (dep. od obszaru inwestycji), **refundacja 50-65% kosztów** (młodzi rolnicy 65-80%)

#### Poddziałanie 16.1 i 16.2 — Współpraca EIP-AGRI (European Innovation Partnership for Agricultural Productivity and Sustainability)

**16.1 — Grupy operacyjne EIP-AGRI**
- Wspólny projekt badawczy/wdrożeniowy: rolnik + naukowiec + firma (konsorcjum)
- Dofinansowanie **do 3 mln PLN / grupa** (zwykle 1-2 mln PLN) na 2-3 letni projekt
- **100% kosztów kwalifikowanych** (nie ma wkładu własnego dla EIP-AGRI)
- Idealne dla AgriClaw — można utworzyć Grupę Operacyjną z IUNG, ODR, rolnikami-pilotami

**16.2 — Wsparcie wdrażania projektów innowacyjnych**
- Wdrożenie wyników Grupy Operacyjnej
- Finansowanie do 500 tys. – 3 mln PLN

**Harmonogram 2026 (ARiMR):**
- Nabór 16.1 EIP-AGRI — **przewidywany Q3 2026** (zaktualizuj w [harmonogramie PAPFU](https://www.papfu.pl/harmonogram/))
- Nabór 16.2 — w zależności od zakończenia grup operacyjnych 2024-2025

Źródła: [ARiMR PROW](https://www.gov.pl/web/arimr/program-rozwoju-obszarow-wiejskich-lata-2014---2020), [Dotacje PROW](https://dotacje-prow.pl/), [PAPFU harmonogram 2026](https://www.papfu.pl/harmonogram/), [WRP: modernizacja WPR 2023-2027](https://www.wrp.pl/modernizacja-gospodarstw-w-nowym-wydaniu-w-wpr-2023-2027-kwoty-i-warunki-wsparcia/).

### C4. KPO A1.4.1 — Inwestycje rolników w zakresie Rolnictwa 4.0

**Program:** Krajowy Plan Odbudowy (KPO), inwestycja A1.4.1
**Wykonawca:** MRiRW, ARiMR
**URL:** https://www.gov.pl/web/rolnictwo/wsparcie-w-zakresie-rolnictwa-41 , https://www.kpo.gov.pl/

#### Co finansuje

Zakup **maszyn, urządzeń, oprogramowania i usług dla Rolnictwa 4.0**:
- Ciągniki z GPS
- Dokupienie GPS do istniejącego ciągnika
- Opryskiwacze z automatycznym sterowaniem dawki
- Rozsiewacze nawozów z precyzyjną kontrolą dawki
- Siewniki z aplikacją zmienną (VRA)
- **Oprogramowanie FMS/satelitarne** (✓ kwalifikowane — istotne dla AgriClaw jako dostawcy)
- Stacje pogodowe, drony rolnicze

#### Stawki

- **Refundacja 65% kosztów kwalifikowanych** (standardowo)
- **80% dla rolników <41 lat lub gospodarstw ekologicznych**
- **Maksymalna kwota: 200 000 PLN** (na beneficjenta)

#### Budżet

- **1,189 mld PLN** (po zwiększeniu o 142 mln z ministra) — ([KPO: większy budżet Rolnictwo 4.0](https://www.kpo.gov.pl/strony/aktualnosci/kpo-wiekszy-budzet-na-rolnictwo-40/), [Agrofakt: 142 mln zł](https://www.agrofakt.pl/minister-rolnictwa-dodaje-142-mln-zl-czyli-jakie-srodki-na-rolnictwo-4-0/))
- Łącznie A1.4.1 KPO: **1,267 mld EUR**

#### Beneficjenci

Rolnicy (osoby fizyczne prowadzące gospodarstwo, KRUS lub otrzymujący dopłaty bezpośrednie 2023 r.). **Nie dla startupów**, ale **bardzo ważny dla AgriClaw jako dostawcy kwalifikowanego oprogramowania**. Oznacza to, że rolnicy mogą kupić abonament AgriClaw i odzyskać 65-80% z KPO.

#### Harmonogram

- I nabór: zakończony (2024)
- II nabór: w toku (2025-2026), komplikacje z rozliczeniem — [Sekwencja KPO A1.4.1](https://www.sekwencja.eu/dotacja/wsparcie-inwestycji-rolnikow-w-zakresie-rolnictwa-4-0-kpo-a1-4-1/)
- **Strategia AgriClaw:** certyfikować oprogramowanie jako "kwalifikowane Rolnictwo 4.0" i pomóc klientom w wypełnianiu wniosków (lead-gen + sales)

### C5. NCBR — AGROSTRATEG (I konkurs)

**Organizator:** Narodowe Centrum Badań i Rozwoju (NCBR)
**Program:** Strategiczny program badań naukowych i prac rozwojowych w sektorze rolnym "AGROSTRATEG"
**URL:** https://www.gov.pl/web/ncbr/agrostrateg

#### Obszary tematyczne

- T1: Zrównoważona produkcja roślinna i poprawa żyzności gleby
- T2: Zrównoważona produkcja zwierzęca
- **T3: Rolnictwo cyfrowe** ← **AgriClaw idealnie pasuje**
- T4: Innowacyjne techniki rolnicze / alternatywne metody produkcji

#### Warunki (I konkurs)

- **Nabór: 14 maja 2026 – 28 sierpnia 2026** (do godz. 16:00 w LSI NCBR)
- **Budżet konkursu: 300 mln PLN** (łączny program 500 mln PLN)
- **Min. dofinansowanie projektu: 1 mln PLN**
- **Max dofinansowanie projektu: 25 mln PLN**
- Czas trwania: 2-4 lata
- Aplikujący:
  - Pojedyncza jednostka naukowa lub przedsiębiorca
  - **Konsorcjum** (max 5 podmiotów, przy czym **min. 40% kosztów musi pochodzić od przedsiębiorstwa**)

#### Jak aplikować

1. System LSI NCBR — https://lsi.ncbr.gov.pl/
2. Wniosek (~60-80 stron + załączniki naukowe)
3. Opis zadań badawczych (WBS), harmonogram, budżet
4. Ocena ekspercka (2-3 ekspertów + panel)
5. Decyzja ~3-5 miesięcy po naborze
6. Obiektywne wymagania wdrożeniowe (zobowiązanie do komercjalizacji)

Źródła: [NCBR AGROSTRATEG I konkurs](https://www.gov.pl/web/ncbr/agrostrateg-ikonkurs), [PwC: strategiczne programy NCBR 2026](https://studio.pwc.pl/aktualnosci/dotacje/strategiczne-programy-ncbr-2026-agrostrateg-hydrostrateg-i-nukleostrateg), [Sadyogrody: 500 mln AGROSTRATEG](https://www.sadyogrody.pl/prawo_i_dotacje/104/ncbr_500_mln_zl_na_wsparcie_badan_i_rozwoju_technologii_w_rolnictwie,51357.html), [UG Projekty: NCBR AGROSTRATEG](https://projekty.ug.edu.pl/2026/04/02/ncbr-i-konkurs-programu-strategicznego-agrostrateg/), [Strefa Biznesu: rolnictwo 4.0](https://strefabiznesu.pl/gigantyczne-pieniadze-na-autonomiczne-roboty-polowe-i-rolnictwo-4-0/ar/c8p2-28877241).

#### Sample projekty AGROSTRATEG T3 (cyfrowe)

Możliwe projekty dla AgriClaw:

- **"AgriClaw Copilot PL v2 — LLM polski dla rolnika"** (kontekst: specjalistyczny LLM fine-tuned na datasecie IUNG/Agrobazy/ODR)
- **"Smart Pest Detection Poland"** — integracja kamer IP/IoT z detekcją chorób i szkodników opartą o wizję komputerową
- **"Carbon Copilot — MRV system dla polskiego rolnika"** — automatyczny monitoring praktyk regeneratywnych z satelity + IoT
- **"Digital Twin gospodarstwa"** — symulacja scenariuszy agrotechnicznych

Budżet: zwykle projekt 5-15 mln PLN, 3-letni, konsorcjum AgriClaw + IUNG-PIB/SGGW/Politechnika Poznańska + 2-3 rolników-pilotów (kluczowe jest mieć konsorcjum rolnicze).

### C6. NCBR — INFOSTRATEG (AI i ICT)

**URL:** https://www.gov.pl/web/ncbr/infostrateg

- VI konkurs INFOSTRATEG ogłoszony w 2025/2026 ([WNP: INFOSTRATEG VI](https://www.wnp.pl/tech/sztuczna-inteligencja-do-uslug-ncbr-oglasza-vi-konkurs-infostrateg,693983.html))
- AI + ICT (AgriClaw mógłby się kwalifikować na styku AI + agrotech)
- Budżet: 100-200 mln PLN na konkurs
- Max dofinansowanie projektu: 10-20 mln PLN
- Intensywność: 70-80% dla MŚP, 50% dla dużych

### C7. NCBR — Harmonogram 2026 ogólny

**NCBR zaplanował 40 rund naborów w konkursach w 2026 r.** — program łącznie kilkanaście miliardów PLN. Główne:

- AGROSTRATEG I: 14.05 – 28.08.2026 (300 mln PLN)
- HYDROSTRATEG: podobne terminy
- NUKLEOSTRATEG: podobne
- INFOSTRATEG VI: do potwierdzenia
- Nabory FENG (konsorcja B+R) — patrz wyżej

Źródło: [NCBR harmonogram 2026](https://www.gov.pl/web/ncbr/harmonogram-konkursow-2026), [NCBR: 2026 szeroka oferta](https://www.gov.pl/web/ncbr/przestrzen-dla-odwaznych-technologii-ncbr-z-szeroka-oferta-konkursowa-dla-nauki-i-biznesu-w-2026-roku).

### C8. Horizon Europe Cluster 6 (Food, Bioeconomy, Agriculture, Environment)

**Organizator:** Komisja Europejska / REA (Research Executive Agency)
**URL:** https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-innovation/horizon-europe/cluster-6-food-bioeconomy-natural-resources-agriculture-and-environment_en
**Work Programme 2026-2027 (draft):** ([Accelopment: Cluster 6 2026-2027](https://accelopment.com/blog/funding/draft-horizon-europe-cluster-6-2026-2027/))

#### Obszary relevantne dla AgriClaw

- **Destination 1:** Biodiversity and ecosystem services
- **Destination 2:** Farms for food security, biodiversity, climate — najważniejszy dla AgriClaw
- **Destination 5:** Land, ocean and water for climate action (**EU Mission: A Soil Deal for Europe**)
- **Destination 7:** Innovative Governance, Environmental/Earth Observation and Digital Solutions (**AgriClaw direct match**)

#### Stawki i warunki

- **Granty 100% kosztów bezpośrednich + 25% overhead** dla non-profit / akademickich partnerów
- **70% kosztów bezpośrednich** dla przedsiębiorstw
- Konsorcja: **min. 3 partnerów z 3 państw UE**
- Typowe projekty: **3-7 mln EUR na 3-4 lata**

#### Harmonogram 2026

- Otwarcie naborów: **od lutego 2026**
- Terminy jednorazowe (single-stage): **kwiecień 2026**
- Dwustopniowe (two-stage): Stage 1 April 2026, Stage 2 September 2026
- **Łączny budżet na 2026 w Cluster 6: ~677 mln EUR**

#### Jak aplikować

1. Europejski portal Funding & Tenders — https://ec.europa.eu/info/funding-tenders/opportunities/portal/
2. Rejestracja PIC (Participant Identification Code)
3. Znalezienie konsorcjum (kluczowe — zwykle kordynator akademicki + 4-7 partnerów)
4. Proposal: ~70-100 stron, bardzo formalny, 5 ekspertów ocenia
5. Koszt przygotowania (z doradcą): 30-80 tys. EUR + success fee

Doradcy rekomendowani: Accelopment, Enterprise Europe Network (EEN, bezpłatne), RDG Polska.

Źródła: [KE Cluster 6](https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe/cluster-6-food-bioeconomy-natural-resources-agriculture-and-environment_en), [REA Cluster 6](https://rea.ec.europa.eu/funding-and-grants/horizon-europe-cluster-6-food-bioeconomy-natural-resources-agriculture-and-environment_en), [KE Work Programme 2026-2027 PDF](https://ec.europa.eu/info/funding-tenders/opportunities/docs/2021-2027/horizon/wp-call/2026-2027/wp-9-food-bioeconomy-natural-resources-agriculture-and-environment_horizon-2026-2027_en.pdf).

### C9. EIT Food — FAN (Food Accelerator Network) i Test Farms

**Organizator:** European Institute of Innovation & Technology — EIT Food (Knowledge and Innovation Community)
**URL:** https://www.eitfood.eu/entrepreneurship/accelerate-food-accelerator-network

#### FAN 2026

- **Czas trwania:** wrzesień – grudzień 2026 (4 miesiące intensywnego programu)
- **Kwalifikacje:**
  - Startup zarejestrowany w UE lub Horizon Europe-associated kraju (w tym UK)
  - Założony **w 2016 r. lub później**
  - Pre-Series A, zespół **do 20 osób**, przychody **<1 mln EUR**
  - TRL 4-8 (prototyp lub pilot)
- **Nagroda finansowa (equity-free, top 3 per hub):**
  - I miejsce: **50 000 EUR**
  - II miejsce: **30 000 EUR**
  - III miejsce: **20 000 EUR**
- **Huby 2026:** 6 w Europie (Monachium, Madryt, Milano, Londyn, Reading, Warszawa — do potwierdzenia konkretnej listy)
- **Nabór aplikacji:** luty-kwiecień 2026 — [EIT Food FAN 2026](https://www.eitfood.eu/open-calls/eit-food-accelerator-network-fan-call-for-startups-2026)

#### Test Farms

- Dostęp do farm w **Polsce, Hiszpanii, Włoszech, Grecji, Turcji, Portugalii** dla testowania innowacyjnych rozwiązań agritech ([EIT Food Test Farms](https://www.eitfood.eu/news/eit-food-invites-agritech-startups-to-test-innovations-in-real-world-conditions-across-europe-with-test-farms))
- Bezpłatne miejsca pilotowe

#### EIT Regional Innovation Booster (RIS)

- Pilot fazy 2025-2026 w **Polsce** we współpracy z MRiT (Ministerstwo Rozwoju i Technologii) ([EIT Regional Innovation Booster](https://eit-ris.eu/regional-innovation-booster/))
- Tailored long-term support dla startupów — kontakt przez polskiego partnera EIT Food

#### Strategia dla AgriClaw

Aplikuj na FAN 2026 (nabór prawdopodobnie luty 2026, do potwierdzenia). Warszawa jako potencjalny hub. Spodziewana konkurencja — 20-50 startupów per hub, akceptacja 5-10. Wartość: €50k + sieć + 4 miesiące mentorów + potencjał follow-on inwestycji.

### C10. Digital Innovation Hubs (EDIH) — Mazovia EDIH i EDIH Warszawa

**Program:** Digital Europe Programme (DIGITAL) — sieć European Digital Innovation Hubs
**URL PL:** https://digitalinnovationhubs.eu/ , [funduszeeuropejskie.gov.pl hub cyfrowy](https://www.funduszeeuropejskie.gov.pl/nabory/hub-innowacji-cyfrowych-dla-msp-z-centralnej-polski/)

#### Mazovia EDIH

**Koordynator:** Sieć Badawcza Łukasiewicz — PIAP (Przemysłowy Instytut Automatyki i Pomiarów)
**URL:** https://piap.lukasiewicz.gov.pl/en/research-projects/mazovia-edih-project/

- Wsparcie transformacji cyfrowej MŚP w Mazowszu i regionalnej Wielkopolsce
- Usługi: developing digital transformation plans, access to expertise, testing solutions, experimenting with latest technologies — **wszystko bezpłatne dla MŚP** (finansowane z programu Digital Europe)
- Czas: marzec 2024 – wrzesień 2026
- Dla AgriClaw: można uzyskać **bezpłatny dostęp do ekspertyzy**, testów technologicznych (np. AI, IoT, cybersec) i potencjalnie do infrastruktury (klaster obliczeniowy PCSS, PIAP)

#### Poznań (PCSS) — Węzły Innowacji Cyfrowych (DIH PCSS)

**URL:** https://www.pcss.pl/wezly-innowacji-cyfrowych/
- Dostęp do superkomputera (PCSS = Poznańskie Centrum Superkomputerowo-Sieciowe)
- Dla AgriClaw: możliwość uzyskania grantów obliczeniowych (GPU time) na **treningowanie modeli AI** (głęboka sieć konwolucyjna do detekcji chorób / LLM fine-tune)

#### "Cyfrowe Innowacje dla Rolnictwa"

Nie znaleziono dedykowanego hub'a pod dokładnie tą nazwą w kwietniu 2026; funkcjonalnie pokrywa to **Mazovia EDIH** + **projekt "Rolnictwo 4.0" KSOW+** ([KSOW+ Rolnictwo 4.0 raport](https://www.ksowplus.pl/files/Innowacje/Rolnictwo_4.0.pdf)). Alternatywnie:

- **WaMa Innovation Hub** (Koalicja na rzecz Polskich Innowacji) — https://koalicjadlainnowacji.pl/en/projects/wama-innovation-hub/
- **Re_d: Rethink Digital Hub** — [hub cyfrowy MŚP Centralna Polska](https://www.funduszeeuropejskie.gov.pl/nabory/hub-innowacji-cyfrowych-dla-msp-z-centralnej-polski/)

### C11. Inkubatory i akceleratory startupów w Polsce (agritech-friendly)

#### Startup Hub Poland (SHP)

- **URL:** https://startuphub.pl/
- Stowarzyszenie zrzeszające akceleratory
- Nie daje bezpośrednio grantów, ale partnerstwa z PARP, Huge Thing, NCBR

#### Huge Thing

- **URL:** https://hugething.com/
- Akcelerator z SpeedUp Venture Capital Group (backed by Orlen VC)
- Programy po 500k PLN equity/grant mix

#### Platforma Startowa — Unicorn Hub (Rzeszów)

- **URL:** https://unicornhub.pl/
- Jeden z głównych partnerów PARP w Komponencie I
- Idealny dla AgriClaw (spółka w Rzeszowie — Polska Wschodnia)

#### Innovations Hub Foundation

- **URL:** https://www.innovationshub.pl/program-inkubacyjny/
- Program inkubacyjny ("Wejdź w świat startupów")
- Specjalizacja: DeepTech, AI, agritech

#### AccelPoint / Green Tech H Raport

- **URL:** https://accelpoint.com/
- Raport polskiego sektora Green Tech 2025 ([AccelPoint Raport 2025 PDF](https://accelpoint.com/wp-content/uploads/2025/12/Raport-2025.pdf))
- Akceleratory + match-making z VC

#### EIT Food Hub Poland

- W strukturze EIT Food sieć partnerska; polski partner zwykle **SGGW / Łukasiewicz IMBiGS / IRWiR PAN** lub operator zewnętrzny

#### AgroBiznes Klub / PIORiN Innovation Lab

- Nieformalne sieci, ale kluczowe dla walidacji produktu z rolnikami

### C12. Regionalne Fundusze — FE Mazowieckie, FE Wielkopolskie, FE Lubelskie, etc.

**Regionalne Programy Operacyjne (FE RPO) 2021-2027** — w każdym z 16 województw są **nabory dla MŚP, w tym na cyfryzację i innowacje**.

#### FE Mazowieckie (Warszawa)

- **URL:** https://funduszedlamazowsza.eu/
- Nabory Priorytet I (Innowacje) — granty do 2 mln PLN na projekty MŚP

#### FE Wielkopolskie

- **URL:** https://www.wrpo.wielkopolskie.pl/
- Priorytet "Cyfryzacja" — szczególnie dobry dla rolnictwa (Wielkopolska = zagłębie rolnicze)

#### FE Lubelskie, Podlaskie, Podkarpackie, Świętokrzyskie, Warmińsko-Mazurskie

- Polska Wschodnia — nakłada się z **FEPW** (PARP)
- Dla AgriClaw siedziba w jednym z tych woj. = podwójny dostęp do funduszy regionalnych + FEPW

### C13. Narodowy Fundusz Ochrony Środowiska (NFOŚiGW)

- **URL:** https://www.nfosigw.gov.pl/
- Program **Klimatyczny Bilans Zarządzania** (pilotaż)
- Program Energia dla Wsi
- Dla AgriClaw mało relevant, chyba że w aspekcie "carbon farming MRV"

---

## Część D — China: dotacje dla one-person AI startupów

Chiny w 2025-2026 r. uruchomiły **bezprecedensowy strumień wsparcia dla "One-Person Companies" (OPC)** budujących produkty AI — prędkość wdrożenia polityki jest dosłownie tygodniowa (w marcu 2026 r. **co najmniej 8 miast jednocześnie opublikowało szkice polityk**).

### D1. Shenzhen Longgang — "Lobster Ten Measures"

**Program:** Lobster Ten Measures (虾十条) — ogłoszone marzec 2026
**Region:** Shenzhen, dzielnica Longgang

- **Kwota grantu:** do **10 milionów RMB (≈ 1,4 mln USD) per projekt** jako **equity investment**
- Bonusowe benefity:
  - Krótkoterminowe **bezpłatne mieszkanie**
  - **Free GPU/compute credits**
  - **40% zwrot inwestycji** ("inwestycja ratunkowa") dla kwalifikujących się startupów
- Dla tych, którzy nie dostali się do Peacock Initiative, award **do 5 mln RMB (≈ 750 tys. USD)**

**Wymagania:**
- Wpis w Shenzhen
- Focus na AI (IT, Next-Gen IT, biotech, new energy, conservation, new materials, environmental, marine, aerospace, health, robotics, wearables, smart equipment)
- **NIE ma wymogu obywatelstwa chińskiego**
- **Wymagane założenie spółki w Shenzhen** (może być z foreign foundations)

Źródła: [KWM: Shenzhen foreign investment](https://www.kwm.com/us/en/insights/latest-thinking/shenzhen-issues-new-measures-to-further-attract-and-utilize-foreign-investment.html), [China-Briefing: Incentives in Shenzhen](https://www.china-briefing.com/news/incentives-shenzhen-attracting-foreign-talent/), [RestOfWorld: China mobilizing one-person AI](https://restofworld.org/2026/china-ai-one-person-companies-incentives/), [ChinaDaily: one-person companies AI-powered](https://www.chinadaily.com.cn/a/202603/03/WS69a6b610a310d6866eb3b67b.html).

### D2. Shenzhen Peacock Plan (孔雀计划)

**Program:** Peacock Plan — od 2011 (stary, ugruntowany)
**URL:** https://www.sipo.gov.cn/ (prezentacja urzędu)

- **Max per team:** **100 mln RMB (≈ 15 mln USD)**
- **Średni grant:** **20 mln RMB (≈ 3 mln USD)**
- **Dla niewybranych głównych aplikantów:** **do 5 mln RMB (≈ 750 tys. USD)** — "Peacock reserve tier"

**Branże:**
IT, nowej generacji IT, **biologia**, new energy, conservation, new materials, environmental, marine sciences, aerospace, health, **robotics**, wearables, smart equipment, emerging industries

**Wymagania foreign talent:**
- Doświadczenie międzynarodowe (PhD, patents, major awards) — **lub** ambitiona founding team
- Relokacja do Shenzhen (wiza Z + potencjalny permanent residence)
- **Brak wymogu obywatelstwa**
- Zobowiązanie do pracy min. 3-5 lat

### D3. Hangzhou Dream Town 梦想小镇

**Koordynator:** Rząd miasta Hangzhou + rząd prowincji Zhejiang
**Od:** 2014
**URL:** Chinese-only głównie; ogólne info: [Cities Insider: Hangzhou opportunities](https://citiesinsider.com/country/china/hangzhou/entrepreneurship-opportunities/en), [Bastille Post: city-sized incubator](https://vietnamnews.vn/sunday/features/480142/city-sized-incubator-makes-a-leap-in-hangzhou.html)

- **Ponad 1000 startupów** obecnie
- **Government grants:** **od 100 000 do 5 000 000 RMB** (od ~14 tys. do 700 tys. USD)
- Benefity: biuro (subsidized rent), szkolenia, mentoring, konkurs **"Creating The World" Hangzhou Overseas High-Level Talent Competition**
- **Idealne dla zagranicznych founderów**
- Nie wymaga obywatelstwa

### D4. Suzhou BioBAY

**Koordynator:** Suzhou Industrial Park (SIP) Biotech Development Co., Ltd.
**URL:** https://www.biobay.com.cn/

- **500+ firm incubowanych**, 15 listed na HK Exchange
- Focus: **biotech, med device, IVD, nanotech** (mniej ściśle AI)
- Program **National University Biomedical Technology Transfer Center** (wrzesień 2024)
- Dla AgriClaw: mniej bezpośrednio dopasowane (biotech), chyba że pivot w agri-bio

### D5. Inne chińskie miasta z dotacjami OPC (marzec 2026 drop)

Zgodnie z [RestOfWorld marzec 2026](https://restofworld.org/2026/china-ai-one-person-companies-incentives/):

| Miasto | Kwota | Warunki |
|---|---|---|
| **Wuxi** | do 10-20 mln RMB | Free compute, subsidized office |
| **Changshu** | podobne | j.w. |
| **Nanjing** (2 dzielnice) | podobne | j.w. |
| **Foshan Chancheng** | podobne | j.w. |
| **Hangzhou Shangcheng** | podobne ([ChinaDaily: Shangcheng OPC](https://regional.chinadaily.com.cn/ezhejiang/2026-03/17/c_1168994.htm)) | j.w. |
| **Shanghai "Zero Gravity"** | Free office 3 years + 90 RMB/mies (≈ £10) serwis | Focus OPC |

#### Równolegle: OpenClaw ecosystem

Wspomniany w [RestOfWorld](https://restofworld.org/2026/china-ai-one-person-companies-incentives/) jako kluczowa platforma, na której buduje wielu OPC foundersów. Dla AgriClaw jako startup zachodni: potencjalne partnerstwo techniczne, ale regulacyjne ryzyko (Chiny a dane polskich rolników).

### D6. Strategia "China Base" dla AgriClaw — pros / cons

**Plusy:**
- Cash injection $1-3M bez równowartości equity (lub mała equity)
- GPU-compute dla trenowania modeli LLM
- Subsidized office i mieszkanie dla CEO
- Dostęp do chińskiego rynku agritech (2nd world)

**Minusy:**
- **Ryzyko regulacyjne EU:** chińskie inwestycje w polską spółkę podlegają screeningowi (ustawa inwestycyjna)
- **GDPR/CSRD:** dane rolników polskich trudno przetwarzać w Chinach
- **Reputacyjne:** polscy rolnicy mogą wrogo reagować na "chiński" brand
- **Praktyczne:** wymaganie pracy CEO w Chinach 3-5 lat

**Hybrydowa strategia:** spółka R&D w Shenzhen (dla IP/AI research) + spółka operacyjna w Polsce (dla klientów, compliance, GDPR). Typowa struktura "Shenzhen Technology Ltd → licencja IP → AgriClaw Polska Sp. z o.o."

---

## Część E — TOP 3 najlepsze strzały dla AgriClaw

### STRZAŁ #1: PARP Platformy Startowe — Komponent IIb (najniższe ryzyko, max 2 mln PLN)

**Kategoria:** Bezzwrotna dotacja po inkubacji
**Kwota:** **do 2 mln PLN** (bezzwrotne)
**Deadline kolejnego naboru:** **Q3/Q4 2026** (po zakończeniu edycji 2025-2026)
**Link:** https://www.parp.gov.pl/component/grants/grants/platformy-startowe-dla-nowych-pomyslow-1-1-komponent-IIb
**Komunikat uruchomienia 2026:** [fepw.gov.pl: 2 mln PLN IIb](https://www.fepw.gov.pl/strony/aktualnosci/nowy-nabor-w-parp-platformy-startowe-komponent-iib-nawet-2-mln-zl-na-rozwoj-startupu/)

**Szanse powodzenia:**
- **Wysokie (40-60%)** przy dobrze napisanym wniosku i zwalidowanym MVP
- Nabory są stosunkowo słabo obsadzone (28 wniosków na 51 mln PLN w ostatnim = ~50% acceptance na paperze)
- Realnie po ocenie merytorycznej: ~30-40% dostaje finansowanie

**Wymagania:**
1. **Siedziba w Polsce Wschodniej** (lubelskie/podkarpackie/podlaskie/świętokrzyskie/warmińsko-mazurskie lub część mazowieckiego poza Warszawą) — **UWAGA: warunek formalny, nieobjeżdżalny**
2. Wcześniej przejście przez **Komponent I (inkubację) w jednej z Platform Startowych** (np. Unicorn Hub Rzeszów, Hub of Talents 2, Huge Thing, Platforma Startowa Unicorn Hub)
3. MVP w rynku, walidacja z klientami (min. 5-10 klientów-pilotów)
4. Spółka kapitałowa (sp. z o.o. lub SA)
5. Zdolność do 20-30% wkładu własnego (część wydatków musi być z innych źródeł — choć nabór wdrożeniowy)

**Dokumentacja:**
- Wniosek (formularz LSI PARP) — ~30-40 stron
- Biznesplan — ~60-80 stron
- Załączniki: harmonogram, budżet, listy intencyjne klientów, CV zespołu, opis IP, analizy konkurencyjne
- Opinia doradcy innowacji (może być Huge Thing)

**Timeline praktyczny:**

| Miesiąc | Akcja |
|---|---|
| Kwiecień-maj 2026 | Rejestracja spółki w Rzeszowie lub Lublinie (lub relokacja obecnej) |
| Maj-lipiec 2026 | Aplikacja do Komponentu I (inkubacja) w Unicorn Hub lub Hub of Talents 2 |
| Sierpień-październik 2026 | Inkubacja (MVP validation, growth metrics) |
| Listopad 2026 | Aplikacja do Komponentu IIb (jeżeli nabór otwarty) |
| Q1 2027 | Decyzja, podpisanie umowy |
| Q2-Q4 2027 | Realizacja (18-24 miesiące) |

**Kto pisze grant:**
- **Opcja A (tańsza):** samodzielnie, po konsultacji z Platformą Startową (bo dostarczają szablony i mentoring)
- **Opcja B (droższa):** grant writer zewnętrzny — 30-50 tys. PLN fixed + 3-5% success fee (rekomendowani: Sekwencja, ECDF, Grupa4)

**Szacunkowe koszty przygotowania:** 5-20 tys. PLN (jeśli z inkubacji wynika szablon), 30-50 tys. PLN (jeśli z zewnętrznym doradcą)

---

### STRZAŁ #2: FENG Ścieżka SMART MŚP — Wdrożeniowe, nabór 14 maja – 11 czerwca 2026

**Kategoria:** Dotacja warunkowa (częściowo zwrotna) do 70% kosztów netto
**Kwota:** **do 50 mln PLN** (do 70% kosztów projektu)
**Deadline:** **14 maja 2026 – 11 czerwca 2026** (4-tygodniowy nabór!)
**Link:** https://feng.parp.gov.pl/component/grants/grants/sciezka-smart
**Budżet konkursu:** **700 mln PLN** (alokacja na nabór)

**Szanse powodzenia:**
- **Średnie (20-30%)** — duża konkurencja (ostatnie nabory ~500-800 wniosków)
- Wysokie ryzyko odrzucenia na ocenie merytorycznej (scoring 70+ pkt na 100 wymagany)
- Bardzo konkurencyjny nabór wdrożeniowy — wymaga komercyjnej waliduacji (TRL 7-9)

**Wymagania:**
1. Status **MŚP** (<250 FTE, obroty <50 mln EUR, suma bilansowa <43 mln EUR)
2. **Projekt wdrożeniowy** — wdrożenie wyników wcześniejszego B+R (nie sam research) — produkt lub proces nowy na rynku polskim lub rynku UE
3. Innowacja co najmniej na poziomie krajowym
4. Profil finansowy: zdolność do sfinansowania minimum 30% kosztów z własnych środków lub kredytu
5. Brak zaległości ZUS/US, upadłości

**Moduły (wybrane):**
- **B+R** (obowiązkowy alternatywnie z Wdrożeniem)
- **Wdrożenie innowacji** (dla dojrzałego MVP)
- Infrastruktura B+R
- **Cyfryzacja** (AgriClaw match)
- **Zazielenienie** (klima — match z carbon farming)
- Internacjonalizacja
- Kompetencje

**Dokumentacja:**
- Wniosek w LSI PARP — formularz elektroniczny ~40 stron
- Biznesplan — **60-100 stron** (w tym analizy rynkowe, TAM/SAM/SOM, modele finansowe 5-letnie, IP strategy, go-to-market)
- Załączniki: harmonogram Gantt, budżet szczegółowy (Excel), CV zespołu, listy intencyjne od klientów, raporty z wcześniejszych B+R, patents/IP, wyceny eksperckie kosztów
- Opinia biegłego rewidenta (dla dużych kwot)
- Certyfikat ISO lub system zarządzania jakością (preferowane)

**Timeline praktyczny:**

| Tydzień | Akcja |
|---|---|
| T0 (dziś) | Decyzja o aplikacji, znalezienie doradcy |
| T1-T4 (kwiecień 2026) | Przygotowanie wniosku z doradcą |
| 14 maja 2026 | Otwarcie naboru |
| do 11 czerwca 2026 | Złożenie wniosku w LSI |
| Czerwiec-wrzesień 2026 | Ocena merytoryczna (panel 3 ekspertów) |
| Q4 2026 | Lista rankingowa, decyzja |
| Q1 2027 | Umowa, zaliczka 30-40% |
| 2027-2029 | Realizacja (24-36 miesięcy) |

**Kto pisze grant:** **zalecany doradca zewnętrzny**, to nie jest wniosek do pisania solo przy kompetytywności naboru. Rekomendowani:
- **ECDF Dotacje** — https://ecdf.pl/dotacje/sciezka-smart-feng/ (specjaliści od FENG)
- **Grupa4** — https://grupa4.pl/artykul/harmonogram-feng-na-2026-r/
- **Euro-Funding Poland** — https://euro-funding.com/
- **BizPlanner** — https://bizplanner.pl/sciezka-smart-nabor-feng-2026/
- **Sekwencja** — https://www.sekwencja.eu/

**Szacunkowe koszty przygotowania:** 50-100 tys. PLN fixed fee + **3-7% success fee** od przyznanej kwoty (przy 10 mln PLN = 300-700 tys. PLN, ale w kieszeni netto 9,3-9,7 mln PLN dopłaty — opłaca się)

**Strategia:** Aplikować na moduł **Wdrożenie innowacji + Cyfryzacja + Zazielenienie** z projektem *"AgriClaw Copilot — polska platforma AI-first dla rolnika 10-200 ha z inteligentną detekcją chorób, szkodników i rekomendacją praktyk regeneratywnych"*. Kwota realnie aplikacyjna: 5-15 mln PLN (nie max, bo mniejsze szanse). Kwota do kwalifikowania: sprzęt (serwery AI, GPU), oprogramowanie, zespoły R&D (min. 12 FTE rok 1), pilotaże z rolnikami (min. 50 farm), marketing, infrastruktura chmurowa (AWS/GCP), dataset creation, certyfikaty.

---

### STRZAŁ #3: NCBR AGROSTRATEG I konkurs (T3 Rolnictwo cyfrowe) — nabór 14 maja – 28 sierpnia 2026

**Kategoria:** Strategiczny program B+R (NCBR), obszar tematyczny T3 Rolnictwo cyfrowe
**Kwota:** **1-25 mln PLN** (min/max per projekt)
**Deadline:** **14 maja 2026 – 28 sierpnia 2026** (nabór 3,5 miesiąca — długi, dobry)
**Link:** https://www.gov.pl/web/ncbr/agrostrateg-ikonkurs
**Budżet konkursu:** **300 mln PLN** (pierwsza runda)

**Szanse powodzenia:**
- **Wyższe niż FENG (30-45%)** bo NCBR to bardziej niszowy nabór i konsorcja są dobrze traktowane
- NCBR AGROSTRATEG priorytetyzuje wspólne projekty firma + nauka — konsorcjum AgriClaw + SGGW/IUNG-PIB/Politechnika Poznańska = realnie duże szanse
- Wymagana komercjalizacja wyników po projekcie

**Wymagania:**
1. **Forma aplikacyjna:**
   - Pojedyncza jednostka naukowa LUB
   - Pojedynczy przedsiębiorca LUB
   - **Konsorcjum (do 5 podmiotów), w którym min. 40% kosztów pochodzi od przedsiębiorstwa** ← **najbardziej zalecana dla AgriClaw**
2. Projekt B+R w obszarze T3 "Rolnictwo cyfrowe" (technologie + analityka danych)
3. Czas trwania: 2-4 lata
4. Zobowiązanie do komercjalizacji wyników po projekcie
5. Lider konsorcjum: przedsiębiorca lub jednostka naukowa

**Idealny target AgriClaw:**

Konsorcjum:
1. **AgriClaw Sp. z o.o.** (lider, przedsiębiorca, 45% budżetu) — komercjalizacja, rozwój platformy, walidacja z rolnikami
2. **IUNG-PIB** (Instytut Uprawy Nawożenia i Gleboznawstwa, Puławy, 30%) — agronomiczna wiedza, walidacja modeli, dostęp do historycznych danych suszy PSWER
3. **SGGW lub Politechnika Poznańska** (15%) — badania AI/ML, publikacje naukowe
4. **ODR (np. Podlaski lub Wielkopolski)** (10%) — walidacja z rolnikami-pilotami, dostęp do sieci 50-100 gospodarstw

Projekt: **"AgriClaw Intelligent Copilot — platforma AI dla polskiego rolnika integrująca teledetekcję satelitarną, kamery IP IoT, LLM po polsku oraz predykcję chorób z walidacją na 100 pilotowych gospodarstwach"**

Budżet proponowany: **8-12 mln PLN** na 3 lata (AgriClaw dostaje ~4-5 mln PLN, reszta na konsorcjantów)

**Dokumentacja:**
- Wniosek w LSI NCBR (https://lsi.ncbr.gov.pl/) — ~60-80 stron
- Opis zadań badawczych (WBS) z kamieniami milowymi co 6 miesięcy
- Harmonogram Gantt
- Budżet detaliczny (po kategoriach: personel, aparatura, usługi, materiały, overhead)
- Listy intencyjne od rolników-pilotów (min. 20 wstępnie)
- CV wszystkich Key Persons (PI dla każdego konsorcjanta)
- Plan komercjalizacji (kto kupi wynik, jakie IP, jak bedą sprzedawane)
- Oświadczenia wszystkich konsorcjantów

**Timeline praktyczny:**

| Okres | Akcja |
|---|---|
| Kwiecień 2026 | Wstępne rozmowy z IUNG-PIB, SGGW, ODR (osobiście! konferencje "Rolnictwo Przyszłości") |
| Kwiecień-maj 2026 | Umowa konsorcjum (memorandum of understanding) |
| Maj-lipiec 2026 | Pisanie wniosku wspólnie (AgriClaw koordynuje, nauka pisze metodologię B+R) |
| 14 maja - 28 sierpnia 2026 | Nabór otwarty |
| Do 28 sierpnia 2026 | Złożenie wniosku |
| Wrzesień-grudzień 2026 | Ocena ekspercka NCBR |
| Q1 2027 | Decyzja, umowa |
| 2027-2030 | Realizacja (36 miesięcy) |

**Kto pisze grant:**
- **Opcja A (zalecana dla konsorcjum):** naukowy konsorcjant (IUNG lub SGGW) pisze część metodologiczną, AgriClaw pisze część wdrożeniowo-komercyjną. Koordynacja przez lidera.
- **Opcja B:** zatrudniony doradca specjalizujący się w grantach NCBR — [GRANTERA](https://grantera.pl/nabory_programy_strategiczne_ncbr/) lub PwC Studio ([PwC: strategiczne programy NCBR 2026](https://studio.pwc.pl/aktualnosci/dotacje/strategiczne-programy-ncbr-2026-agrostrateg-hydrostrateg-i-nukleostrateg))

**Szacunkowe koszty przygotowania:** 30-80 tys. PLN (jeśli naukowy konsorcjant pisze większość) do 150 tys. PLN (z zewnętrznym doradcą NCBR-specjalistą)

**Dlaczego to najlepszy strzał #3:**
- Największa dopasowanie tematyczne (T3 = *dokładnie* to co robi AgriClaw)
- Realne szanse (30-45%)
- Duża kwota (5-15 mln PLN dla AgriClaw w konsorcjum)
- Naukowe prestiż i silne partnerstwo z IUNG-PIB daje credibility przy ARiMR/MRiRW na latach kolejne
- Dostęp do 100+ gospodarstw pilotowych przez ODR = walidacja produktu + sales pipeline

---

## Dodatek F — Fundusze VC/CVC specjalizujące się w agritech

### F1. SMOK Ventures

- **URL:** https://www.smok.vc/
- **Ticket:** 100k-1M EUR
- **Focus:** Early-stage software, CEE + diaspora. Dev tools, gaming, AI.
- **Partnerships:** Silicon Valley bridge
- **Portfolio agritech:** Inwestor w **Proteine Resources** (agritech) — 12 mln EUR w 2025 w tym 9,5 mln EUR z EIC
- **Kontakt:** Borys Musielak (managing partner), Diana Koziarska
- **Źródło:** [SMOK.vc](https://www.smok.vc/), [Shizune: Top VC Funds Poland 2025](https://shizune.co/investors/vc-funds-poland), [CBInsights SMOK](https://www.cbinsights.com/investor/smok-ventures)

### F2. Level2 Ventures

- **Focus:** Wczesny etap (Seed, Series A), DeepTech, Big Data, IoT
- **Ticket:** 0,5-3M EUR
- **Portfolio agritech:** Inwestor w Big Data/IoT startup (3,5M EUR w H1 2025, wraz z ffVC, NCBR Investment Fund)
- **Źródło:** [TheRecursive: H1 2025 funding rounds Poland](https://therecursive.com/polish-startups-h1-2025-top-funding-rounds-poland/)

### F3. OrbitCap

- Trudniejszy do zweryfikowania publicznie — może być rebrand innej firmy VC (OrbiteHUB w Rzeszowie?), wymagana bezpośrednia weryfikacja
- Alternatywnie sprawdź: [Shizune polskie VC](https://shizune.co/investors/vc-funds-poland)

### F4. ffVC (ffVentureCapital)

- **URL:** https://ffvc.pl/
- **Ticket:** 200k-5M PLN (seed do pre-Series A)
- Polska (NY-based) oryginalnie, silna obecność w PL
- Portfolio: szerokie, część agritech

### F5. NCBR Investment Fund

- **URL:** https://www.ncbriif.pl/
- **Specjalizacja:** DeepTech, polskie MŚP z fundamentami B+R (idealnie po grancie NCBR)
- **Ticket:** 3-25 mln PLN
- Publiczny fundusz — może być pierwszym inwestorem po AGROSTRATEG

### F6. EIT Food Follow-on

- Startupy po FAN mogą uzyskać dodatkowe inwestycje przez EIT Food Investors Network (bootstrapy 100k-500k EUR equity-light)

### F7. Kärcher New Venture

- Inwestor w xFarm Technologies — aktywny w Europie, ale sceptyczny dla polskich seed-stage

### F8. Czysta Chmura / InnoEnergy (dla greentech)

- Jeśli AgriClaw pivotuje w carbon farming, otwiera się ścieżka InnoEnergy Venture Capital

### F9. Ukraina / Baltic CEE VCs (na ekspansję)

- **Practica Capital** (Litwa), **Change Ventures** (Estonia) — inwestują w CEE agritech
- **Pragma Ventures** (Ukraina → Kijów) — dla ekspansji ukraińskiej
- **Inovo Venture Partners** (Warszawa) — ticket 2-15M EUR, Series A+

### F10. Family Offices / CVCs agro-przemysłowych

- **Ciech** (chemia, nawozy) — potencjalny CVC
- **Orlen (VC)** — Orlen VC (via Huge Thing)
- **KGHM VC** — biometan i climate
- **PFR Ventures** (Polski Fundusz Rozwoju) — fundusz funduszy, wspiera innowacyjne VC

---

## Dodatek G — Kontakty i linki

### G1. Instytucje rządowe / B+R

| Instytucja | URL | Rola |
|---|---|---|
| MRiRW (Ministerstwo Rolnictwa i Rozwoju Wsi) | https://www.gov.pl/web/rolnictwo | Nadzór nad EFRROW, KPO Rolnictwo 4.0 |
| ARiMR (Agencja Restrukturyzacji i Modernizacji Rolnictwa) | https://www.gov.pl/web/arimr | Wdrażanie PROW/WPR, dopłaty, ekoschematy |
| MFiPR (Ministerstwo Funduszy i Polityki Regionalnej) | https://www.funduszeeuropejskie.gov.pl | FENG, FEPW, polityka spójności |
| PARP (Polska Agencja Rozwoju Przedsiębiorczości) | https://www.parp.gov.pl | FENG Ścieżka SMART MŚP, Platformy Startowe |
| NCBR (Narodowe Centrum Badań i Rozwoju) | https://www.gov.pl/web/ncbr | FENG B+R duże/konsorcja, AGROSTRATEG, INFOSTRATEG |
| NFOŚiGW (Narodowy Fundusz Ochrony Środowiska) | https://www.nfosigw.gov.pl | Programy klimatyczne |
| GUS (Główny Urząd Statystyczny) | https://stat.gov.pl | Dane statystyczne rolnictwa |
| IUNG-PIB (Instytut Uprawy Nawożenia Gleboznawstwa, Puławy) | https://iung.pl | Partner B+R, dane o suszy |
| IRZiBŻ PAN (Instytut Rozrodu Zwierząt) | https://pan.olsztyn.pl | Hodowla |
| IGŻ PAN | https://www.igz.pl | Gleboznawstwo |
| ITP-PIB (Instytut Technologiczno-Przyrodniczy) | https://www.itp.edu.pl | Maszyny, technologie |
| SGGW (Szkoła Główna Gospodarstwa Wiejskiego) | https://www.sggw.edu.pl | Uczelnia partnerska |
| UP Poznań (Uniwersytet Przyrodniczy) | https://www.up.poznan.pl | Uczelnia partnerska |
| ODR (Ośrodki Doradztwa Rolniczego) | https://www.cdr.gov.pl | Sieć 16 wojewódzkich ODR |
| CDR Brwinów (Centrum Doradztwa Rolniczego) | https://www.cdr.gov.pl | Centrala ODR |

### G2. Strony portalu z dotacjami

| Portal | URL |
|---|---|
| FEPW — Polska Wschodnia | https://www.fepw.gov.pl/ |
| FENG — Nowoczesna Gospodarka | https://www.nowoczesnagospodarka.gov.pl |
| Fundusze Europejskie | https://www.funduszeeuropejskie.gov.pl |
| PARP Portal | https://feng.parp.gov.pl/ |
| LSI PARP | https://lsi.parp.gov.pl |
| LSI NCBR | https://lsi.ncbr.gov.pl |
| KPO (Krajowy Plan Odbudowy) | https://www.kpo.gov.pl |
| PROW/WPR Harmonogram | https://www.papfu.pl/harmonogram/ |
| Biznes.gov.pl Ścieżka SMART | https://www.biznes.gov.pl/pl/portal/004295 |
| Wyszukiwarka dotacji Sekwencja | https://www.sekwencja.eu/dotacja/ |
| EU Funding & Tenders Portal | https://ec.europa.eu/info/funding-tenders/opportunities/portal/ |
| Horizon Europe NCP Poland | https://www.kpk.gov.pl |

### G3. Media branżowe

| Medium | URL |
|---|---|
| Farmer | https://www.farmer.pl/ |
| Top Agrar Polska | https://www.topagrar.pl/ |
| Wiadomości Rolnicze Polska (WRP) | https://www.wrp.pl/ |
| Wieści Rolnicze | https://wiescirolnicze.pl/ |
| Agrofakt | https://www.agrofakt.pl/ |
| Cenyrolnicze.pl | https://www.cenyrolnicze.pl/ |
| Agronews | https://agronews.com.pl/ |
| Tygodnik Rolniczy | https://www.tygodnik-rolniczy.pl/ |
| Agropolska | https://www.agropolska.pl/ |
| Traktor24 | https://traktor24.pl/ |
| Sady i Ogrody | https://www.sadyogrody.pl/ |

### G4. Akceleratory i huby

| Akcelerator | URL | Focus |
|---|---|---|
| Unicorn Hub | https://unicornhub.pl | Rzeszów, PARP Platforma Startowa |
| Huge Thing | https://hugething.com | SpeedUp VC, Orlen CVC |
| Innovations Hub Foundation | https://www.innovationshub.pl | DeepTech, AI |
| AccelPoint | https://accelpoint.com | GreenTech, startup analytics |
| Startup Hub Poland | https://startuphub.pl | Zrzeszenie akceleratorów |
| EIT Food Accelerator Network | https://www.eitfood.eu/entrepreneurship/accelerate-food-accelerator-network | FoodTech, AgriTech |
| Mazovia EDIH | https://piap.lukasiewicz.gov.pl/en/research-projects/mazovia-edih-project/ | Digital transformation MŚP |
| PCSS Węzły Innowacji Cyfrowych | https://www.pcss.pl/wezly-innowacji-cyfrowych/ | HPC, AI compute |

### G5. Doradcy grantowi (zalecani dla FENG/NCBR)

| Doradca | URL | Specjalizacja |
|---|---|---|
| ECDF Dotacje | https://ecdf.pl | FENG Ścieżka SMART |
| Grupa4 | https://grupa4.pl | FENG, FEPW |
| Euro-Funding Poland | https://euro-funding.com | FENG, Horizon Europe |
| BizPlanner | https://bizplanner.pl | FENG |
| Sekwencja | https://www.sekwencja.eu | Wyszukiwarka + pisanie |
| GRANTERA | https://grantera.pl | NCBR, INFOSTRATEG |
| PwC Studio | https://studio.pwc.pl | AGROSTRATEG, HYDROSTRATEG |
| Accelopment | https://accelopment.com | Horizon Europe |
| Enterprise Europe Network (EEN) | https://een.ec.europa.eu | Bezpłatne doradztwo EU |
| Doradcy365 | https://doradcy365.pl | KPO Rolnictwo 4.0 |

### G6. VC/CVC polskie i regionalne

| Fundusz | URL | Focus |
|---|---|---|
| SMOK Ventures | https://www.smok.vc | Early-stage, CEE, AI |
| ffVC | https://ffvc.pl | Seed / Series A |
| NCBR Investment Fund | https://www.ncbriif.pl | DeepTech z B+R |
| Inovo Venture Partners | https://inovo.vc | Series A+ |
| OTB Ventures | https://otbvc.com | Frontier tech, space, enterprise |
| Market One Capital | https://moc.vc | SaaS, marketplaces |
| 4RP.Poland (4 Republic Poland Ventures) | https://4rp.vc | Digital economy |
| Black Pearls VC | https://blackpearls.vc | CEE Seed |
| PFR Ventures (fund-of-funds) | https://pfrventures.pl | Public fund-of-funds |
| Orlen VC | https://www.orlenvc.pl | Strategic CVC |
| EEC Magenta | https://eecmagenta.com | ClimateTech |

---

## Conclusions & Recommendations dla AgriClaw

### Ranking atrakcyjności grantów (composite score: kwota × szanse × pasowanie)

| Ranking | Program | Szacunkowa kwota | Szanse | Pasowanie | Score |
|---|---|---|---|---|---|
| 1 | **NCBR AGROSTRATEG T3** | 5-15 mln PLN (w konsorcjum) | 30-45% | 10/10 | **⭐⭐⭐⭐⭐** |
| 2 | **FENG Ścieżka SMART Wdrożeniowe MŚP** | 5-15 mln PLN | 20-30% | 8/10 | **⭐⭐⭐⭐** |
| 3 | **PARP Platformy Startowe IIb** | 2 mln PLN | 40-60% | 9/10 | **⭐⭐⭐⭐** |
| 4 | **EIT Food FAN 2026** | 50k EUR | 10-20% | 10/10 | ⭐⭐⭐ |
| 5 | **Horizon Europe Cluster 6 D7** | 3-7 mln EUR (w konsorcjum) | 10-15% | 8/10 | ⭐⭐⭐ |
| 6 | **FEPW Platforma Startowa IIa** | 600k PLN | 30-45% | 9/10 | ⭐⭐⭐ |
| 7 | **NCBR INFOSTRATEG (AI)** | 2-10 mln PLN | 20-30% | 7/10 | ⭐⭐⭐ |
| 8 | **EFRROW 16.1 Grupy Operacyjne** | 1-3 mln PLN (w konsorcjum) | 40-60% | 7/10 | ⭐⭐ |
| 9 | Regionalne Fundusze FE | 0,5-2 mln PLN | 25-35% | 5/10 | ⭐⭐ |
| 10 | Shenzhen Longgang Lobster | 1,4 mln USD | 30-50% (dla zagranicznego AI) | 6/10 (wymaga relokacji R&D) | ⭐⭐ |

### Stack strategiczny 18-miesięczny (sekwencja)

1. **Kwiecień-czerwiec 2026:** Założenie spółki w Polsce Wschodniej + aplikacja do inkubatora (Unicorn Hub / Hub of Talents 2) → Platforma Startowa Komponent I
2. **Maj-sierpień 2026:**
   - Równolegle: Aplikacja do **FENG Ścieżka SMART Wdrożeniowe** (deadline 11 czerwca)
   - Równolegle: Aplikacja do **NCBR AGROSTRATEG** (deadline 28 sierpnia) w konsorcjum z IUNG-PIB + SGGW + ODR
3. **Lipiec-wrzesień 2026:** Aplikacja do **EIT Food FAN 2026** (nabór luty-kwiecień, ale podobne cykle każdego roku)
4. **Q4 2026:** Aplikacja do **FEPW Komponent IIb** (kolejny nabór)
5. **2026-2027:** Przygotowanie konsorcjum Horizon Europe Cluster 6 — złożenie na nabór 2027
6. **Opcjonalnie 2026:** Shenzhen Longgang application (jeśli decyzja o chińskiej bazie R&D)

**Przy skuteczności 20% aplikacji** (realistyczny scenariusz): AgriClaw zaciśnie 2-4 granty w 18 miesięcy, sumarycznie **3-12 mln PLN** bez równowartości equity.

### Kluczowe KPI i deadlines na najbliższe 90 dni

| Deadline | Akcja | Status |
|---|---|---|
| 2 maja 2026 (T-14d) | Decyzja o siedzibie (Warsaw vs Rzeszów/Lublin) | ☐ |
| 11 maja 2026 (T-3d) | Wstępny kontakt z IUNG-PIB (SGGW) ws. konsorcjum AGROSTRATEG | ☐ |
| 14 maja 2026 | Otwarcie naboru FENG + NCBR AGROSTRATEG | 📅 |
| 11 czerwca 2026 | **Deadline FENG Ścieżka SMART Wdrożeniowe** | 🚨 |
| Sierpień 2026 | Umowa konsorcjum AGROSTRATEG | ☐ |
| 28 sierpnia 2026 | **Deadline AGROSTRATEG I konkurs** | 🚨 |
| Q3 2026 | Kontakt z EIT Food RIS Poland (Warszawa hub) | ☐ |

---

## Metryki dokumentu

- **Autor:** Infinity Tech Claude Research Agent
- **Data:** 18 kwietnia 2026
- **Długość:** ~11 500 słów / ~32 strony A4
- **Liczba źródeł:** 90+ URL inline
- **Status:** draft v1.0, do iteracji z zespołem AgriClaw przed aplikacjami

---

## Załącznik A — Dane surowe do dalszej weryfikacji

Poniższe punkty wymagają dodatkowej weryfikacji — user wspomniał w briefie brandy, których **nie udało się zidentyfikować jako aktywnych SaaS w Polsce w kwietniu 2026**. Zalecana ręczna weryfikacja (telefon / LinkedIn do founderów):

1. **Farmbox** (odróżnić od Farmbot CNC, australijska firma): https://play.google.com — wyszukanie szczegółowe
2. **AgroSMART** (nazwa niejednoznaczna, kilka firm w PL)
3. **AgroFIS** (nie znaleziono aktywnego SaaS)
4. **AgroSync** (small local IT companies używają tej nazwy, brak SaaS)
5. **Lato.io** (potencjalnie młody startup w stealth mode, zweryfikować Crunchbase)
6. **AgroKod** (GS1 AgroKody, brak SaaS)
7. **Agrilinks Polska** (Agrilinks = USAID w krajach rozwijających, polski odpowiednik nie istnieje jako marka)
8. **GeoAgriCulture PWr** (projekt badawczy Politechniki Wrocławskiej, sprawdzić publikacje)
9. **Farmlog Polska** (nie znaleziono)
10. **eAgro.pl** (domena nieaktywna)

Jeśli te brandy są faktycznymi graczami, zalecana ich identyfikacja przez:
- Crunchbase/Pitchbook/Dealroom search
- LinkedIn Sales Navigator (search "agritech Poland")
- KRS query (Krajowy Rejestr Sądowy) dla spółek z PKD 72.19.Z + rolnictwo keyword

---

*Koniec dokumentu. W przypadku pytań lub aktualizacji: contact@infinityteam.io*
