# AgriClaw — proces dokończenia produktu i droga do finansowania

**Stan:** 3 lipca 2026, po wdrożeniu audytu (PR #11 + #12 na produkcji)
**Autor:** Infinity Tech (contact@infinityteam.io)
**Cel dokumentu:** jedna mapa: co JEST zrobione → co DOMKNĄĆ w produkcie → co zbudować wokół produktu (spółka, piloci, metryki) → wniosek o finansowanie → kampania.

---

## 0. Gdzie jesteśmy (zweryfikowane na produkcji 2026-07-03)

Po audycie lipcowym (9 torów, 15 commitów, 2 PR-y) produkcja `agriclaw-tau.vercel.app` ma:

| Filar | Stan |
|---|---|
| Monitoring satelitarny | ✅ Sentinel-2 multi-index (NDVI/NDRE/NDWI/SAVI) **z maską chmur SCL**, Sentinel-1 radar, Planet 3 m, historia + backfill |
| Silnik agronomiczny | ✅ BBCH (GDD), bilans wodny, przymrozki, stres cieplny, presja chorób, azot (dawka + **plan sezonowy z limitem Programu azotanowego**), zgodność GAEC/ekoschematy |
| Agent AI | ✅ OpenClaw per-farma (Hetzner), chat SSE z keep-alive, skills API z tokenem per-farma, **inbound webhook WhatsApp (HMAC)**, diagnoza zdjęć (OpenRouter, walidacja odpowiedzi) |
| Księga polowa | ✅ e-rejestr zabiegów, eksport CSV/PDF (IJHARS), **soft-delete pola chroniący księgę (wymóg prawny)** |
| Skaner alertów | ✅ działa od 2026-07-03 (wcześniej nigdy — fałszywy sukces przez SSO na VERCEL_URL) |
| Bezpieczeństwo | ✅ IDOR-y zamknięte, crony Bearer-only, walidacja poligonów/dat/CSV, rate-limit fail-open, SW bez cache danych prywatnych |
| UI | ✅ unikalny system „stacja naziemna" (Space Grotesk + IBM Plex Mono, rampa NDVI jako sygnatura marki), mobile-first, PWA |
| Jakość | ✅ 76 testów jednostkowych, tsc czysty, CI (GH Actions) zielone, preview deploye naprawione |

**Czego NIE ma** (świadomie, z backlogu audytu): cache warstw satelitarnych, urzędowa baza ŚOR, VRA/ISOXML, pełny offline, płatności, migracje Prisma, monitoring produkcyjny, procesy compliance (RODO docs), oraz cała warstwa "firma" (spółka, piloci z listami intencyjnymi, metryki).

---

## 1. TOR PRODUKT — domknięcie techniczne (4–6 tygodni, priorytet malejący)

### Sprint P1 (tydz. 1–2) — koszty i stabilność pod ruch pilotażowy
1. **Cache warstw satelitarnych** (HIGH z audytu): odpowiedzi CDSE Process API (layer 1024×1024 + statystyki) cache'owane per (pole, indeks, dzień) w Postgres/Blob; TTL do następnej rewizyty satelity. Efekt: −80–90% zapytań CDSE (limit 30k/mies. wystarczy na ~500 pól), wejście na pole <1 s.
2. **Wspólny fetch Open-Meteo per pole/dzień** (MEDIUM): frost/heat/diseases/water-balance dziś pobierają te same archiwum 4×; jeden helper z cache w pamięci żądania + tabela `weather_cache`.
3. **Monitoring produkcyjny**: Vercel Analytics + drain logów (Axiom/Logtail free tier), alert na error-rate i na `failures>0` w cron/daily; strona `/status`.
4. **Migracje Prisma**: `prisma migrate diff` z żywej bazy → baseline `0_init`; od teraz `migrate deploy` w buildzie zamiast db push (zamyka HIGH z audytu i ryzyko dryfu).

### Sprint P2 (tydz. 3–4) — funkcje domykające wartość dla rolnika
5. **Baza ŚOR MRiRW**: import rejestru środków ochrony roślin (plik XLSX z gov.pl) do tabeli; diagnoza i księga podpowiadają TYLKO zarejestrowane środki z dawką z etykiety (dziś: wiedza modelu = ryzyko).
6. **Centrum powiadomień**: dzwonek w topbarze (dziś link) → lista rekomendacji/alertów z oznaczaniem przeczytanych; kanał WhatsApp opt-in per typ alertu.
7. **Onboarding "3 minuty do pierwszej analizy"**: import działki po numerze (ULDK działa!) → auto-analiza → pierwszy raport na ekranie i na WhatsApp. Mierzyć time-to-value.
8. **Offline lite (PWA)**: cache ostatniego stanu pól + księgi do odczytu (IndexedDB), kolejka zapisu obserwacji scoutingowych offline→sync (rolnik w polu bez zasięgu).

### Sprint P3 (tydz. 5–6) — przewagi "nie do podrobienia w rok"
9. **VRA/ISOXML eksport map aplikacyjnych** (z NDRE → dawka N w 3–5 strefach; format ISO-XML + Shapefile) — odblokowuje rolników z terminalami John Deere/CLAAS i jest wymogiem poważnych przetargów/dotacji Rolnictwo 4.0.
10. **Tryb doradcy (multi-farm)**: przełącznik gospodarstw (dziś atrapa) → doradca ODR/skupowy widzi N gospodarstw; to kanał dystrybucji B2B2F.
11. **Płatności Stripe**: plan Free (1 pole) / Gospodarstwo (149 zł/mies. do 100 ha) / Doradca (od 399 zł/mies.); trial 30 dni; faktury (Stripe Tax + integracja KSeF przez API later).

**Definicja "produkt dokończony" (Definition of Done):** rolnik przechodzi ścieżkę *rejestracja → import działki → analiza → rada → zabieg w księdze → alert na WhatsApp → eksport do kontroli* bez udziału człowieka z Infinity, przy koszcie infra <2 zł/gospodarstwo/mies. i error-rate <0,5%.

---

## 2. TOR FIRMA — rzeczy, bez których wniosek nie przejdzie (równolegle, tydz. 1–6)

1. **Spółka z o.o.** — wymóg każdego programu (PARP/NCBR/EIC). Decyzja lokalizacyjna: **Polska Wschodnia (Lublin/Rzeszów) otwiera PARP Platformy Startowe IIb (do 2 mln PLN bezzwrotnie)** — patrz research grantowy; rejestracja S24 = 1 tydzień.
2. **Piloci: 20 listów intencyjnych + 5 płacących gospodarstw.** Kanały: grupy FB („Rolnik z głową", „Nowoczesne rolnictwo"), ODR-y (Wielkopolski, Podlaski), koła gospodyń/OSP lokalnie, targi Agro Show (wrzesień, Bednary). List intencyjny = 1 strona: „przetestuję sezon 2026/27, przy satysfakcji zapłacę od 99 zł/mies.".
3. **Metryki od dziś**: liczba gospodarstw, ha pod monitoringiem, WAU, analizy/tydzień, alerty wysłane/otwarte, NPS po 30 dniach. Prosty dashboard admin + eksport do wniosków.
4. **RODO-pakiet**: rejestr czynności, DPA z podprocesorami (Vercel, Neon, Meta, OpenRouter, Hetzner), aktualizacja polityki prywatności; dane pól = dane osobowe (geolokalizacja gospodarstwa!).
5. **WhatsApp Business produkcyjnie**: weryfikacja Meta Business, numer dedykowany, szablony wiadomości (template approval trwa 1–4 tyg. — zacząć TERAZ).
6. **IP**: umowy przeniesienia praw od wszystkich kontrybutorów na spółkę; znak towarowy „AgriClaw" (UPRP, ~1,5 tys. zł).

---

## 3. TOR WNIOSEK — finansowanie (szczegóły i terminy → `docs/funding/`)

Strategia trójwarstwowa (potwierdzana świeżym researchem z 2026-07-03):

| Warstwa | Program | Kwota | Kiedy | Status |
|---|---|---|---|---|
| **A. Szybkie, equity-free** | ESA BIC Poland / CASSINI / EIT Food FAN | 50–75 k EUR | nabory ciągłe/jesień | do potwierdzenia w researchu |
| **B. Główny strzał PL** | **NCBR AGROSTRATEG I (T3 Rolnictwo cyfrowe)** | 8–12 mln PLN (konsorcjum, AgriClaw ~4–5 mln) | **nabór trwa do 28.08.2026** | wniosek = `docs/funding/wniosek-agrostrateg.md` |
| **C. Ścieżka startupowa** | PARP Platformy Startowe IIb (FEPW) | do 2 mln PLN bezzwrotnie | inkubacja od Q3, wniosek Q4 2026 | wymaga spółki w PL Wschodniej |

Harmonogram krytyczny (lipiec–sierpień):
- **T+1 tydz.:** kontakt z IUNG-PIB (Puławy) i SGGW — zaproszenie do konsorcjum AGROSTRATEG (mamy działający produkt = najlepsza karta przetargowa); równolegle 2 ODR-y.
- **T+2 tydz.:** szkic wniosku (WBS, kamienie milowe, budżet) — draft już w repo, do uzupełnienia danymi konsorcjantów.
- **T+4 tydz.:** listy intencyjne rolników (min. 20) + zgody konsorcjantów.
- **do 20.08:** złożenie w LSI NCBR (buffer 8 dni na awarie systemu).

---

## 4. TOR KAMPANIA — pozyskanie 100 gospodarstw beta (szczegóły → `docs/marketing/kampania-beta-2026.md`)

Skrót: kampania „**100 gospodarstw widzi więcej**" (sierpień–październik 2026), kanały: WhatsApp-first content (30-sek. wideo „pole z kosmosu"), grupy FB rolnicze, ODR-y, Agro Show Bednary, program poleceń (1 mies. gratis za rolnika). KPI: 100 aktywnych gospodarstw, 2 000 ha, 25 listów intencyjnych, NPS >40. Pełny plan w osobnym dokumencie.

---

## 5. Sekwencja decyzji właściciela (co musisz klepnąć osobiście)

1. Lokalizacja spółki (PL Wschodnia = PARP; obojętna = tylko NCBR/ESA/EIT).
2. Budżet na doradcę grantowego AGROSTRATEG (0 zł solo z szablonem z repo vs 30–50 tys. PLN doradca) — rekomendacja: **solo + recenzja doradcy za fixed 5–10 tys.**, bo treść merytoryczną mamy.
3. Zgoda na konsorcjum (40%+ kosztów po stronie firmy, lider: AgriClaw).
4. Cennik beta (rekomendacja: darmowe do 31.12.2026 dla pierwszych 100, potem 99–149 zł/mies.).
5. Numer WhatsApp dedykowany dla agenta (wymóg Meta).

---

*Dokument utrzymywany w repo; aktualizować po każdym sprincie. Powiązane: `docs/audyt/audyt-2026-07.md` (stan techniczny), `docs/competition/poland-market-grants-2026.md` (research kwietniowy), `docs/funding/` (wnioski), `docs/marketing/` (kampania).*
