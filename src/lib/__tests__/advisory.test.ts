import { describe, it, expect } from 'vitest';
import {
  ADVISORY_SHORT,
  ADVISORY_UI_NOTICE,
  PROMPT_ADVISORY_DISCIPLINE,
  SOR_VERIFICATION_POINTS,
  isPlantProtectionText,
  withAdvisoryDisclaimer,
} from '../advisory';
import { buildAgriclawSystemPrompt } from '../openclaw-prompt';
import { generateRecommendation } from '../recommendations';
import { BBCH_TABLES_FOR_TESTS } from '../bbch';

describe('advisory — treści bazowe', () => {
  it('4 punkty weryfikacji obejmują etykietę, pogodę, fazę i przepisy', () => {
    const joined = SOR_VERIFICATION_POINTS.join(' ').toLowerCase();
    expect(SOR_VERIFICATION_POINTS).toHaveLength(4);
    expect(joined).toContain('etykiet');
    expect(joined).toContain('mrirw');
    expect(joined).toMatch(/pogod/);
    expect(joined).toMatch(/bbch|faz/);
    expect(joined).toMatch(/przepis|karencj/);
  });

  it('krótkie zastrzeżenie i notka UI mówią o weryfikacji, nie o poleceniu', () => {
    expect(ADVISORY_SHORT.toLowerCase()).toContain('zweryfikuj');
    expect(ADVISORY_UI_NOTICE.toLowerCase()).toContain('nie polecenie');
    expect(ADVISORY_UI_NOTICE).toContain('etykiet');
  });

  it('dyscyplina promptu zakazuje rozkazu i wymusza weryfikację ŚOR', () => {
    const d = PROMPT_ADVISORY_DISCIPLINE.toLowerCase();
    expect(d).toContain('wsparcie decyzji');
    expect(d).toContain('nigdy');
    expect(d).toContain('etykiet');
    expect(d).toContain('karencj');
  });
});

describe('isPlantProtectionText — detekcja ŚOR', () => {
  it('wykrywa terminy ochrony roślin', () => {
    for (const s of [
      'fungicyd triazolowy w kłoszeniu',
      'okno oprysku jutro 5:30',
      'dawka 1 l/ha z etykiety',
      'zabieg herbicydem',
      'antytranspirant',
    ]) {
      expect(isPlantProtectionText(s)).toBe(true);
    }
  });

  it('nie oznacza treści bez ŚOR', () => {
    for (const s of [
      'NDVI 0.42 — pole w dobrej kondycji',
      'planuj termin zbioru',
      'sprawdź wilgotność gleby łopatą',
      null,
      undefined,
      '',
    ]) {
      expect(isPlantProtectionText(s)).toBe(false);
    }
  });
});

describe('prompt agenta zawiera dyscyplinę wsparcia decyzji', () => {
  it('buildAgriclawSystemPrompt wstrzykuje dyscyplinę i zakaz rozkazu', () => {
    const prompt = buildAgriclawSystemPrompt({
      farmId: 'f1',
      farmName: 'Testowe',
      address: 'Wieś',
      fields: [{ id: 'p1', name: 'Pole 1', crop: 'wheat', areaHectares: 10 }],
    });
    expect(prompt).toContain('WSPARCIE DECYZJI');
    expect(prompt.toLowerCase()).toContain('etykiet');
    // Zły przykład rozkazu jest oznaczony jako "NIE tak"
    expect(prompt).toMatch(/NIE tak/);
  });
});

describe('withAdvisoryDisclaimer — twardy bezpiecznik poza LLM', () => {
  it('dokleja zastrzeżenie do zalecenia ŚOR bez odwołania do etykiety', () => {
    const out = withAdvisoryDisclaimer('Jutro 5:30 pryskaj Prosaro 1 l/ha.');
    expect(out).toContain(ADVISORY_SHORT);
    expect(out.startsWith('Jutro 5:30 pryskaj')).toBe(true);
  });

  it('NIE dubluje gdy model sam przypomniał o etykiecie', () => {
    const text = 'Rozważ fungicyd T2 — dawkę potwierdź z etykietą (MRiRW).';
    expect(withAdvisoryDisclaimer(text)).toBe(text);
  });

  it('nie rusza tekstów bez ŚOR', () => {
    const text = 'NDVI 0.72, pole w dobrej kondycji. Kolejna analiza za 3 dni.';
    expect(withAdvisoryDisclaimer(text)).toBe(text);
  });
});

describe('alerty BBCH — framing wsparcia decyzji', () => {
  it('każdy alert ŚOR w tabelach BBCH ma framing warunkowy (okno/rozważ/ew./wg etykiety)', () => {
    const conditional = /okno|rozważ|ew\.|wg etykiet|do rozważenia|jeśli/i;
    for (const [crop, table] of Object.entries(BBCH_TABLES_FOR_TESTS)) {
      for (const m of table.milestones) {
        for (const alert of m.alerts ?? []) {
          if (isPlantProtectionText(alert)) {
            expect(
              conditional.test(alert),
              `Alert ŚOR bez framingu warunkowego [${crop} BBCH ${m.bbch}]: "${alert}"`,
            ).toBe(true);
          }
        }
      }
    }
  });

  it('żaden alert BBCH nie poleca wycofanych/konkretnych środków handlowych bez zastrzeżenia', () => {
    for (const table of Object.values(BBCH_TABLES_FOR_TESTS)) {
      for (const m of table.milestones) {
        for (const alert of m.alerts ?? []) {
          expect(alert).not.toMatch(/chlorotalonil/i);
          // Nazwy handlowe dopuszczalne tylko z odesłaniem do etykiety
          if (/Revus|Infinito|Prosaro|Amistar|Caryx/i.test(alert)) {
            expect(alert.toLowerCase()).toMatch(/etykiet|mrirw/);
          }
        }
      }
    }
  });
});

describe('disease-models — brak substancji wycofanych z UE (runtime)', () => {
  it('model Alternarii nie zaleca chlorotalonilu (wycofany 2020, rozp. 2019/677)', async () => {
    const { assessDiseaseRisks } = await import('../disease-models');
    // 7 ciepłych i wilgotnych dni → wyzwala model Alternarii dla ziemniaka
    const daily = {
      dates: Array.from({ length: 7 }, (_, i) => `2026-07-0${i + 1}`),
      tempMax: [24, 25, 26, 24, 25, 26, 24],
      tempMin: [14, 15, 15, 14, 15, 15, 14],
      precipitation: [3, 4, 2, 3, 4, 2, 3],
      et0: [3, 3, 3, 3, 3, 3, 3],
      soilMoistureShallow: [0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35],
      windMaxKmh: [10, 10, 10, 10, 10, 10, 10],
    };
    const risks = assessDiseaseRisks({ crop: 'potato', hourly: [], daily, ndviMean: 0.6 });
    const alternaria = risks.find((r) => /alternaria/i.test(r.disease));
    expect(alternaria).toBeTruthy();
    expect(alternaria!.action.toLowerCase()).not.toContain('chlorotalonil');
    // Wszystkie wygenerowane zalecenia — bez wycofanej substancji
    for (const r of risks) {
      expect(r.action.toLowerCase()).not.toContain('chlorotalonil');
    }
  });
});

describe('rule-engine — rekomendacja choroby wymusza weryfikację z etykietą', () => {
  it('podejrzenie choroby: action mówi o potwierdzeniu i etykiecie, nie o rozkazie', () => {
    const rec = generateRecommendation({
      crop: 'wheat',
      ndviMean: 0.6,
      ndviPrevious: 0.75, // spadek 0.15
      daysWithoutRain: 1,
      avgEt0Next7: 2,
      monthOfYear: 5, // poza oknem senescencji
    });
    expect(rec.title.toLowerCase()).toContain('choroba');
    expect(rec.action.toLowerCase()).toContain('etykiet');
    expect(rec.action.toLowerCase()).toContain('po potwierdzeniu');
    // Nie może być rozkazu typu "zastosuj fungicyd" bez warunku
    expect(rec.action).not.toMatch(/^Zastosuj fungicyd/i);
  });
});
