/**
 * Pusty (przezroczysty) PNG kompresuje się ~250:1, prawdziwa heatmapa ≥ ~20:1 (zmierzone
 * na polach demo: pusty ≈ 0,3 kB, realny 3–9 kB przy 256 px). Próg 100:1 — bez dekodera PNG.
 */
export function looksEmptyPng(bytes: number, width: number, height: number): boolean {
  return bytes < (width * height) / 100;
}
