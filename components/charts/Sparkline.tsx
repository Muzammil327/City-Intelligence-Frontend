"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltipContent } from "@/components/charts/ChartTooltip";

interface SparklinePoint {
  /** Unique per point — a timestamp works. Never rendered on the chart. */
  key: string;
  value: number;
}

interface SparklineProps {
  points: SparklinePoint[];
  accent: string;
  /** Read by assistive tech in place of the shape. */
  label: string;
  /** Turns a point's `key` into the tooltip heading. */
  labelFormatter?: (key: string) => string;
  /** Names the AQI band in the tooltip. On by default — these plot AQI. */
  showBand?: boolean;
  className?: string;
}

/**
 * A shape-only chart: no axes, no grid, no ticks.
 *
 * It answers "which way is this going, and how bumpy is it" in the space of a
 * line of text. Values are not printed on it — but they are one hover away,
 * so the shape never becomes the only thing on offer. Anything that needs
 * values read off a visible axis wants `AqiTrendChart` instead.
 *
 * The domain is the series' own range rather than zero-based, because at this
 * height a zero baseline flattens every realistic AQI series into a line.
 */
export function Sparkline({
  points,
  accent,
  label,
  labelFormatter,
  showBand = true,
  className = "h-16 w-full",
}: SparklineProps) {
  // Gradient ids are global in an SVG document; two sparklines on one page
  // would otherwise share — and fight over — the same fill.
  const gradientId = useId();

  if (points.length < 2) return null;

  return (
    <div className={className} role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={points}
          margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
              <stop offset="100%" stopColor={accent} stopOpacity={0.04} />
            </linearGradient>
          </defs>

          {/* Hidden, but present: the tooltip needs a category axis to label
              a point with anything more useful than its index. */}
          <XAxis dataKey="key" hide />
          <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />

          <Tooltip
            cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
            content={
              <ChartTooltipContent
                labelFormatter={(key) =>
                  labelFormatter ? labelFormatter(String(key)) : String(key)
                }
                showBand={showBand}
              />
            }
          />

          <Area
            dataKey="value"
            type="monotone"
            stroke={accent}
            strokeWidth={1.75}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 3, fill: accent, strokeWidth: 0 }}
            isAnimationActive
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
