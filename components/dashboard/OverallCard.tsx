"use client";

import { motion } from "motion/react";

import { AqiBadge } from "@/components/aqi/AqiBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSeverityBand } from "@/lib/aqi/severity";
import type { OverallSummary } from "@/lib/aqi/types";
import { DURATION, EASE } from "@/lib/motion";

interface OverallCardProps {
  overall: OverallSummary;
}

/** A floor for the axis, so a uniformly bad city does not look varied. */
const MIN_SCALE = 200;

/**
 * How far apart the best and worst neighbourhoods are right now.
 *
 * The spread is the interesting part: one number for a whole city hides
 * whether everywhere is equally bad or one area is dragging the average. As
 * two text rows — "Highest area: X (288) / Lowest area: Y (54)" — that gap is
 * arithmetic the reader has to do. As a strip, it is the picture.
 */
function SpreadStrip({
  lowest,
  highest,
  average,
}: {
  lowest: number;
  highest: number;
  average: number;
}) {
  const scale = Math.max(MIN_SCALE, highest, average);
  const left = (lowest / scale) * 100;
  const right = (highest / scale) * 100;
  const averageOffset = (average / scale) * 100;

  return (
    <div
      className="relative h-2 w-full rounded-full bg-white/[0.06]"
      role="img"
      aria-label={`Neighbourhoods range from AQI ${lowest} to ${highest}, averaging ${average}.`}
    >
      <motion.div
        className="absolute inset-y-0 rounded-full"
        style={{
          left: `${left}%`,
          width: `${Math.max(right - left, 1)}%`,
          background: `linear-gradient(to right, ${getSeverityBand(lowest).colorVar}, ${getSeverityBand(highest).colorVar})`,
          transformOrigin: "left",
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: DURATION.base, ease: EASE }}
      />
      {/* The average, marked on the span rather than stated beside it. */}
      <span
        aria-hidden="true"
        className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-full bg-foreground"
        style={{ left: `${averageOffset}%` }}
      />
    </div>
  );
}

/**
 * Feature 13 — the overall Lahore picture, computed on the backend over the
 * neighbourhood points (mean PM2.5/PM10, worst EPA sub-index). Only present
 * when the backend could actually produce it.
 */
export function OverallCard({ overall }: OverallCardProps) {
  const hasSpread =
    overall.lowestAqi != null &&
    overall.highestAqi != null &&
    overall.highestAqi >= overall.lowestAqi;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overall Lahore AQI</CardTitle>
        <CardDescription>
          Representative value from {overall.areasWithData} of{" "}
          {overall.areaCount} neighbourhood points
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
          <p className="font-mono text-5xl leading-none tabular-nums">
            {overall.aqi}
          </p>
          <div className="pb-1">
            <AqiBadge aqi={overall.aqi} />
          </div>
          {overall.pm25 != null ? (
            <p className="pb-1.5 font-mono text-xs text-muted-foreground">
              PM2.5 {overall.pm25.toFixed(1)} µg/m³
            </p>
          ) : null}
        </div>

        {hasSpread ? (
          <div className="space-y-2">
            <SpreadStrip
              lowest={overall.lowestAqi as number}
              highest={overall.highestAqi as number}
              average={overall.aqi}
            />
            <div className="flex items-start justify-between gap-3 text-[11px]">
              <span className="min-w-0">
                <span className="block font-mono tabular-nums">
                  {overall.lowestAqi}
                </span>
                <span className="block truncate text-muted-foreground">
                  {overall.lowestName ?? "cleanest"}
                </span>
              </span>
              <span className="min-w-0 text-right">
                <span className="block font-mono tabular-nums">
                  {overall.highestAqi}
                </span>
                <span className="block truncate text-muted-foreground">
                  {overall.highestName ?? "worst"}
                </span>
              </span>
            </div>
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground">
          Mean PM2.5 and PM10 across the monitored neighbourhoods; the worse EPA
          sub-index becomes the overall number.
        </p>
      </CardContent>
    </Card>
  );
}
