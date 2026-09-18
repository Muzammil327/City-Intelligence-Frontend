"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ForecastPoint, HistoryPoint } from "@/lib/aqi/types";
import { ChartTooltipContent } from "@/components/charts/ChartTooltip";
import { getSeverityBand } from "@/lib/aqi/severity";
import { formatDateTime, formatHour } from "@/lib/format";

interface AqiTrendChartProps {
  history: HistoryPoint[];
  forecast: ForecastPoint[];
}

interface TrendDatum {
  timestamp: string;
  observed: number | null;
  predicted: number | null;
}

/**
 * Observed AQI as a solid line and the forecast as a dashed continuation on the
 * same axis, so the join between measurement and prediction is readable. The
 * two series are kept visually distinct in every channel: stroke style, legend,
 * and the tooltip labels — a predicted value never looks like a measurement.
 */
export function AqiTrendChart({ history, forecast }: AqiTrendChartProps) {
  const data = useMemo<TrendDatum[]>(() => {
    const lastObserved = history[history.length - 1];

    const observedPoints: TrendDatum[] = history.map((point, index) => ({
      timestamp: point.observedAt,
      observed: point.aqi,
      // Seed the forecast series at the final observed point so the dashed
      // line starts where the solid one ends instead of floating detached.
      predicted: index === history.length - 1 ? point.aqi : null,
    }));

    const forecastPoints: TrendDatum[] = forecast.map((point) => ({
      timestamp: point.predictedFor,
      observed: null,
      predicted: point.aqi,
    }));

    return lastObserved
      ? [...observedPoints, ...forecastPoints]
      : forecastPoints;
  }, [history, forecast]);

  const latest = history[history.length - 1] ?? forecast[forecast.length - 1];
  const seriesColor = getSeverityBand(latest?.aqi ?? 0).colorVar;

  return (
    <div className="h-72 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={false}
          />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatHour}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          />
          <YAxis
            domain={[0, "dataMax + 25"]}
            tickLine={false}
            axisLine={false}
            width={48}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
            content={
              <ChartTooltipContent
                labelFormatter={(label) => formatDateTime(String(label))}
                showBand
              />
            }
          />
          <Legend
            verticalAlign="top"
            align="right"
            height={28}
            wrapperStyle={{ fontSize: 12 }}
          />

          <Line
            dataKey="observed"
            name="Observed"
            type="monotone"
            stroke={seriesColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
          <Line
            dataKey="predicted"
            name="Forecast"
            type="monotone"
            stroke={seriesColor}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}