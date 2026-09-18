/**
 * Demo data for the frontend-only build.
 *
 * The app is UI-only by explicit scope: these are realistic sample readings
 * computed in the browser, deterministically, so the dashboard demonstrates all
 * of its views with plausible numbers. Nothing here is a live reading, and the
 * page header says so. The shapes match `./types` so the panels above this
 * layer never change if a real backend is wired up later.
 */

import { aqiFromPm25 } from "./pm25";
import { getSeverityBand } from "./severity";
import type {
  AreaReading,
  AreasResponse,
  CurrentReading,
  ForecastPoint,
  ForecastResponse,
  HistoryPoint,
  HistoryResponse,
  OverallSummary,
} from "./types";

const HOUR_MS = 60 * 60 * 1000;

/** Deterministic noise so the chart looks organic but stays stable. */
function seededNoise(index: number): number {
  const x = Math.sin(index * 12.9898) * 43_758.5453;
  return (x - Math.floor(x)) * 10 - 5;
}

/**
 * A plausible hourly AQI: a daily wave (smog builds overnight and eases in the
 * afternoon) plus rush-hour bumps plus small noise. Index late in the series is
 * more recent.
 */
function syntheticAqi(hoursAgo: number, index: number): number {
  const localHour = (24 - (hoursAgo % 24)) % 24;
  // Overnight/early-morning smog builds up (peak ~6am), clears by late evening.
  const daily = 148 + 26 * Math.cos(((localHour - 6) / 24) * Math.PI * 2);
  const rush =
    14 * Math.exp(-(((localHour - 9) / 2.5) ** 2)) +
    14 * Math.exp(-(((localHour - 21) / 2.5) ** 2));
  const drift = 18 * Math.sin(index / 40);
  return Math.round(daily + rush + drift + seededNoise(index));
}

const CITY = "Lahore";

const NOW_ALIGNED = new Date(Math.floor(Date.now() / HOUR_MS) * HOUR_MS);

/**
 * Deterministic hourly history, newest first, across `hours` hours. Only
 * "demanded" hours are generated, so the arrays stay small.
 */
function generateHistory(hours: number): HistoryPoint[] {
  const points: HistoryPoint[] = [];
  for (let index = 0; index < hours; index += 1) {
    const aqi = syntheticAqi(index, index);
    points.push({
      observedAt: new Date(NOW_ALIGNED.getTime() - index * HOUR_MS).toISOString(),
      aqi,
      source: index % 6 === 0 ? "stored" : "open-meteo-archive",
      temperatureC: 29 + 3 * Math.sin(((index * 24) / 168) * Math.PI),
      humidityPct: 50 + 10 * Math.cos(((index * 24) / 168) * Math.PI),
      windSpeedMs: 4 + 1.6 * Math.sin(index * 0.7),
    });
  }
  return points;
}

// Thirty days of archive, so the long history ranges have real data to show.
const HISTORY = generateHistory(720);

const areasConfig: Array<{
  uid: string;
  name: string;
  latitude: number;
  longitude: number;
  pm25Bump: number;
  windBump: number;
}> = [
  // The bumps spread the six points across four EPA bands rather than
  // clustering them in one, so ranking, severity colour and the band split are
  // all legible in the sample. The ordering is geographic sense, not invention:
  // Shahdara sits north across the Ravi near the industrial belt, Wagah is
  // rural outskirts. No area is placed in "Good" — Lahore does not have one.
  { uid: "gulberg", name: "Gulberg", latitude: 31.519, longitude: 74.357, pm25Bump: 51.6, windBump: 0.2 },
  { uid: "model-town", name: "Model Town", latitude: 31.487, longitude: 74.322, pm25Bump: 2.1, windBump: -0.3 },
  { uid: "johar-town", name: "Johar Town", latitude: 31.47, longitude: 74.273, pm25Bump: -18.4, windBump: -0.1 },
  { uid: "dha", name: "DHA", latitude: 31.47, longitude: 74.41, pm25Bump: -26.4, windBump: 0.6 },
  { uid: "shahdara", name: "Shahdara", latitude: 31.612, longitude: 74.31, pm25Bump: 98.6, windBump: 0.9 },
  { uid: "wagah", name: "Wagah Border", latitude: 31.604, longitude: 74.573, pm25Bump: -41.4, windBump: -0.7 },
];

const CURRENT_PM25 = 69.4;

const CURRENT: CurrentReading = {
  city: CITY,
  source: "open-meteo-air-quality (sample)",
  aqi: aqiFromPm25(CURRENT_PM25),
  category: getSeverityBand(aqiFromPm25(CURRENT_PM25)).label,
  dominantPollutant: "pm25",
  observedAt: NOW_ALIGNED.toISOString(),
  ageHours: 0.2,
  isStale: false,
  latitude: 31.52,
  longitude: 74.36,
  concentrations: {
    pm25: CURRENT_PM25,
    pm10: 120.1,
    o3: 48.2,
    no2: 24.6,
    so2: 12.3,
    co: 512.0,
    nh3: null,
  },
  weather: {
    source: "openweathermap (sample)",
    temperatureC: 30.5,
    feelsLikeC: 33.1,
    humidityPct: 55,
    pressureHpa: 1008,
    windSpeedMs: 4.7,
    windDirectionDeg: 270,
    conditions: "Haze",
  },
  airPollution: null,
  waqi: null,
};

function generateAreas(): AreaReading[] {
  return areasConfig.map((area) => {
    const pm25 = Math.round((CURRENT_PM25 + area.pm25Bump) * 10) / 10;
    const aqi = aqiFromPm25(pm25);
    return {
      uid: area.uid,
      name: area.name,
      latitude: area.latitude,
      longitude: area.longitude,
      source: "open-meteo-model (sample)",
      basis: "gridded-model",
      weatherSource: "open-meteo (sample)",
      observedAt: NOW_ALIGNED.toISOString(),
      ageHours: 0.3,
      isStale: false,
      aqi,
      pm25,
      pm10: Math.round(pm25 * 1.7 * 10) / 10,
      temperatureC: 30.1 + area.windBump,
      humidityPct: 53 + Math.round(area.windBump * 4),
      windSpeedMs: Math.round((4.4 + area.windBump) * 10) / 10,
      windDirectionDeg: 268 + area.windBump * 10,
    };
  });
}

const AREAS = generateAreas();

const HIGHEST: AreaReading = AREAS.reduce((best, area) =>
  area.aqi > best.aqi ? area : best,
);
const LOWEST: AreaReading = AREAS.reduce((best, area) =>
  area.aqi < best.aqi ? area : best,
);

const MEAN_PM25 =
  Math.round(
    (AREAS.reduce((sum, area) => sum + (area.pm25 ?? 0), 0) / AREAS.length) * 10,
  ) / 10;

const OVERALL: OverallSummary = {
  aqi: aqiFromPm25(MEAN_PM25),
  category: getSeverityBand(aqiFromPm25(MEAN_PM25)).label,
  pm25: MEAN_PM25,
  areasWithData: AREAS.length,
  areaCount: AREAS.length,
  highestName: HIGHEST?.name ?? null,
  highestAqi: HIGHEST?.aqi ?? null,
  lowestName: LOWEST?.name ?? null,
  lowestAqi: LOWEST?.aqi ?? null,
  observedAt: NOW_ALIGNED.toISOString(),
};

function nextHours(count: number): number[] {
  const result: number[] = [];
  for (let index = 0; index < count; index += 1) {
    result.push(syntheticAqi(-(index + 1), HISTORY.length + index));
  }
  return result;
}

function makeForecast(count: number): ForecastResponse {
  const points: ForecastPoint[] = nextHours(count).map((aqi, index) => ({
    predictedFor: new Date(
      NOW_ALIGNED.getTime() + (index + 1) * HOUR_MS,
    ).toISOString(),
    aqi,
    category: getSeverityBand(aqi).label,
  }));
  return {
    city: CITY,
    generatedAt: NOW_ALIGNED.toISOString(),
    horizonHours: count,
    model: "ridge-regressor (sample)",
    trainingSamples: HISTORY.length,
    weatherBasis: "forecast",
    r2Score: 0.72,
    points,
  };
}

/** Demo (dummy) data, exposed under the same names the fetchers used. */
export const demoData = {
  current: CURRENT,
  history: (hours: number): HistoryResponse => {
    const readings = HISTORY.slice(0, Math.min(hours, HISTORY.length));
    const sources: Record<string, number> = {};
    for (const point of readings) {
      sources[point.source] = (sources[point.source] ?? 0) + 1;
    }
    return { city: CITY, count: readings.length, sources, readings };
  },
  forecast: makeForecast(24),
  areas: (): AreasResponse => ({
    city: CITY,
    count: AREAS.length,
    overall: OVERALL,
    areas: AREAS,
  }),
};