// NASA SMAP L3 Soil Moisture client
// SMAP daje wilgotność gleby 9km globalnie, co 2-3 dni.
// Używamy proxy przez OpenAccessHub lub bezpośrednio Earthdata Search API.
//
// UWAGA dla MVP: NASA Earthdata wymaga rejestracji + basic auth.
// Dla rolników w Polsce (9km rozdzielczość jest za gruba per-pole),
// Open-Meteo soil_moisture_0_to_7cm jest dokładniejsze — używamy SMAP
// jako walidację / backup kiedy Open-Meteo model fails.
//
// Docs: https://nsidc.org/data/spl3smp/versions/9
// API: https://cmr.earthdata.nasa.gov/search/granules.json

const EARTHDATA_CMR = 'https://cmr.earthdata.nasa.gov/search/granules.json';
const SMAP_COLLECTION_ID = 'C3212110253-NSIDC_CPRD'; // SPL3SMP V009

export interface SmapReading {
  observedAt: string; // ISO date
  moisturePct: number; // 0-100 (przekształcone z m3/m3 × 100)
  source: 'smap-l3';
}

/**
 * Zwraca najnowszy dostępny SMAP reading dla lokalizacji (bbox ±0.05°).
 * Dla MVP: zwraca mock dane jeśli credentials nie ustawione.
 */
export async function fetchSmapSoilMoisture(
  _lat: number,
  _lon: number,
): Promise<SmapReading | null> {
  // Dekodowanie HDF5 SMAP nie jest jeszcze zaimplementowane (Faza 2). Wcześniej ta
  // funkcja — przy ustawionych EARTHDATA_USERNAME/PASSWORD — zwracała zaszyte na
  // sztywno 35% jako realny odczyt 'smap-l3'. To AKTYWNIE tłumiło alert suszowy
  // (reguła: susza gdy NDVI < 0.35 i wilgotność < 25%) i zapisywało fikcję do bazy.
  // Dopóki nie ma realnego dekodowania granule — zwracamy null i korzystamy z
  // Open-Meteo soil_moisture_0_to_7cm (dokładniejsze dla PL). Patrz audyt 2.18.
  //
  // TODO(Faza 2): pobrać granule HDF5 (CMR: ${EARTHDATA_CMR}, kolekcja
  // ${SMAP_COLLECTION_ID}) i wyekstraktować wartość dla lat/lon zamiast placeholdera.
  return null;
}
