"use client";

import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltipContent } from "@/components/charts/ChartTooltip";
import { largestMiss, type PredictedVsActualPoint } from "@/lib/aqi/accuracy";
import { getSeverityBand } from "@/lib/aqi/severity";
import { formatDateTime, formatHour } from "@/lib/format";

interface PredictedVsActualChartProps {
  points: PredictedVsActualPoint[];
}

/**
 * What the model said against what the air did, hour by hour.
 *
 * Solid is measured, dashed is predicted — the same pairing `AqiTrendChart`
 * uses, so a predicted value never reads as a reading anywhere in the app. The
 * gap between the lines is the error, which is the whole point of the view, so
 * both series share one axis and one tooltip row.
 */
export function PredictedVsActualChart({ points }: PredictedVsActualChartProps) {
  const worst = largestMiss(points);
  const latest = points[points.length - 1];
  const seriesColor = getSeverityBand(latest?.observed ?? 0).colorVar;

  if (points.length === 0) return null;

  return (
    <figure>
      <div className="h-72 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={points}
            margin={{ top: 16, right: 8, bottom: 0, left: -16 }}
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
            />
            <Line
              dataKey="predicted"
              name="Predicted"
              type="monotone"
              stroke="var(--color-chart-3)"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              isAnimationActive={false}
            />

            {worst ? (
              <ReferenceDot
                x={worst.timestamp}
                y={worst.predicted}
                r={3.5}
                fill="var(--color-chart-3)"
                stroke="none"
                ifOverflow="extendDomain"
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {worst ? (
        <figcaption className="mt-3 text-sm text-foreground/80">
          Largest miss{" "}
          <span className="tabular-nums">
            {worst.error > 0 ? "+" : ""}
            {worst.error}
          </span>{" "}
          AQI
          <span className="text-muted-foreground">
            {" "}
            · {formatDateTime(worst.timestamp)} · predicted{" "}
            <span className="tabular-nums">{worst.predicted}</span> against{" "}
            <span className="tabular-nums">{worst.observed}</span> observed
          </span>
        </figcaption>
      ) : null}
    </figure>
  );
}
