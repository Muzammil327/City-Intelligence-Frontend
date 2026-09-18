import type { CurrentReading, ForecastPoint, HistoryPoint } from "./types";

/**
 * Explainability for the forecast: what the model takes as inputs and which
 * current conditions are *associated with* the prediction.
 *
 * Two honesty rules this module enforces:
 * 1. Never claim causation. Wording stays on "model inputs" and "conditions
 *    associated with the prediction".
 * 2. The prediction is distinguished from observation: the caller renders the
 *    forecast separately from history and this module never pretends a
 *    predicted value was measured.
 */

export interface ForecastInsight {
  /** Whether the projection ends higher or lower than the current reading. */
  directionLabel: string;
  summary: string;
  factors: Array<{ label: string; detail: string }>;
  caveat: string;
}

/** Compare the tail of the horizon to the current reading. */
export function forecastDirectionLabel(
  current: CurrentReading | null,
  forecast: ForecastPoint[],
): string {
  if (!current || forecast.length === 0) return "no forecast";
  const last = forecast[forecast.length - 1] as ForecastPoint;
  const delta = last.aqi - current.aqi;
  if (delta > 5) return "increasing";
  if (delta < -5) return "decreasing";
  return "stable";
}

export function forecastInsights(
  current: CurrentReading | null,
  history: HistoryPoint[],
  forecast: ForecastPoint[],
): ForecastInsight {
  const direction = forecastDirectionLabel(current, forecast);
  const factors: Array<{ label: string; detail: string }> = [];

  if (current?.concentrations.pm25 != null) {
    const pm25 = current.concentrations.pm25;
    const level =
      pm25 >= 55.5
        ? "elevated"
        : pm25 >= 35.5
          ? "moderately elevated"
          : "not elevated";
    factors.push({
      label: "Particulate matter",
      detail: `Current PM2.5 is ${pm25.toFixed(1)} µg/m³ (${level}). High particulates are a core model input and are associated with higher AQI.`,
    });
  }

  if (current?.weather?.windSpeedMs != null) {
    const wind = current.weather.windSpeedMs;
    factors.push({
      label: "Wind",
      detail:
        wind < 2
          ? `Wind is light at ${wind.toFixed(1)} m/s. Calm conditions are associated with stagnation and build-up of pollution in the model's inputs.`
          : `Wind is at ${wind.toFixed(1)} m/s; the model also projects the forecast wind over the next hours.`,
    });
  }

  if (current?.weather?.humidityPct != null) {
    const humidity = current.weather.humidityPct;
    factors.push({
      label: "Humidity",
      detail: `Relative humidity is ${Math.round(humidity)}%. The model includes humidity and projects forecast values across the horizon.`,
    });
  }

  factors.push({
    label: "Time of day",
    detail:
      "The model encodes the daily cycle (smog typically builds overnight and eases mid-afternoon) and the recent trend as inputs.",
  });

  const summary = `AQI is expected to ${direction} over the next ${forecast.length} hours.`;

  return {
    directionLabel: direction,
    summary,
    factors,
    caveat:
      "Factors listed are the model's inputs and conditions associated with the prediction — not proven causes. This is a short, indicative projection, not a guarantee.",
  };
}