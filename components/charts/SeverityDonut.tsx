"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { getSeverityBand, SEVERITY_BANDS } from "@/lib/aqi/severity";
import type { AreaReading } from "@/lib/aqi/types";
import { cn } from "@/lib/utils";

interface SeverityDonutProps {
  /** Every area, not just the ranked few — the ring is a share of the city. */
  areas: AreaReading[];
  className?: string;
}

/**
 * How the city's monitoring points split across the EPA bands.
 *
 * The slices count areas, not AQI. AQI is an index, not a quantity — adding
 * two areas' values produces a number that means nothing, so a ring sized by
 * AQI would imply a whole that does not exist. Counting areas per band is a
 * real part-to-whole, and it answers the question the ranked list beside it
 * cannot: how much of the city is in trouble, rather than which corner is worst.
 */
export function SeverityDonut({
  areas,
  className = "h-48 w-full",
}: SeverityDonutProps) {
  // Band order is the EPA scale's own order, so the ring reads good → hazardous.
  const slices = SEVERITY_BANDS.map((band) => ({
    id: band.id,
    label: band.label,
    color: band.colorVar,
    value: areas.filter((area) => getSeverityBand(area.aqi).id === band.id)
      .length,
  })).filter((slice) => slice.value > 0);

  if (slices.length === 0) return null;

  const summary = slices
    .map((slice) => `${slice.value} ${slice.label}`)
    .join(", ");

  return (
    <div className="space-y-3">
      <div
        className={cn("relative", className)}
        role="img"
        aria-label={`${areas.length} neighbourhood points by severity band: ${summary}.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={slices.length > 1 ? 2 : 0}
              stroke="none"
              isAnimationActive
              animationDuration={600}
            >
              {slices.map((slice) => (
                <Cell key={slice.id} fill={slice.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* The count sits in the hole rather than on a slice, so a ring with
            one band still says how many points it covers. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
        >
          <span className="text-2xl leading-none font-medium tabular-nums">
            {areas.length}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Areas
          </span>
        </div>
      </div>

      <ul className="space-y-1.5">
        {slices.map((slice) => (
          <li key={slice.id} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-[3px]"
              style={{ background: slice.color }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {slice.label}
            </span>
            <span className="tabular-nums">{slice.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
