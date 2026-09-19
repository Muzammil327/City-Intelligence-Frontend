"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltipContent } from "@/components/charts/ChartTooltip";
import type {
  AccuracyMetricMeta,
  AccuracyTrendPoint,
} from "@/lib/aqi/accuracy";
import { formatDate, formatDateTime } from "@/lib/format";

/**
 * The two bases, drawn from the neutral chart ramp.
 *
 * Verified takes the lighter end and a solid stroke because it is the figure
 * that describes forecasts people were actually shown. They are told apart by
 * lightness *and* stroke style, so the distinction survives a reader who
 * cannot separate the two by colour.
 */
const VERIFIED_COLOR = "var(--color-chart-1)";
const HINDCAST_COLOR = "var(--color-chart-3)";

interface AccuracyTrendChartProps {
  points: AccuracyTrendPoint[];
  meta: AccuracyMetricMeta;
}

/**
 * How the model's skill has moved, one line per basis.
 *
 * The two are never merged. A hindcast re-runs the model over history; a
 * verified score grades predictions that were actually published. Averaging
 * them would give a number that answers neither question.
 */
export function AccuracyTrendChart({ points, meta }: AccuracyTrendChartProps) {
  const isPercentage = meta.unit === "%";
  const hasVerified = points.some((point) => point.verified !== null);
  const hasHindcast = points.some((point) => point.hindcast !== null);

  return (
    <div className="h-72 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={points}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={false}
          />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatDate}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          />
          <YAxis
            domain={isPercentage ? [0, 100] : [0, "dataMax + 10"]}
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
                unit={meta.unit}
              />
            }
          />
          <Legend
            verticalAlign="top"
            align="right"
            height={28}
            wrapperStyle={{ fontSize: 12 }}
          />

          {hasVerified ? (
            <Line
              dataKey="verified"
              name="Verified"
              type="monotone"
              stroke={VERIFIED_COLOR}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          ) : null}
          {hasHindcast ? (
            <Line
              dataKey="hindcast"
              name="Hindcast"
              type="monotone"
              stroke={HINDCAST_COLOR}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
