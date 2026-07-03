// Sygnatura marki AgriClaw: pasek ciągłej rampy NDVI. Powtarza się w całym
// produkcie (pod logo, górna krawędź kart danych, podkreślenie w hero, legenda),
// budując rozpoznawalność wokół jedynego unikalnego assetu — koloru danych.

import { NDVI_LEGEND, ndviRampGradient } from '@/lib/design/ndvi-scale';

export function NdviKeyline({
  className = '',
  height = 3,
  rounded = true,
}: {
  className?: string;
  height?: number;
  rounded?: boolean;
}) {
  return (
    <div
      className={`w-full ${rounded ? 'rounded-full' : ''} ${className}`}
      style={{ height, background: ndviRampGradient() }}
      aria-hidden="true"
    />
  );
}

export function NdviLegend({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="h-2 flex-1 rounded-full"
        style={{ background: ndviRampGradient() }}
        aria-hidden="true"
      />
      <div className="flex gap-3">
        {NDVI_LEGEND.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 hud-label">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: s.hex }}
            />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
