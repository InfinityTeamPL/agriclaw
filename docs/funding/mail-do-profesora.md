# Mail do prof. Rutkowskiego — do wysłania (Teams/e-mail)

**Załączniki:** `agroagent-rejestr-sor-dowod.pdf` (dowód z produkcji) + `one-pager-agrostrateg-IUNG.pdf` (ten folder). Opcjonalnie: `projekt-agro-orbita-konsorcjum.pdf` (koncepcja projektu badawczego).

---

## Wersja polska

**Temat:** AgriClaw — wdrożenie Pana uwag + walidacja zaleceń względem rejestru MRiRW (postęp z produkcji)

Szanowny Panie Profesorze,

dziękujemy za celne uwagi do AgriClaw. Wdrożyliśmy je w całości: wszystkie rekomendacje — szczególnie dotyczące ochrony roślin i terminów zabiegów — są formułowane jako wsparcie decyzji, z odesłaniem do weryfikacji z aktualną etykietą środka, warunkami pogodowymi, fazą rozwojową i przepisami. Dodaliśmy też zabezpieczenie systemowe: żadne zalecenie ŚOR nie trafi do rolnika bez tego zastrzeżenia.

Poszliśmy o krok dalej: agent waliduje teraz każdy proponowany środek w czasie rzeczywistym względem oficjalnego rejestru ŚOR MRiRW (otwarte dane, dane.gov.pl) — status prawny zezwolenia, zarejestrowane zastosowania w danej uprawie, dawka i fazy BBCH z rejestru, link do etykiety. W załączeniu zapis rzeczywistej rozmowy z produkcji: agent potwierdza legalność Prosaro 250 EC z dawką z rejestru, odmawia rekomendacji środka nieobecnego w rejestrze (Falcon 460 EC) i — zgodnie z zasadą wsparcia decyzji — sam odradza zabieg profilaktyczny w nieodpowiedniej fazie. Nasz audyt wykrył przy okazji i usunął z bazy zaleceń substancję wycofaną z obrotu w UE.

Od naszej ostatniej korespondencji poprawiliśmy również **rzetelność merytoryczną i dokumentacyjną narzędzia** — w duchu Pana uwag o wiarygodności rekomendacji:

- **Faza rozwoju (BBCH) liczona od faktycznej daty siewu**, którą podaje rolnik, a nie z uśrednionego kalendarza — dzięki temu terminy zabiegów, progi przymrozkowe i okna azotowe odnoszą się do rzeczywistego stanu łanu, a nie do przybliżenia.
- **Uczciwe oznaczanie danych:** gdy brakuje bezchmurnego zdjęcia satelitarnego, wskaźniki pochodne są wyraźnie oznaczone jako orientacyjne („dane demo"), a nie prezentowane jako pomiar. Nie pokazujemy rolnikowi liczby, za którą nie stoi obserwacja.
- **Integralność księgi polowej:** rolnik może teraz poprawić lub usunąć błędny wpis, a eksport do PDF (dokument do kontroli IJHARS/ARiMR) działa w pełni offline z gwarancją polskich znaków — bez zależności od zewnętrznych serwerów w momencie generowania.
- **Interfejs** przeszedł pełną, spójną modernizację — narzędzie wygląda i działa jak profesjonalna „stacja naziemna", a nie generyczny panel.

Uruchamiamy nabór do pilotażu „Beta 100" (100 gospodarstw, sezon 2026/27) — aplikacja działa pod adresem **agripol.xyz** — i przygotowujemy część badawczą pod konsorcjum (walidacja polowa modeli chorób, pierwszy otwarty benchmark halucynacji agronomicznych w języku polskim, wyjaśnialność rekomendacji). Załączam jednostronicowe podsumowanie.

Czy moglibyśmy liczyć na krótką, 30-minutową rozmowę o ewentualnej współpracy merytorycznej — w szczególności o kształcie walidacji polowej i metodyce oceny wiarygodności rekomendacji?

Z wyrazami szacunku,
[imię i nazwisko] · Infinity Tech · contact@infinityteam.io

---

## English version

**Subject:** AgriClaw — your feedback implemented + real-time validation against the MRiRW register (production progress)

Dear Professor,

Thank you for your insightful feedback on AgriClaw. We have implemented it in full: all recommendations — particularly those concerning plant protection and treatment timing — are formulated as decision-support guidance, with explicit verification against the current product label, weather conditions, crop growth stage, and applicable regulations. A system-level safeguard ensures no plant-protection recommendation reaches the farmer without this disclaimer.

We went one step further: the agent now validates every proposed product in real time against the official Polish MRiRW plant-protection register (open data, dane.gov.pl) — legal authorisation status, registered uses for the given crop, dose and BBCH window from the register, and a link to the label. Attached is a verbatim transcript from our production environment: the agent confirms the legal status of Prosaro 250 EC with the registered dose, declines to recommend a product absent from the register (Falcon 460 EC), and — following the decision-support principle — itself advises against a prophylactic treatment at an inappropriate growth stage. Our audit also detected and removed an active substance withdrawn from the EU market.

Since our last exchange we have also strengthened the tool's **substantive and documentary rigour**, in the spirit of your remarks on the credibility of recommendations:

- **Growth stage (BBCH) is now computed from the actual sowing date** entered by the farmer, not an averaged calendar — so treatment timing, frost thresholds and nitrogen windows refer to the real state of the crop rather than an approximation.
- **Honest data labelling:** when no cloud-free satellite image is available, derived indices are clearly marked as indicative ("demo data") rather than presented as a measurement. We never show the farmer a number with no observation behind it.
- **Field-log integrity:** farmers can now correct or delete an erroneous entry, and the PDF export (the document used in IJHARS/ARiMR inspections) works fully offline with guaranteed Polish characters — no dependency on external servers at generation time.
- **The interface** underwent a full, consistent redesign — the tool now looks and behaves like a professional "ground station", not a generic dashboard.

We are opening enrolment for our "Beta 100" pilot (100 farms, 2026/27 season) — the application is live at **agripol.xyz** — and preparing the research component for a consortium (on-farm validation of disease models, the first open Polish-language benchmark of agronomic hallucinations, and explainability of recommendations). A one-page summary is attached.

Could we count on a short, 30-minute conversation about potential scientific collaboration — in particular on the design of the on-farm validation and the methodology for assessing recommendation credibility?

Kind regards,
[name] · Infinity Tech · contact@infinityteam.io
