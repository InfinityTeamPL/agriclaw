import { describe, it, expect } from 'vitest';
import { ThinkFilter, accumulateStreamEvent, type LlmToolCall } from '../ai/minimax';

describe('ThinkFilter — usuwanie bloków <think> ze streamu', () => {
  it('usuwa blok w całości w jednym chunku', () => {
    const f = new ThinkFilter();
    expect(f.push('<think>rozważania</think>Dzień dobry') + f.flush()).toBe('Dzień dobry');
  });

  it('tag ROZCIĘTY między chunki (worst case streamu)', () => {
    const f = new ThinkFilter();
    let out = '';
    out += f.push('<thi');
    out += f.push('nk>sekretne rozumowanie</th');
    out += f.push('ink>Pole w dobrej kondycji.');
    out += f.flush();
    expect(out).toBe('Pole w dobrej kondycji.');
  });

  it('tekst przed i po bloku oraz wiele bloków', () => {
    const f = new ThinkFilter();
    let out = '';
    out += f.push('Cześć <think>a</think>rolniku, <think>b');
    out += f.push('c</think>NDVI 0.72.');
    out += f.flush();
    expect(out).toBe('Cześć rolniku, NDVI 0.72.');
  });

  it('niedomknięty blok na końcu → nic nie wycieka', () => {
    const f = new ThinkFilter();
    const out = f.push('Wynik: 5. <think>to nie powinno wyciec') + f.flush();
    expect(out).toBe('Wynik: 5. ');
  });

  it('fałszywy częściowy tag ("<th" w zwykłym tekście HTML-owym) wraca po flushu', () => {
    const f = new ThinkFilter();
    const out = f.push('a < b oraz <th') + f.flush();
    expect(out).toBe('a < b oraz <th');
  });
});

describe('accumulateStreamEvent — akumulacja tool_calls z delt', () => {
  it('skleja name i arguments z wielu delt po indeksie', () => {
    const acc = { toolCalls: [] as LlmToolCall[], finishReason: null as string | null };
    accumulateStreamEvent(
      { choices: [{ delta: { tool_calls: [{ index: 0, id: 'call_1', function: { name: 'get_field_', arguments: '' } }] } }] },
      acc,
    );
    accumulateStreamEvent(
      { choices: [{ delta: { tool_calls: [{ index: 0, function: { name: 'ndvi', arguments: '{"field' } }] } }] },
      acc,
    );
    accumulateStreamEvent(
      { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '_id":"abc"}' } }] }, finish_reason: 'tool_calls' }] },
      acc,
    );
    expect(acc.finishReason).toBe('tool_calls');
    expect(acc.toolCalls).toHaveLength(1);
    expect(acc.toolCalls[0]).toMatchObject({
      id: 'call_1',
      function: { name: 'get_field_ndvi', arguments: '{"field_id":"abc"}' },
    });
  });

  it('dwa równoległe tool_calls po index + delty content przechodzą', () => {
    const acc = { toolCalls: [] as LlmToolCall[], finishReason: null as string | null };
    const c1 = accumulateStreamEvent(
      { choices: [{ delta: { content: 'ok', tool_calls: [
        { index: 0, id: 'a', function: { name: 'x', arguments: '{}' } },
        { index: 1, id: 'b', function: { name: 'y', arguments: '{}' } },
      ] } }] },
      acc,
    );
    expect(c1).toBe('ok');
    expect(acc.toolCalls.map((t) => t.function.name)).toEqual(['x', 'y']);
  });
});
