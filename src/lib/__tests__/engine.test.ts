import { describe, it, expect } from 'vitest';
import { resolveChatEngine, isChatEnginePreference } from '../agent/engine';

describe('resolveChatEngine — wybór silnika należy do rolnika', () => {
  it('auto (legacy default w DB): zawsze wbudowany — OpenClaw tylko przy jawnym wyborze', () => {
    expect(resolveChatEngine('auto', true)).toBe('agroagent');
    expect(resolveChatEngine('auto', false)).toBe('agroagent');
  });

  it('jawny wybór wbudowanego wygrywa nawet przy wdrożonym OpenClaw', () => {
    expect(resolveChatEngine('agroagent', true)).toBe('agroagent');
    expect(resolveChatEngine('agroagent', false)).toBe('agroagent');
  });

  it('jawny wybór OpenClaw bez agenta → unavailable (BEZ cichego fallbacku)', () => {
    expect(resolveChatEngine('openclaw', true)).toBe('openclaw');
    expect(resolveChatEngine('openclaw', false)).toBe('openclaw_unavailable');
  });

  it('nieznana/pusta preferencja → wbudowany (bezpieczny default)', () => {
    expect(resolveChatEngine(null, true)).toBe('agroagent');
    expect(resolveChatEngine(undefined, false)).toBe('agroagent');
    expect(resolveChatEngine('cokolwiek', false)).toBe('agroagent');
  });

  it('isChatEnginePreference waliduje wartości do PATCH', () => {
    expect(isChatEnginePreference('auto')).toBe(true);
    expect(isChatEnginePreference('agroagent')).toBe(true);
    expect(isChatEnginePreference('openclaw')).toBe(true);
    expect(isChatEnginePreference('gpt4o')).toBe(false);
  });
});
