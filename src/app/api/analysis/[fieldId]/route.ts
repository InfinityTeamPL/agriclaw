import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getCopernicusClient, extractNdviValues } from '@/lib/satellite/copernicus';
import { computeNdviStats, classifyNdvi, describeNdvi } from '@/lib/satellite/ndvi';
import { fetchWeatherForecast } from '@/lib/satellite/weather';
import { fetchSmapSoilMoisture } from '@/lib/satellite/smap';
import { generateRecommendation } from '@/lib/recommendations';
import { generateMockNdvi, isCopernicusConfigured } from '@/lib/satellite/ndvi-mock';

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

  // Równolegle: pogoda + SMAP (NDVI osobno niżej, z fallbackiem)
  const [weather, smap] = await Promise.allSettled([
    fetchWeatherForecast(field.centroid_lat, field.centroid_lon, 7),
    fetchSmapSoilMoisture(field.centroid_lat, field.centroid_lon),
  ]);

  // NDVI — Copernicus Sentinel-2 jeśli skonfigurowane, inaczej deterministyczny mock
  let stats: {
    mean: number;
    min: number;
    max: number;
    validCount: number;
    stddev: number;
  };
  let isMock = false;
  let cdseError: string | undefined;

  if (isCopernicusConfigured()) {
    try {
      const tiff = await getCopernicusClient().fetchNdviGeotiff(
        polygon,
        fourteenDaysAgo,
        today,
      );
      const values = await extractNdviValues(tiff);
      stats = computeNdviStats(values);
    } catch (err) {
      cdseError = String(err);
      const mock = generateMockNdvi({
        fieldId: field.id,
        crop: field.crop,
        lat: field.centroid_lat,
        lon: field.centroid_lon,
      });
      stats = mock;
      isMock = true;
    }
  } else {
    const mock = generateMockNdvi({
      fieldId: field.id,
      crop: field.crop,
      lat: field.centroid_lat,
      lon: field.centroid_lon,
    });
    stats = mock;
    isMock = true;
  }

  // Previous NDVI dla porównania
  const previousReading = await prisma.ndviReading.findFirst({
    where: { fieldId: field.id },
    orderBy: { observedAt: 'desc' },
  });

  // Zapisz NDVI
  const reading = await prisma.ndviReading.create({
    data: {
      fieldId: field.id,
      observedAt: new Date(),
      ndviMean: stats.mean,
      ndviMin: stats.min,
      ndviMax: stats.max,
      validCount: stats.validCount,
      cloudCover: 0,
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

  return NextResponse.json({
    fieldId: field.id,
    observedAt: reading.observedAt.toISOString(),
    ndvi: {
      mean: stats.mean,
      min: stats.min,
      max: stats.max,
      validCount: stats.validCount,
      stddev: stats.stddev,
      classification: classifyNdvi(stats.mean),
      description: describeNdvi(stats.mean, field.crop),
      source: isMock ? 'mock' : 'sentinel-2',
      mock: isMock,
      cdse_error: cdseError,
      trend: previousReading
        ? {
            previousMean: previousReading.ndviMean,
            previousObservedAt: previousReading.observedAt.toISOString(),
            delta: stats.mean - previousReading.ndviMean,
          }
        : null,
    },
    weather: weather.status === 'fulfilled' ? {
      daysWithoutRain: weatherSummary.daysWithoutRain,
      totalPrecipNext7: weatherSummary.totalPrecipNext7,
      avgEt0Next7: weatherSummary.avgEt0Next7,
      droughtRiskLevel: weatherSummary.droughtRiskLevel,
    } : null,
    soilMoisture: smap.status === 'fulfilled' && smap.value ? smap.value : null,
    recommendation: {
      id: savedRec.id,
      severity: recommendation.severity,
      title: recommendation.title,
      message: recommendation.message,
      action: recommendation.action,
    },
  });
}
