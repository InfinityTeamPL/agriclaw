// Interpretacja Sentinel-1 SAR dla rolnictwa.
// VV (Vertical-Vertical) i VH (Vertical-Horizontal) są w dB.
// RVI (Radar Vegetation Index) normalizuje 4*VH / (VV+VH) = 0..1.

import { computeNdviStats, type NdviStats } from './ndvi';

export interface RadarStats {
  vv: NdviStats; // dB, typical -25..-5
  vh: NdviStats; // dB, typical -30..-10
  rvi: NdviStats; // 0..1 (wyższy = więcej biomasy)
}

export function computeRadarStats(rasters: {
  vv: Float32Array;
  vh: Float32Array;
  rvi: Float32Array;
}): RadarStats {
  return {
    vv: computeNdviStats(rasters.vv),
    vh: computeNdviStats(rasters.vh),
    rvi: computeNdviStats(rasters.rvi),
  };
}

/**
 * Interpretacja radarowa — wykrywa anomalie które optyczne NDVI może przegapić.
 * - Spadek VH o >3 dB w tygodniu → wyleganie zboża (burza, grad)
 * - Wysokie VV niskie VH → goła ziemia, ściernisko, orka
 * - Nagły wzrost VH + niskie VV → zalanie (woda stojąca)
 * - Wysokie RVI (>0.4) → gęsta, zdrowa biomasa — potwierdza NDVI
 */
export function interpretRadar(
  current: RadarStats,
  previous: RadarStats | null,
): {
  diagnosis: string;
  severity: 'none' | 'low' | 'medium' | 'high';
  details: string;
} {
  const vvDelta = previous ? current.vv.mean - previous.vv.mean : 0;
  const vhDelta = previous ? current.vh.mean - previous.vh.mean : 0;

  // Wyleganie — gwałtowny spadek VH (roślina leży → mniej odbicia)
  if (vhDelta < -3 && previous) {
    return {
      diagnosis: 'Możliwe wyleganie',
      severity: 'high',
      details: `VH spadło o ${vhDelta.toFixed(1)} dB od poprzedniej obserwacji. Pole po burzy lub gradzie — rośliny mogą leżeć. Sprawdź wizualnie.`,
    };
  }

  // Zalanie — nagły wzrost VH (woda + odbicie)
  if (vhDelta > 4 && previous && current.vv.mean < -15) {
    return {
      diagnosis: 'Możliwe zalanie',
      severity: 'high',
      details: `Wzrost VH ${vhDelta.toFixed(1)} dB + niskie VV (${current.vv.mean.toFixed(1)} dB). Pole mogło zostać zalane.`,
    };
  }

  // Orka / ściernisko
  if (current.rvi.mean < 0.2 && current.vv.mean > -10) {
    return {
      diagnosis: 'Goła gleba lub ściernisko',
      severity: 'low',
      details: `RVI ${current.rvi.mean.toFixed(2)} + VV ${current.vv.mean.toFixed(1)} dB — pole po zbiorach lub świeżo zaorane.`,
    };
  }

  // Zdrowa wegetacja
  if (current.rvi.mean > 0.4) {
    return {
      diagnosis: 'Gęsta roślinność',
      severity: 'none',
      details: `RVI ${current.rvi.mean.toFixed(2)} — potwierdza wysoką biomasę. Brak anomalii radarowych.`,
    };
  }

  return {
    diagnosis: 'Stan normalny',
    severity: 'none',
    details: `VV ${current.vv.mean.toFixed(1)} dB, VH ${current.vh.mean.toFixed(1)} dB, RVI ${current.rvi.mean.toFixed(2)} — typowe wartości dla tej pory roku.`,
  };
}
