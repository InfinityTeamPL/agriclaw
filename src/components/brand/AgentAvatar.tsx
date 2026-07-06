// Avatar AgroAgenta — sygnatura marki zamiast generycznej ikony bota:
// satelita skanujący łan (wiązka) + rampa NDVI jako dolna krawędź.
// `active` = pierścień skanu (agent pisze / online).

import { cn } from '@/lib/utils';

const NDVI_RAMP = ['#7f1d1d', '#dc2626', '#f97316', '#facc15', '#84cc16', '#16a34a', '#14532d'];

export function AgentAvatar({
  size = 40,
  active = false,
  className,
}: {
  size?: number;
  active?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn('relative shrink-0 select-none', className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Pierścień skanu przy aktywności */}
      {active && (
        <span className="absolute inset-0 rounded-lg ring-2 ring-signal-healthy/50 animate-pulse" />
      )}
      <svg
        viewBox="0 0 40 40"
        width={size}
        height={size}
        className="rounded-lg shadow-card"
      >
        {/* Tło: głęboka zieleń łanu */}
        <rect width="40" height="40" rx="8" fill="#14532d" />
        {/* Łuk orbity */}
        <path
          d="M6 15 Q20 5 34 15"
          fill="none"
          stroke="#a3e635"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeDasharray="2.5 3"
          opacity="0.8"
        />
        {/* Satelita: korpus + panele */}
        <g transform="translate(20 10.5)">
          <rect x="-2.6" y="-2" width="5.2" height="4" rx="1" fill="#f8fafc" />
          <rect x="-7.6" y="-1.2" width="4" height="2.4" rx="0.6" fill="#86efac" />
          <rect x="3.6" y="-1.2" width="4" height="2.4" rx="0.6" fill="#86efac" />
        </g>
        {/* Wiązka skanu */}
        <path d="M20 13.5 L13.5 29 L26.5 29 Z" fill="#a3e635" opacity="0.22" />
        {/* Łan: trzy kępy */}
        <g stroke="#86efac" strokeWidth="1.5" strokeLinecap="round" opacity="0.95">
          <path d="M12 31 v-3.4 M10.6 31 l1.4-2.4 M13.4 31 l-1.4-2.4" />
          <path d="M20 31 v-4.4 M18.4 31 l1.6-3 M21.6 31 l-1.6-3" />
          <path d="M28 31 v-3.4 M26.6 31 l1.4-2.4 M29.4 31 l-1.4-2.4" />
        </g>
        {/* Rampa NDVI — dolna krawędź (sygnatura) */}
        {NDVI_RAMP.map((c, i) => (
          <rect
            key={c}
            x={4 + i * (32 / NDVI_RAMP.length)}
            y="34.5"
            width={32 / NDVI_RAMP.length}
            height="2.4"
            fill={c}
            rx={i === 0 || i === NDVI_RAMP.length - 1 ? 1.2 : 0}
          />
        ))}
      </svg>
    </div>
  );
}
