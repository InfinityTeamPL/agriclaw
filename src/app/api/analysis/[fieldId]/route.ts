import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getCopernicusClient, extractMultiIndexValues } from '@/lib/satellite/copernicus';
import { classifyNdvi, describeNdvi } from '@/lib/satellite/ndvi';
import { computeAllIndices, interpretNdre, interpretNdwi, interpretSavi } from '@/lib/satellite/indices';
import { fetchWeatherForecast, fetchSprayForecast } from '@/lib/satellite/weather';
import { fetchSmapSoilMoisture } from '@/lib/satellite/smap';
import { generateRecommendation } from '@/lib/recommendations';
import { generateMockNdvi, isCopernicusConfigured } from '@/lib/satellite/ndvi-mock';
import { assessDiseaseRisks } from '@/lib/disease-models';

export async function POST(
  _req: NextRequest,
  { params }: { params: { fieldId: string } },
) {
  const { user } = await requireAuth();

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      farm_id: string;
      crop: string;
      polygon: string;
      centroid_lat: number;
      centroid_lon: number;
    }>
  >`
    SELECT f.id, f.farm_id, f.crop,
           ST_AsGeoJSON(f.polygon)::text AS polygon,
           ST_Y(ST_Centroid(f.polygon)) AS centroid_lat,
           ST_X(ST_Centroid(f.polygon)) AS centroid_lon
    FROM "fields" f
    JOIN "farms" fa ON fa.id = f.farm_id
    WHERE f.id = ${params.fieldId} AND fa.user_id = ${user.id}
  `;

  const field = rows[0];
  if (!field) return NextResponse.json({ error: 'Field not found' }, { status: 404 });

  const polygon = JSON.parse(field.polygon) as GeoJSON.Polygon;
  const today = new Date().toISOString().slice(0, 10);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);

  // Równolegle: pogoda + SMAP + hourly do disease models
  const [weather, smap, sprayForecast] = await Promise.allSettled([
    fetchWeatherForecast(field.centroid_lat, field.centroid_lon, 7),
    fetchSmapSoilMoisture(field.centroid_lat, field.centroid_lon),
    fetchSprayForecast(field.centroid_lat, field.centroid_lon),
  ]);

  // 4 indeksy Sentinel-2 (NDVI, NDRE, NDWI, SAVI) w jednym zapytaniu do CDSE.
  // Gdy brak credentials — deterministyczny mock tylko dla NDVI (reszta = 0 placeholder).
  type IdxStats = { mean: number; min: number; max: number; validCount: number; stddev: number };
  let indices: { ndvi: IdxStats; ndre: IdxStats; ndwi: IdxStats; savi: IdxStats };
  let isMock = false;
  let cdseError: string | undefined;

  if (isCopernicusConfigured()) {
    try {
      const tiff = await getCopernicusClient().fetchMultiIndexGeotiff(
        polygon,
        fourteenDaysAgo,
        today,
      );
      const rasters = await extractMultiIndexValues(tiff);
      indices = computeAllIndices(rasters);
    } catch (err) {
      cdseError = String(err);
      const mock = generateMockNdvi({
        fieldId: field.id,
        crop: field.crop,
        lat: field.centroid_lat,
        lon: field.centroid_lon,
      });
      indices = {
        ndvi: mock,
        // Mock estymacje pozostałych indeksów na podstawie NDVI
        ndre: { ...mock, mean: mock.mean * 0.55, min: mock.min * 0.5, max: mock.max * 0.6 },
        ndwi: { ...mock, mean: mock.mean * 0.3 - 0.05, min: mock.min * 0.3 - 0.08, max: mock.max * 0.35 },
        savi: { ...mock, mean: mock.mean * 1.15, min: mock.min * 1.1, max: mock.max * 1.2 },
      };
      isMock = true;
    }
  } else {
    const mock = generateMockNdvi({
      fieldId: field.id,
      crop: field.crop,
      lat: field.centroid_lat,
      lon: field.centroid_lon,
    });
    indices = {
      ndvi: mock,
      ndre: { ...mock, mean: mock.mean * 0.55, min: mock.min * 0.5, max: mock.max * 0.6 },
      ndwi: { ...mock, mean: mock.mean * 0.3 - 0.05, min: mock.min * 0.3 - 0.08, max: mock.max * 0.35 },
      savi: { ...mock, mean: mock.mean * 1.15, min: mock.min * 1.1, max: mock.max * 1.2 },
    };
    isMock = true;
  }
  const stats = indices.ndvi; // backward-compat alias dla dalszej logiki

  // Brak bezchmurnych pikseli w oknie 14 dni: po masce chmur SCL raster jest w
  // całości NaN → validCount === 0, a computeNdviStats zwraca mean = 0. NIE
  // zapisujemy takiego "0" jako pomiaru (zatruwałby historię i wywołał fałszywy
  // alarm suszowy przy NDVI < 0.35). Dotyczy tylko realnych danych — mock zawsze
  // ma validCount > 0. Patrz audyt 1.2 / 2.8.
  if (!isMock && indices.ndvi.validCount === 0) {
    return NextResponse.json(
      {
        fieldId: field.id,
        status: 'no_clear_imagery',
        message:
          'Brak bezchmurnego zdjęcia satelitarnego w ostatnich 14 dniach. Sprawdź radar Sentinel-1 (widzi przez chmury) albo spróbuj ponownie za kilka dni.',
        cdse_error: cdseError,
      },
      { status: 200 },
    );
  }

  // Previous NDVI dla porównania (tylko realne pomiary — mock nie może zafałszować trendu)
  const previousReading = await prisma.ndviReading.findFirst({
    where: { fieldId: field.id, source: { not: 'mock' } },
    orderBy: { observedAt: 'desc' },
  });

  // Zapisz wszystkie 4 indeksy
  const reading = await prisma.ndviReading.create({
    data: {
      fieldId: field.id,
      observedAt: new Date(),
      ndviMean: indices.ndvi.mean,
      ndviMin: indices.ndvi.min,
      ndviMax: indices.ndvi.max,
      ndreMean: indices.ndre.mean,
      ndreMin: indices.ndre.min,
      ndreMax: indices.ndre.max,
      ndwiMean: indices.ndwi.mean,
      ndwiMin: indices.ndwi.min,
      ndwiMax: indices.ndwi.max,
      saviMean: indices.savi.mean,
      saviMin: indices.savi.min,
      saviMax: indices.savi.max,
      validCount: indices.ndvi.validCount,
      cloudCover: 0,
      source: isMock ? 'mock' : 'sentinel-2',
    },
  });

  // Weather dla rekomendacji
  const weatherSummary =
    weather.status === 'fulfilled'
      ? weather.value
      : { daysWithoutRain: 0, avgEt0Next7: 2.5, totalPrecipNext7: 0, droughtRiskLevel: 'low' as const, daily: null };

  // SMAP reading (opcjonalne)
  let soilMoisturePct: number | undefined;
  if (smap.status === 'fulfilled' && smap.value) {
    soilMoisturePct = smap.value.moisturePct;
    await prisma.soilMoistureReading.create({
      data: {
        fieldId: field.id,
        observedAt: new Date(smap.value.observedAt),
        moisturePct: smap.value.moisturePct,
        source: smap.value.source,
      },
    });
  }

  // Wygeneruj rekomendację rule-based
  const recommendation = generateRecommendation({
    crop: field.crop,
    ndviMean: stats.mean,
    ndviPrevious: previousReading?.ndviMean,
    daysWithoutRain: weatherSummary.daysWithoutRain,
    avgEt0Next7: weatherSummary.avgEt0Next7,
    soilMoisturePct,
    monthOfYear: new Date().getMonth() + 1,
  });

  const savedRec = await prisma.recommendation.create({
    data: {
      fieldId: field.id,
      severity: recommendation.severity,
      title: recommendation.title,
      message: recommendation.message,
      action: recommendation.action,
    },
  });

  // Disease-specific risk assessment (Septoria/Fusarium/rdza/Phytophthora/mączniak/Alternaria/Phoma)
  const diseaseRisks =
    sprayForecast.status === 'fulfilled' && weather.status === 'fulfilled'
      ? assessDiseaseRisks({
          crop: field.crop,
          hourly: sprayForecast.value.hourly,
          daily: weatherSummary.daily,
          ndviMean: indices.ndvi.mean,
          ndviPrevious: previousReading?.ndviMean,
        })
      : [];

  // Zapisz disease recommendations z wysokim ryzykiem
  for (const risk of diseaseRisks.filter((r) => r.risk === 'high')) {
    await prisma.recommendation.create({
      data: {
        fieldId: field.id,
        severity: 'high',
        title: risk.disease,
        message: risk.reason,
        action: risk.action,
      },
    });
  }

  return NextResponse.json({
    fieldId: field.id,
    observedAt: reading.observedAt.toISOString(),
    ndvi: {
      mean: indices.ndvi.mean,
      min: indices.ndvi.min,
      max: indices.ndvi.max,
      validCount: indices.ndvi.validCount,
      stddev: indices.ndvi.stddev,
      classification: classifyNdvi(indices.ndvi.mean),
      description: describeNdvi(indices.ndvi.mean, field.crop),
      source: isMock ? 'mock' : 'sentinel-2',
      mock: isMock,
      cdse_error: cdseError,
      trend: previousReading
        ? {
            previousMean: previousReading.ndviMean,
            previousObservedAt: previousReading.observedAt.toISOString(),
            delta: indices.ndvi.mean - previousReading.ndviMean,
          }
        : null,
    },
    ndre: {
      mean: indices.ndre.mean,
      min: indices.ndre.min,
      max: indices.ndre.max,
      interpretation: interpretNdre(indices.ndre.mean, field.crop),
    },
    ndwi: {
      mean: indices.ndwi.mean,
      min: indices.ndwi.min,
      max: indices.ndwi.max,
      interpretation: interpretNdwi(indices.ndwi.mean),
    },
    savi: {
      mean: indices.savi.mean,
      min: indices.savi.min,
      max: indices.savi.max,
      interpretation: interpretSavi(indices.savi.mean, indices.ndvi.mean),
    },
    weather: weather.status === 'fulfilled' ? {
      daysWithoutRain: weatherSummary.daysWithoutRain,
      totalPrecipNext7: weatherSummary.totalPrecipNext7,
      avgEt0Next7: weatherSummary.avgEt0Next7,
      droughtRiskLevel: weatherSummary.droughtRiskLevel,
    } : null,
    soilMoisture: smap.status === 'fulfilled' && smap.value ? smap.value : null,
    diseaseRisks,
    recommendation: {
      id: savedRec.id,
      severity: recommendation.severity,
      title: recommendation.title,
      message: recommendation.message,
      action: recommendation.action,
    },
  });
}
