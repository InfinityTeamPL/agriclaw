// Sygnaturowy stan ładowania: linia skanu przelatująca po powierzchni — nawiązuje
// do metafory „skan pola z orbity" z landingu. Używana zamiast spinnerów przy
// ładowaniu warstw satelitarnych i jako szkielet (skeleton) danych.

export function ScanLine({
  className = '',
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-secondary ${className}`}
      role="status"
      aria-label={label ?? 'Skanowanie…'}
    >
      {/* przelatująca linia skanu w kolorze NDVI */}
      <div className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 animate-scan bg-gradient-to-r from-transparent via-signal-healthy/40 to-transparent" />
      {label && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="hud-label">{label}</span>
        </div>
      )}
    </div>
  );
}
