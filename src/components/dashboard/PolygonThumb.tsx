'use client';

// Mini SVG thumbnail poligonu pola z GeoJSON.
// Liczy bounds, projektuje na viewBox 100x70 zachowując aspect ratio.

import { useMemo } from 'react';

interface Props {
  polygon: GeoJSON.Polygon;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export function PolygonThumb({
  polygon,
  color = '#10b981',
  className,
  strokeWidth = 1.5,
}: Props) {
  const path = useMemo(() => {
    const coords = polygon.coordinates[0] ?? [];
    if (coords.length < 3) return null;

    let minLon = Infinity;
    let maxLon = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    for (const [lon, lat] of coords as [number, number][]) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }

    const w = maxLon - minLon || 1;
    const h = maxLat - minLat || 1;
    const pad = 6;
    const vbW = 100;
    const vbH = 70;
    const sx = (vbW - pad * 2) / w;
    const sy = (vbH - pad * 2) / h;
    const scale = Math.min(sx, sy);
    const offsetX = (vbW - w * scale) / 2;
    const offsetY = (vbH - h * scale) / 2;

    return (coords as [number, number][])
      .map(([lon, lat], i) => {
        const x = offsetX + (lon - minLon) * scale;
        // invert Y (lat up is +, SVG down is +)
        const y = vbH - offsetY - (lat - minLat) * scale;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ') + ' Z';
  }, [polygon]);

  if (!path) return null;

  return (
    <svg
      viewBox="0 0 100 70"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Zarys pola"
    >
      <defs>
        <linearGradient id={`poly-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill={`url(#poly-grad-${color.replace('#', '')})`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}
