"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { AccuracyTrendChart } from "@/components/charts/AccuracyTrendChart";
import { PredictedVsActualChart } from "@/components/charts/PredictedVsActualChart";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ACCURACY_METRICS,
  accuracyMetricMeta,
  accuracyTrend,
  latestOfBasis,
  predictedVsActual,
  trendDelta,
  type AccuracyMetric,
} from "@/lib/aqi/accuracy";
import {
  aqiQueryKeys,
  failureMessage,
  fetchAccuracyHistory,
  fetchForecastAccuracy,
} from "@/lib/aqi/api";
import {
  ACCURACY_HISTORY_HOURS,
  FORECAST_HORIZON_HOURS,
} from "@/lib/config";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/** One headline figure. */
function Figure({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

/**
 * How well the forecast model has been doing, and whether that is improving.
 *
 * Two questions, kept apart throughout:
 *
 *   - *How wrong is it right now?* — the hindcast the service computes on
 *     demand, plus the hour-by-hour predicted/observed pairs behind it.
 *   - *Is it getting better?* — the stored trend, which only exists because
 *     the service now records each figure instead of discarding it.
 *
 * Neither is presented as the other, and a verified score is never averaged
 * with a hindcast.
 */
export function ModelAccuracyPanel() {
  const [metric, setMetric] = useState<AccuracyMetric>("bandAccuracyPct");
  const meta = accuracyMetricMeta(metric);

  // Same key the overview uses, so this shares that fetch rather than repeating
  // it — the hindcast refits the model and is the most expensive call here.
  const accuracyQuery = useQuery({
    queryKey: aqiQueryKeys.accuracy(FORECAST_HORIZON_HOURS),
    queryFn: () => fetchForecastAccuracy(FORECAST_HORIZON_HOURS),
    retry: false,
  });

  const historyQuery = useQuery({
    queryKey: aqiQueryKeys.accuracyHistory(ACCURACY_HISTORY_HOURS),
    queryFn: () => fetchAccuracyHistory(ACCURACY_HISTORY_HOURS),
    retry: false,
  });

  const snapshots = useMemo(
    () => historyQuery.data?.snapshots ?? [],
    [historyQuery.data],
  );

  const trend = useMemo(
    () => accuracyTrend(snapshots, metric),
    [snapshots, metric],
  );

  const pairs = useMemo(
    () => predictedVsActual(accuracyQuery.data?.points ?? []),
    [accuracyQuery.data],
  );

  const latestVerified = useMemo(
    () => latestOfBasis(snapshots, "verified"),
    [snapshots],
  );

  const verifiedDelta = trendDelta(trend, "verified");
  const hindcastDelta = trendDelta(trend, "hindcast");
  const delta = verifiedDelta ?? hindcastDelta;

  const current = accuracyQuery.data ?? null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current skill</CardTitle>
          <CardDescription>
            Measured out-of-sample: the model is refit without the most recent
            hours, then scored against them. Weather over the scored window is
            carried forward rather than read from those hours, so nothing here
            assumes the model knew the future.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {accuracyQuery.isPending ? (
            <Skeleton className="h-28 w-full rounded-lg" />
          ) : accuracyQuery.isError ? (
            <ErrorState
              title="Skill unavailable"
              description={failureMessage(
                accuracyQuery.error,
                "The model's accuracy could not be measured right now.",
              )}
              onRetry={() => void accuracyQuery.refetch()}
            />
          ) : current ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Figure
                  label="Band accuracy"
                  value={`${Math.round(current.bandAccuracyPct)}%`}
                  hint="Hours landing in the correct EPA category"
                />
                <Figure
                  label="Mean error"
                  value={`±${current.meanAbsoluteError}`}
                  hint="Average miss, in AQI points"
                />
                <Figure
                  label="RMS error"
                  value={`${current.rootMeanSquareError}`}
                  hint="Average miss, weighting large ones more"
                />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                {current.model} · {current.horizonHours} hours scored ·{" "}
                {current.trainingSamples} readings trained on · from{" "}
                {formatDateTime(current.evaluatedFrom)}
              </p>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accuracy over time</CardTitle>
          <CardDescription>
            {meta.description}{" "}
            {meta.higherIsBetter
              ? "Higher is better."
              : "Lower is better — it is an average miss, not a score."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div
            role="tablist"
            aria-label="Accuracy metric"
            className="inline-flex rounded-lg border p-0.5"
          >
            {ACCURACY_METRICS.map((candidate) => (
              <button
                key={candidate.metric}
                type="button"
                role="tab"
                aria-selected={metric === candidate.metric}
                onClick={() => setMetric(candidate.metric)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium",
                  metric === candidate.metric
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {candidate.label}
              </button>
            ))}
          </div>

          {historyQuery.isPending ? (
            <Skeleton className="h-72 w-full rounded-lg sm:h-80" />
          ) : historyQuery.isError ? (
            <ErrorState
              title="Trend unavailable"
              description={failureMessage(
                historyQuery.error,
                "Stored accuracy measurements could not be loaded.",
              )}
              onRetry={() => void historyQuery.refetch()}
            />
          ) : trend.length < 2 ? (
            <EmptyState
              title="Not enough measurements yet"
              description="Accuracy is recorded each time the service measures it. Once there are at least two measurements, the trend appears here."
            />
          ) : (
            <>
              <AccuracyTrendChart points={trend} meta={meta} />
              {delta !== null ? (
                <p className="text-sm text-foreground/80">
                  {meta.title} has moved{" "}
                  <span className="tabular-nums">
                    {delta > 0 ? "+" : ""}
                    {Math.round(delta * 10) / 10}
                    {meta.unit === "%" ? "%" : ` ${meta.unit}`}
                  </span>{" "}
                  across this window
                  <span className="text-muted-foreground">
                    {" "}
                    — {(delta > 0) === meta.higherIsBetter ? "better" : "worse"}
                    {verifiedDelta === null ? ", on hindcast figures" : ""}.
                  </span>
                </p>
              ) : null}
            </>
          )}

          {/*
            The distinction is load-bearing, so it is stated on the page rather
            than left to the legend. A hindcast is a re-run; only the verified
            series grades a forecast anyone was actually shown.
          */}
          <p className="text-xs leading-relaxed text-muted-foreground">
            <strong className="font-medium text-foreground/80">Hindcast</strong>{" "}
            refits the model over stored history and scores it against hours it
            was not trained on.{" "}
            <strong className="font-medium text-foreground/80">Verified</strong>{" "}
            scores forecasts this service actually published, against the
            readings that later arrived — the stricter measure, and one that can
            only accrue going forward.
            {latestVerified === null
              ? " No verified score has been recorded yet; forecasts need time to mature before they can be graded."
              : ` Last verified ${formatDateTime(latestVerified.recordedAt)}.`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Predicted against observed</CardTitle>
          <CardDescription>
            Every hour the model was scored on, with what it predicted beside
            what the air actually did. The gap between the lines is the error.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {accuracyQuery.isPending ? (
            <Skeleton className="h-72 w-full rounded-lg sm:h-80" />
          ) : accuracyQuery.isError ? (
            <ErrorState
              title="Comparison unavailable"
              description={failureMessage(
                accuracyQuery.error,
                "The scored hours could not be loaded.",
              )}
              onRetry={() => void accuracyQuery.refetch()}
            />
          ) : pairs.length === 0 ? (
            <EmptyState
              title="Nothing scored yet"
              description="The store needs enough readings to hold out a scoring window before predictions can be compared with observations."
            />
          ) : (
            <PredictedVsActualChart points={pairs} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
