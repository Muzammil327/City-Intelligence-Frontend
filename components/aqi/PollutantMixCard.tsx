"use client";

import { useMemo } from "react";

import { ConcentrationGrid } from "@/components/aqi/ConcentrationGrid";
import { PollutantRadar } from "@/components/charts/PollutantRadar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DISPLAY_CEILING } from "@/lib/aqi/reference-levels";
import { getSeverityBand } from "@/lib/aqi/severity";
import type { Concentrations } from "@/lib/aqi/types";

interface PollutantMixCardProps {
  concentrations: Concentrations;
  /** Drives the accent colour, so the shape matches the headline severity. */
  aqi: number;
}

const LABELS: Record<keyof Concentrations, string> = {
  pm25: "PM2.5",
  pm10: "PM10",
  o3: "O₃",
  no2: "NO₂",
  so2: "SO₂",
  co: "CO",
  nh3: "NH₃",
};

/** Particulates versus gases — the split the shape usually reveals. */
const PARTICULATES: ReadonlyArray<keyof Concentrations> = ["pm25", "pm10"];

/**
 * Which species are pushing hardest against their reference high, named in a
 * sentence generated from the data rather than written into the page.
 */
function describeMix(concentrations: Concentrations): string | null {
  const shares = (Object.keys(DISPLAY_CEILING) as Array<keyof Concentrations>)
    .flatMap((field) => {
      const value = concentrations[field];
      if (value === null) return [];
      return [{ field, share: value / DISPLAY_CEILING[field] }];
    })
    .sort((a, b) => b.share - a.share);

  if (shares.length < 3) return null;

  const leader = shares[0];
  if (!leader) return null;

  const particulatesLead = PARTICULATES.includes(leader.field);
  const names = shares
    .slice(0, 2)
    .map((entry) => LABELS[entry.field])
    .join(" and ");

  return particulatesLead
    ? `${names} sit closest to the reference high; the gaseous pollutants are comparatively moderate.`
    : `${names} sit closest to the reference high — unusual here, where particulates normally lead.`;
}

/**
 * The pollutant mix, as a shape first and numbers second.
 *
 * Six concentrations on six different numeric scales cannot be compared by
 * reading them in a column. The radar normalises each against its own
 * reference high, so one glance says which pollutant is out of line; the bars
 * underneath carry the actual measurements for anyone who needs them.
 */
export function PollutantMixCard({
  concentrations,
  aqi,
}: PollutantMixCardProps) {
  const band = getSeverityBand(aqi);
  const summary = useMemo(() => describeMix(concentrations), [concentrations]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pollutant mix</CardTitle>
        <CardDescription>
          Each axis is share of a typical urban-high reference — a spike shows
          which pollutant is out of line.
        </CardDescription>
      </CardHeader>

      {/*
        Shape on the left, measurements on the right. Stacked below `lg`,
        where neither the radar's axis labels nor the bars' own labels have
        the width to survive a split.
      */}
      <CardContent className="grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="space-y-4">
          <PollutantRadar
            concentrations={concentrations}
            accent={band.colorVar}
          />

          {summary ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {summary}
            </p>
          ) : null}

          <div className="flex items-center gap-2 text-xs">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-[3px]"
              style={{ background: band.colorVar }}
            />
            <span className="text-muted-foreground">Today&rsquo;s mix</span>
          </div>
        </div>

        <div className="border-t border-white/5 pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <ConcentrationGrid
            concentrations={concentrations}
            accent={band.colorVar}
          />
        </div>
      </CardContent>
    </Card>
  );
}
