"use client";

import { useMemo } from "react";

import { AqiBadge } from "@/components/aqi/AqiBadge";
import { Sparkline } from "@/components/charts/Sparkline";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BestWindow } from "@/lib/aqi/best-time";
import { getSeverityBand } from "@/lib/aqi/severity";
import type { ForecastPoint } from "@/lib/aqi/types";
import { formatHour, partOfDay } from "@/lib/format";

interface BestTimeCardProps {
  bestWindow: BestWindow | null;
  /** The horizon the window was picked from — drawn behind the headline. */
  forecast: ForecastPoint[];
  /** Whether a forecast exists at all — distinguishes "no good window yet"
   *  from "no forecast, so nothing to say". */
  hasForecast: boolean;
}

/**
 * The relatively better outdoor window, derived from the forecast rather than
 * hardcoded. When the whole horizon is poor the card says the window is the
 * least-bad option instead of pretending clean air is coming.
 *
 * The expected AQI leads because that is the decision; the sparkline behind it
 * shows the shape of the day the window was chosen from, so the number is not
 * a claim you have to take on trust.
 */
export function BestTimeCard({
  bestWindow,
  forecast,
  hasForecast,
}: BestTimeCardProps) {
  const points = useMemo(
    () =>
      [...forecast]
        .sort(
          (a, b) => Date.parse(a.predictedFor) - Date.parse(b.predictedFor),
        )
        .map((point) => ({ key: point.predictedFor, value: point.aqi })),
    [forecast],
  );

  const peak = useMemo(() => {
    if (forecast.length === 0) return null;
    return forecast.reduce((worst, point) =>
      point.aqi > worst.aqi ? point : worst,
    );
  }, [forecast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Better outdoor window</CardTitle>
        <CardDescription>
          Least-polluted stretch in the next {forecast.length || 24} hours.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasForecast ? (
          <p className="text-sm text-muted-foreground">
            No forecast is available yet, so there is no window to recommend.
          </p>
        ) : !bestWindow ? (
          <p className="text-sm text-muted-foreground">
            The forecast is too short to pick a reliable window.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="text-5xl leading-none tabular-nums">
                {bestWindow.averageAqi}
              </p>
              <AqiBadge aqi={bestWindow.averageAqi} />
            </div>

            <p className="text-[11px] text-muted-foreground">
              {formatHour(bestWindow.start)} → {formatHour(bestWindow.end)} (
              {bestWindow.hours}h)
              {peak ? (
                <>
                  {"  ·  "}peaks at {peak.aqi} {partOfDay(peak.predictedFor)}
                </>
              ) : null}
            </p>

            <Sparkline
              points={points}
              accent={getSeverityBand(bestWindow.averageAqi).colorVar}
              labelFormatter={formatHour}
              label={`Forecast AQI over the next ${points.length} hours, averaging ${bestWindow.averageAqi} in the best window${peak ? ` and peaking at ${peak.aqi}` : ""}.`}
            />

            {bestWindow.peakAqi > bestWindow.averageAqi + 20 ? (
              <p className="text-xs text-muted-foreground">
                Within the window itself, air still reaches AQI{" "}
                {bestWindow.peakAqi} (
                {getSeverityBand(bestWindow.peakAqi).label.toLowerCase()}) — it
                is the least-bad stretch, not a clean one.
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
