"use client";

import { useMemo } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { ChartTooltipContent } from "@/components/charts/ChartTooltip";

import { DISPLAY_CEILING } from "@/lib/aqi/reference-levels";
import type { Concentrations } from "@/lib/aqi/types";

interface PollutantRadarProps {
  concentrations: Concentrations;
  /** Stroke and fill colour — pass the current band's `colorVar`. */
  accent: string;
}

/**
 * Axes, in the order they read around the shape.
 *
 * NH₃ is left out on purpose: it is frequently null from the providers, and a
 * radar with a collapsed spoke reads as "zero pollution here" rather than "not
 * measured". The bar list still shows it, where an em dash can say so plainly.
 */
const AXES: ReadonlyArray<{ field: keyof Concentrations; label: string }> = [
  { field: "pm25", label: "PM2.5" },
  { field: "pm10", label: "PM10" },
  { field: "o3", label: "O₃" },
  { field: "no2", label: "NO₂" },
  { field: "so2", label: "SO₂" },
  { field: "co", label: "CO" },
];

/**
 * The pollutant mix as a shape.
 *
 * Each axis is the species' share of its display ceiling, so the polygon's
 * silhouette says which pollutant is out of line relative to the others — the
 * question a column of six numbers on six different scales cannot answer.
 * It is a shape comparison, never a health index.
 */
export function PollutantRadar({
  concentrations,
  accent,
}: PollutantRadarProps) {
  const data = useMemo(
    () =>
      AXES.map(({ field, label }) => {
        const value = concentrations[field];
        return {
          label,
          // A missing reading contributes nothing rather than dropping the
          // axis, which would silently change the shape of the polygon.
          share: value === null ? 0 : Math.min(value / DISPLAY_CEILING[field], 1),
          value,
          measured: value !== null,
        };
      }),
    [concentrations],
  );

  const measured = data.filter((point) => point.measured);
  if (measured.length < 3) return null;

  const strongest = measured.reduce((worst, point) =>
    point.share > worst.share ? point : worst,
  );

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          data={data}
          outerRadius="72%"
          margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
          role="img"
          aria-label={`Pollutant mix. ${strongest.label} sits closest to its reference high, at ${Math.round(strongest.share * 100)} percent of it.`}
        >
          <PolarGrid
            stroke="var(--color-border)"
            gridType="polygon"
            radialLines
          />
          <PolarAngleAxis
            dataKey="label"
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          />
          {/* The rings are the scale; numbering them would imply the axes
              share a unit, and they do not. */}
          <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
          <Tooltip
            cursor={false}
            content={
              <ChartTooltipContent
                // The axis is a share of the reference high; the number a
                // person can act on is the concentration behind it.
                valueFormatter={(share, entry) => {
                  const point = (entry as { payload?: { value: number | null } })
                    .payload;
                  const measured = point?.value;
                  const percent = `${Math.round(share * 100)}% of reference`;
                  return measured == null
                    ? "not measured"
                    : `${measured.toFixed(1)} µg/m³ · ${percent}`;
                }}
              />
            }
          />
          <Radar
            name="Today's mix"
            dataKey="share"
            stroke={accent}
            strokeWidth={2}
            fill={accent}
            fillOpacity={0.22}
            dot={{ r: 2.5, fill: accent, strokeWidth: 0 }}
            isAnimationActive
            animationDuration={600}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
