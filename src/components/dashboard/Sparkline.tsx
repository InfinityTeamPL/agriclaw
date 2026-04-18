'use client';

// Mini sparkline SVG dla historii NDVI.
// Akceptuje tablicę wartości [0..1], rysuje line + area + ostatni punkt.

import { useMemo } from 'react';

interface Props {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({
  values,
  color = '#059669',
  width = 120,
  height = 36,
  className,
}: Props) {
  const { path, area, lastPoint } = useMemo(() => {
    if (values.length === 0) {
      return { path: '', area: '', lastPoint: null as null | { x: number; y: number } };
    }
    const pad = 2;
    const n = values.length;
    const min = 0;
    const max = 1;
    const xStep = n > 1 ? (width - pad * 2) / (n - 1) : 0;
    const yScale = (v: number) =>
      pad + (1 - (v - min) / (max - min)) * (height - pad * 2);

    const pts = values.map((v, i) => ({
      x: pad + i * xStep,
      y: yScale(v),
    }));

    const d = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');

    const a =
      d +
      ` L ${pts[pts.length - 1].x.toFixed(1)} ${height - pad} L ${pts[0].x.toFixed(
        1,
      )} ${height - pad} Z`;

    return { path: d, area: a, lastPoint: pts[pts.length - 1] };
  }, [values, width, height]);

  if (values.length === 0) return null;

  const gradId = `spark-${color.replace('#', '')}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className ?? 'w-full h-9'}
      role="img"
      aria-label="Trend NDVI"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} stroke="none" />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {lastPoint && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={2.5}
          fill={color}
          stroke="#fff"
          strokeWidth={1.2}
        />
      )}
    </svg>
  );
}
