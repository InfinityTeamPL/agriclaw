// Dyscyplina „wsparcie decyzji, nie polecenie" — jedno źródło prawdy dla całej
// aplikacji. Zgodnie z opinią ekspercką (prof. Rutkowski, 2026): zalecenia,
// zwłaszcza dotyczące ochrony roślin (ŚOR) i terminu oprysku, muszą być
// formułowane ostrożnie, jako wsparcie decyzji, i ZAWSZE weryfikowane względem
// aktualnej etykiety środka, pogody, fazy rozwojowej uprawy i przepisów.
//
// Ten moduł jest importowany przez: prompt agenta AI, diagnozę z kamery,
// silnik rekomendacji, modele chorób oraz komponent UI AdvisoryNotice.

/** Cztery punkty, względem których rolnik MUSI zweryfikować każde zalecenie ŚOR. */
export const SOR_VERIFICATION_POINTS = [
  'aktualną etykietę środka ochrony roślin (rejestr MRiRW)',
  'bieżące warunki pogodowe',
  'fazę rozwojową uprawy (BBCH)',
  'obowiązujące przepisy i okres karencji',
] as const;

/** Krótkie zastrzeżenie do plakietek/nagłówków UI (jedna linia). */
export const ADVISORY_SHORT =
  'Zalecenie wspomaga decyzję — przed zabiegiem zweryfikuj etykietę środka, pogodę, fazę uprawy i przepisy.';

/** Pełny tekst zastrzeżenia dla komponentu UI (rekomendacje ochrony roślin). */
export const ADVISORY_UI_NOTICE =
  'To jest wsparcie decyzji, a nie polecenie. Przed każdym zabiegiem ochrony roślin ostateczną decyzję podejmujesz Ty i weryfikujesz ją z: ' +
  SOR_VERIFICATION_POINTS.join(' · ') +
  '.';

/** Blok instrukcji wstrzykiwany do promptów LLM (agent + diagnoza z kamery). */
export const PROMPT_ADVISORY_DISCIPLINE = `## Charakter zaleceń — WSPARCIE DECYZJI, nie polecenie (BARDZO WAŻNE)
Twoje odpowiedzi wspierają decyzję rolnika — to on decyduje i odpowiada za zabieg. Trzymaj się zasad:
- REGUŁA POZYTYWNA (stosuj zawsze): każdy czasownik zabiegu poprzedź warunkiem decyzji rolnika — "jeśli zdecydujesz się...", "do rozważenia...", "opcja: ...". Przykłady dobrego framingu: "dobre okno na ewentualny zabieg: jutro 5:30–9:00", "do rozważenia fungicyd T2 — po potwierdzeniu w łanie".
- NIGDY nie formułuj zabiegu jako rozkazu ani pewnika (żadnych form typu "pryskaj", "zastosuj", "wykonaj oprysk" bez warunku).
- Przy KAŻDYM zaleceniu dotyczącym ochrony roślin (ŚOR — fungicyd/herbicyd/insektycyd, dawka, termin oprysku) DODAJ, że rolnik musi je zweryfikować z: (1) aktualną etykietą środka (rejestr MRiRW), (2) bieżącą pogodą, (3) fazą rozwojową uprawy, (4) przepisami i okresem karencji.
- DAWKI: nie podawaj konkretnej dawki liczbowej jako zalecenia. Jeśli wspominasz dawkę, wyłącznie jako "typowy zakres z etykiety" z wyraźnym "sprawdź na etykiecie". Substancję/produkt wskazuj tylko jako kierunek DO POTWIERDZENIA — dobór zależy od uprawy, patogenu i AKTUALNEJ rejestracji (środki bywają wycofywane).
- Kolejność: najpierw potwierdzenie (obejrzenie łanu / zdjęcie do diagnozy), potem ewentualny zabieg.`;

// Wykrywa, czy tekst zalecenia dotyczy ochrony roślin (ŚOR) — wtedy UI dokłada
// zastrzeżenie, a treść wymaga ostrożnego framingu. Świadomie szeroki wzorzec.
const SOR_PATTERN =
  /oprysk|prysk|fungicyd|herbicyd|insektycyd|zaprawa|ŚOR|dawk|substancj|karencj|triazol|protiokonazol|tebukonazol|antytranspirant|zabieg (chemiczn|ochron)/i;

/** Czy dane zalecenie/tekst dotyczy ochrony roślin (ŚOR)? */
export function isPlantProtectionText(text: string | null | undefined): boolean {
  if (!text) return false;
  return SOR_PATTERN.test(text);
}

/**
 * TWARDY BEZPIECZNIK (deterministyczny, poza LLM): jeśli tekst wygenerowany
 * przez model dotyczy ochrony roślin, a nie zawiera odwołania do weryfikacji
 * z etykietą — doklejamy zastrzeżenie. Prompt to perswazja; to jest gwarancja.
 * Stosowane w: /api/chat/stream (odpowiedź agenta), webhook WhatsApp (reply),
 * skill agri-notify (wiadomości komponowane przez agenta).
 */
export function withAdvisoryDisclaimer(text: string): string {
  if (!isPlantProtectionText(text)) return text;
  // Model sam przypomniał o etykiecie/rejestrze → nie dublujemy.
  if (/etykiet|mrirw/i.test(text)) return text;
  return `${text}\n\n⚠ ${ADVISORY_SHORT}`;
}
