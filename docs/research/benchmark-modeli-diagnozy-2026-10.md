# Benchmark modeli wizyjnych do diagnozy chorób roślin (październik 2026)

**Cel:** wybrać model do „Diagnozy z kamery" na podstawie pomiaru, a nie deklaracji producentów.
**Wynik:** zmiana z Gemma 4 31B na **Gemini 3.8 Flash** — trafność 3/8 → **8/8**, czas 16 s → 6 s, koszt ~0,01 zł za zdjęcie.

## Metoda

- 8 zdjęć z jednoznacznym opisem z Wikimedia Commons (opis autora/taksonu = etykieta prawdziwa): rdza brunatna pszenicy (×2), rdza żółta, mączniak prawdziwy (zdjęcie mikroskopowe), zaraza ziemniaka (×2), fuzarioza kłosów, larwy stonki ziemniaczanej.
- Jeden prompt dla wszystkich modeli (agronom, JSON: uprawa / diagnoza PL + łac. / pewność), temperatura 0,1, przez OpenRouter.
- Trafienie = poprawna jednostka chorobowa w odpowiedzi (nazwa polska lub łacińska). Rozróżniamy choroby zwalczane różnie — np. rdza żółta ≠ rdza brunatna, zaraza ≠ alternarioza.
- Harness: `scripts/bench/vision-benchmark.test.ts`, surowe odpowiedzi: `scripts/bench/vision-benchmark-wyniki.json`.

## Wyniki

| Model | Trafność | Śr. czas | Koszt 8 zdjęć |
|---|---|---|---|
| **google/gemini-3.8-flash** | **8/8** | 6,1 s | $0,019 |
| google/gemini-3.5-flash-lite | 6/8 | **1,6 s** | $0,004 |
| anthropic/claude-sonnet-5.5 | 6/8 | 3,7 s | $0,029 |
| openai/gpt-5.6-terra | 6/8 | 7,9 s | $0,027 |
| x-ai/grok-4.7 | 6/8 | 20,3 s | $0,064 |
| qwen/qwen3.8-27b | 5/8 | 12,5 s | $0,013 |
| qwen/qwen3.8-flash | 3/8 | 7,3 s | $0,001 |
| openai/gpt-5.6-luna | 3/8 | 9,7 s | $0,004 |
| google/gemma-4-31b-it *(poprzedni)* | 3/8 | 16,3 s | $0,0004 |

## Najważniejsze błędy poprzedniego modelu (Gemma 4)

- **Zaraza ziemniaka rozpoznana jako alternarioza (2/2 zdjęć)** — inne patogeny, inne środki i terminy zabiegów. Najgroźniejszy możliwy błąd w ziemniaku.
- **Rdza żółta ↔ rdza brunatna zamienione miejscami** — różna epidemiologia i progi decyzji.
- Mączniak rozpoznany jako rdza.

## Decyzja (wdrożona w `src/lib/ai/openrouter.ts`)

Łańcuch z failoverem: **Gemini 3.8 Flash** → Claude Sonnet 5.5 (inny dostawca na wypadek awarii Google) → Gemini 3.5 Flash-Lite → Gemma 4 (darmowa, ostatnia deska ratunku).

Test end-to-end w aplikacji (zdjęcie zarazy, pole „Ziemniaki"): diagnoza „zaraza ziemniaka (Phytophthora infestans)", pewność wysoka, w różnicowaniu alternarioza z uzasadnieniem (biały nalot grzybni od spodu liścia), proponowany środek zweryfikowany w rejestrze MRiRW — 7 s.

## Ograniczenia i dalsze kroki

- Mała próba (8 zdjęć), zdjęcia „podręcznikowe". To ranking i sanity check, nie walidacja polowa — tę przewiduje pakiet WP3 projektu AGRO-ORBITA.
- Do rozbudowy: zestaw 50–100 zdjęć z polskich pól (septorioza paskowana, brunatna plamistość, zgnilizna twardzikowa rzepaku, zdrowe rośliny jako kontrola fałszywych alarmów) i powtarzanie benchmarku przy każdej nowej wersji modelu.
- Koszt przy skali: 1000 diagnoz/mies. ≈ 10 zł.
