/**
 * Domain types mirroring the backend response contracts (camelCase on the wire).
 *
 * These are the shapes the UI consumes directly from the FastAPI-backed
 * fetchers in `./api.ts`. The backend is the single source of truth for the
 * data model; the city has no per-station service feed, it has city-level
 * endpoints plus a set of neighbourhood model points.
 */

/** Pollutants the dashboard understands. All concentrations are µg/m³. */
export type PollutantCode = "pm25" | "pm10" | "o3" | "no2" | "so2" | "co" | "nh3";

/** Measured mass concentrations in µg/m³ — not index values. */
export interface Concentrations {
  pm25: number | null;
  pm10: number | null;
  o3: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  nh3: number | null;
}

/** Current weather alongside the reading. */
export interface Weather {
  source: string;
  temperatureC: number | null;
  feelsLikeC: number | null;
  humidityPct: number | null;
  pressureHpa: number | null;
  windSpeedMs: number | null;
  windDirectionDeg: number | null;
  conditions: string | null;
}

/** A second provider's view of the same air (cross-check, not the headline). */
export interface AirPollution {
  source: string;
  measuredAt: string;
  concentrations: Concentrations;
  /** 1–5 scale, NOT the US AQI. Never rendered as one. */
  owmIndex: number | null;
  usAqi: number | null;
  usAqiCategory: string | null;
  dominantPollutant: string | null;
}

/** A named reference station's reading, kept out of the live picture. */
export interface WaqiReading {
  aqi: number;
  category: string;
  observedAt: string;
  ageHours: number;
  isStale: boolean;
  stationName: string | null;
  dominantPollutant: string | null;
  pollutants: Concentrations;
}

/** The city's live reading from GET /current. */
export interface CurrentReading {
  city: string;
  /** Which provider supplied the headline AQI. */
  source: string;
  aqi: number;
  category: string;
  /** Null means the headline index isn't attributable to one pollutant. */
  dominantPollutant: PollutantCode | null;
  /** ISO-8601 UTC timestamp of the observation. */
  observedAt: string;
  ageHours: number;
  isStale: boolean;
  latitude: number;
  longitude: number;
  concentrations: Concentrations;
  weather: Weather | null;
  airPollution: AirPollution | null;
  waqi: WaqiReading | null;
}

/** One observed point on the AQI series. */
export interface HistoryPoint {
  /** ISO-8601 UTC timestamp. */
  observedAt: string;
  aqi: number;
  source: "stored" | "open-meteo-archive" | string;
  temperatureC: number | null;
  humidityPct: number | null;
  windSpeedMs: number | null;
}

/** GET /history. Points arrive newest-first. */
export interface HistoryResponse {
  city: string;
  count: number;
  /** How many returned points came from each source. */
  sources: Record<string, number>;
  readings: HistoryPoint[];
}

/**
 * One predicted point. There is no confidence band: the backend's ridge model
 * returns a point estimate only, so no bounds are drawn here.
 */
export interface ForecastPoint {
  /** ISO-8601 UTC timestamp. */
  predictedFor: string;
  aqi: number;
  category: string;
}

/** GET /forecast. */
export interface ForecastResponse {
  city: string;
  generatedAt: string;
  horizonHours: number;
  model: string;
  trainingSamples: number;
  /** `forecast` when built on predicted weather, `persisted` when carried over. */
  weatherBasis: string;
  /** In-sample fit. Not a measure of forecast accuracy. */
  r2Score: number | null;
  points: ForecastPoint[];
}

/** One predicted hour set against the observation that actually followed. */
export interface ForecastAccuracyPoint {
  /** ISO-8601 UTC timestamp. */
  predictedFor: string;
  hoursAhead: number;
  predictedAqi: number;
  observedAqi: number;
  /** predicted − observed. Positive means the model ran high. */
  error: number;
  predictedCategory: string;
  observedCategory: string;
}

/**
 * GET /forecast/accuracy — out-of-sample skill, unlike `ForecastResponse.r2Score`.
 *
 * The model is refit without the most recent hours and then scored against
 * them. Weather over the scored window is carried forward rather than taken
 * from the observations, so these figures never assume perfect foresight.
 */
export interface ForecastAccuracy {
  city: string;
  model: string;
  /** Hours actually scored, which may be fewer than requested. */
  horizonHours: number;
  trainingSamples: number;
  evaluatedFrom: string;
  /** Average miss, in AQI points. */
  meanAbsoluteError: number;
  rootMeanSquareError: number;
  /** Share of hours landing in the correct EPA category. */
  bandAccuracyPct: number;
  points: ForecastAccuracyPoint[];
}

/**
 * A physical monitoring station, from GET /stations.
 *
 * Deliberately thinner than `AreaReading`: a station reports an index and
 * little else, and everything past `longitude` is nullable because a listed
 * station may not currently be reporting at all.
 */
export interface Station {
  uid: string;
  name: string;
  latitude: number;
  longitude: number;
  aqi: number | null;
  category: string | null;
  /** ISO-8601 UTC timestamp, or null when the station has no reading. */
  observedAt: string | null;
}

/** GET /stations. */
export interface StationsResponse {
  city: string;
  count: number;
  stations: Station[];
}

/** One neighbourhood's current air, from GET /areas. */
export interface AreaReading {
  uid: string;
  name: string;
  latitude: number;
  longitude: number;
  /** "open-meteo-model" — derived from a gridded model, not a station. */
  source: string;
  basis: "gridded-model" | "station" | string;
  weatherSource: string | null;
  observedAt: string;
  ageHours: number;
  isStale: boolean;
  aqi: number;
  pm25: number | null;
  pm10: number | null;
  temperatureC: number | null;
  humidityPct: number | null;
  windSpeedMs: number | null;
  windDirectionDeg: number | null;
}

/** The representative city number, also from GET /areas. */
export interface OverallSummary {
  aqi: number;
  category: string;
  pm25: number | null;
  areasWithData: number;
  areaCount: number;
  highestName: string | null;
  highestAqi: number | null;
  lowestName: string | null;
  lowestAqi: number | null;
  observedAt: string | null;
}

/** GET /areas. */
export interface AreasResponse {
  city: string;
  count: number;
  overall: OverallSummary;
  areas: AreaReading[];
}