import { describe, it, expect } from 'vitest';
import { looksEmptyPng } from '../png';

describe('looksEmptyPng', () => {
  it('pusty przezroczysty kafel 256 px (~0,3 kB) → pusty', () => {
    expect(looksEmptyPng(300, 256, 170)).toBe(true);
  });
  it('realne miniatury z pól demo (3–9 kB) → nie pusty', () => {
    expect(looksEmptyPng(3000, 256, 170)).toBe(false);
    expect(looksEmptyPng(9000, 256, 256)).toBe(false);
  });
  it('duża nakładka 1024²: pusty ~4 kB, realna ≥ 20 kB', () => {
    expect(looksEmptyPng(4000, 1024, 1024)).toBe(true);
    expect(looksEmptyPng(25000, 1024, 1024)).toBe(false);
  });
});
