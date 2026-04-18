// Klasyfikacje + opisy dla wszystkich indeksów wegetacyjnych Sentinel-2.
// Używane w UI i agent prompts.

import { computeNdviStats, type NdviStats } from './ndvi';

export type IndexKey = 'ndvi' | 'ndre' | 'ndwi' | 'savi';

export interface IndexMetadata {
  key: IndexKey;
  name: string;
  fullName: string;
  shortDesc: string;
  bands: string;
  interpretsFor: string;
  good: string; // co znaczy wysoka wartość
  bad: string; // co znaczy niska wartość
  phaseRecommended: string; // kiedy używać
}

export const INDICES: Record<IndexKey, IndexMetadata> = {
  ndvi: {
    key: 'ndvi',
    name: 'NDVI',
    fullName: 'Normalized Difference Vegetation Index',
    shortDesc: 'Ogólne zdrowie roślin',
    bands: 'B08 (NIR), B04 (Red)',
    interpretsFor: 'Biomasa, pokrycie zielone',
    good: 'Gęsta, zdrowa wegetacja',
    bad: 'Stres, susza, choroba, goła ziemia',
    phaseRecommended: 'Cały sezon',
  },
  ndre: {
    key: 'ndre',
    name: 'NDRE',
    fullName: 'Normalized Difference Red Edge',
    shortDesc: 'Niedobór azotu',
    bands: 'B08 (NIR), B05 (Red Edge)',
    interpretsFor: 'Zawartość chlorofilu / stan azotu',
    good: 'Wystarczający azot',
    bad: 'Niedobór azotu — rozważ dokarmianie',
    phaseRecommended: 'Faza kłoszenia, zaawansowana wegetacja',
  },
  ndwi: {
    key: 'ndwi',
    name: 'NDWI',
    fullName: 'Normalized Difference Water Index (Gao)',
    shortDesc: 'Stres wodny w liściach',
    bands: 'B08 (NIR), B11 (SWIR)',
    interpretsFor: 'Zawartość wody w tkankach rośliny',
    good: 'Dobre uwodnienie',
    bad: 'Roślina traci wodę szybciej niż pobiera — oprysk + zacienienie',
    phaseRecommended: 'Okresy suche, szczyt wegetacji',
  },
  savi: {
    key: 'savi',
    name: 'SAVI',
    fullName: 'Soil-Adjusted Vegetation Index',
    shortDesc: 'Wegetacja skorygowana o glebę',
    bands: 'B08 (NIR), B04 (Red), L=0.5',
    interpretsFor: 'Biomasa w warunkach odsłoniętej gleby',
    good: 'Rośliny rosną dobrze mimo widocznej ziemi',
    bad: 'Mało biomasy — wschody się nie udały albo stres',
    phaseRecommended: 'Wschody, wczesna wegetacja (gdy NDVI zaniża)',
  },
};

export interface IndicesReading {
  ndvi: NdviStats;
  ndre: NdviStats;
  ndwi: NdviStats;
  savi: NdviStats;
}

export function computeAllIndices(rasters: {
  ndvi: Float32Array;
  ndre: Float32Array;
  ndwi: Float32Array;
  savi: Float32Array;
}): IndicesReading {
  return {
    ndvi: computeNdviStats(rasters.ndvi),
    ndre: computeNdviStats(rasters.ndre),
    ndwi: computeNdviStats(rasters.ndwi),
    savi: computeNdviStats(rasters.savi),
  };
}

/**
 * Dla NDRE — interpretacja stanu azotowego.
 * Progi kalibrowane empirycznie dla pszenicy w fazie kłoszenia.
 */
export function interpretNdre(ndreMean: number, crop: string): string {
  const isCereal = ['wheat', 'barley', 'rye', 'oats'].includes(crop);
  if (ndreMean < 0.2) {
    return isCereal
      ? 'Silny niedobór azotu — dokarm pilnie mocznikiem 46% lub saletrą 20 kg N/ha'
      : 'Niski poziom azotu';
  }
  if (ndreMean < 0.3) {
    return isCereal
      ? 'Azot graniczny — rozważ dokarmianie dolistne (mocznik 5%)'
      : 'Azot na dolnej granicy optimum';
  }
  if (ndreMean < 0.45) {
    return 'Azot wystarczający na aktualnej fazie';
  }
  return 'Dużo azotu — ryzyko wylegania, rozważ CCC (chlorek chlorocholiny)';
}

/**
 * Dla NDWI (Gao) — interpretacja stanu wodnego rośliny.
 */
export function interpretNdwi(ndwiMean: number): string {
  if (ndwiMean < -0.1) return 'Silny stres wodny — liście zaczynają tracić wodę';
  if (ndwiMean < 0.0) return 'Roślina pod stresem wodnym, oczekuj zaraz zwiędnięcia';
  if (ndwiMean < 0.2) return 'Umiarkowana dostępność wody';
  return 'Dobre uwodnienie tkanek';
}

/**
 * Dla SAVI — kiedy NDVI zaniża bo dużo gleby widoczne.
 */
export function interpretSavi(saviMean: number, ndviMean: number): string {
  const diff = saviMean - ndviMean;
  if (diff > 0.08) {
    return 'SAVI znacząco wyższe niż NDVI — gleba zafałszowuje odczyt, polegaj na SAVI';
  }
  if (saviMean < 0.2) {
    return 'Mało biomasy — wschody słabe lub ściernisko';
  }
  return 'SAVI zgodne z NDVI — pokrywa zielona dominuje';
}
