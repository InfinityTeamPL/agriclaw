'use client';

// Miniatura pola z PRAWDZIWEGO zdjęcia satelitarnego (heatmapa NDVI Sentinel-2)
// zamiast płaskiego, kolorowego wielokąta. Pokazuje rolnikowi rzeczywisty rozkład
// kondycji w polu już na liście — to jest „wow" aplikacji.
//
// Koszt pod kontrolą: kafel 256 px (≈1/16 dużej warstwy), ładowany dopiero gdy
// karta wjedzie w widok (IntersectionObserver), odpowiedź cache'owana 6 h
// (lib/http/cache). Gdy brak danych (chmury, brak CDSE) — wraca do wielokąta.

import { useEffect, useRef, useState } from 'react';
import { PolygonThumb } from '@/components/dashboard/PolygonThumb';

interface Props {
  fieldId: string;
  polygon: GeoJSON.Polygon;
  fallbackColor: string;
  className?: string;
}

export function FieldSatThumb({ fieldId, polygon, fallbackColor, className }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || src || failed) return;
    let alive = true;
    const load = () => {
      fetch(`/api/analysis/${fieldId}/layer?type=ndvi&size=256`)
        .then(async (r) => {
          if (!r.ok) throw new Error(String(r.status));
          return (await r.json()) as { dataUrl?: string };
        })
        .then((d) => {
          if (alive && d.dataUrl) setSrc(d.dataUrl);
          else if (alive) setFailed(true);
        })
        .catch(() => alive && setFailed(true));
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          load();
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => {
      alive = false;
      io.disconnect();
    };
  }, [fieldId, src, failed]);

  return (
    <div ref={rootRef} className={className}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URL z API, nie statyczny asset
        <img
          src={src}
          alt="Heatmapa NDVI pola z satelity Sentinel-2"
          className="w-full h-full object-contain [filter:drop-shadow(0_0_0.6px_rgba(255,255,255,0.9))_drop-shadow(0_1px_2px_rgba(0,0,0,0.25))]"
        />
      ) : (
        <PolygonThumb
          polygon={polygon}
          color={fallbackColor}
          className={`w-full h-full ${failed ? '' : 'animate-pulse'}`}
        />
      )}
    </div>
  );
}
