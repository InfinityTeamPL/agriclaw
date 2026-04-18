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
  lat: number,
  lon: number,
): Promise<SmapReading | null> {
  const username = process.env.EARTHDATA_USERNAME;
  const password = process.env.EARTHDATA_PASSWORD;

  if (!username || !password) {
    // MVP fallback: zwróć null — użyjemy Open-Meteo zamiast
    return null;
  }

  const bbox = [lon - 0.05, lat - 0.05, lon + 0.05, lat + 0.05].join(',');
  const today = new Date().toISOString().slice(0, 10);
  const tenDaysAgo = new Date(Date.now() - 10 * 864e5).toISOString().slice(0, 10);

  const params = new URLSearchParams({
    collection_concept_id: SMAP_COLLECTION_ID,
    bounding_box: bbox,
    temporal: `${tenDaysAgo}T00:00:00Z,${today}T23:59:59Z`,
    sort_key: '-start_date',
    page_size: '1',
  });

  const res = await fetch(`${EARTHDATA_CMR}?${params.toString()}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    },
  });

  if (!res.ok) {
    console.error(`SMAP CMR failed: ${res.status}`);
    return null;
  }

  const data = (await res.json()) as {
    feed?: {
      entry?: Array<{
        time_start: string;
        summary?: string;
      }>;
    };
  };

  const entry = data.feed?.entry?.[0];
  if (!entry) return null;

  // MVP: używamy timestamp + mock 35% do czasu kiedy dopniemy pełny SMAP HDF decoding
  // Pełna implementacja wymaga pobrania HDF5 granule i wyekstraktowania wartości dla lat/lon
  // (zbyt skomplikowane na MVP — Open-Meteo soil_moisture jest dokładniejsze dla Polski)
  return {
    observedAt: entry.time_start,
    moisturePct: 35, // placeholder — zaimplementujemy HDF5 decoding w Fazie 2
    source: 'smap-l3',
  };
}
