"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { TooltipSurface } from "@/components/charts/ChartTooltip";
import type { BestWindow } from "@/lib/aqi/best-time";
import { getSeverityBand } from "@/lib/aqi/severity";
import type { ForecastPoint } from "@/lib/aqi/types";
import { formatHour } from "@/lib/format";
import { DURATION, EASE } from "@/lib/motion";

interface ForecastRibbonProps {
  points: ForecastPoint[];
  /** Highlighted in place, so "when should I go out" is answered by looking. */
  bestWindow: BestWindow | null;
}

/** Label every Nth hour — more than this and the axis turns to mush. */
const LABEL_EVERY = 4;

/**
 * Keeps a flat horizon from being amplified into drama. Bars are read against
 * a floor of 200 AQI, so a day that never leaves "unhealthy" looks like one.
 */
const MIN_SCALE = 200;

/** Hours outside the best window step back rather than the window shouting. */
const DIMMED = 0.32;

/**
 * The forecast horizon as one glanceable strip: an hour per bar, coloured by
 * its severity band, with the least-polluted window marked in place.
 *
 * This exists because the same information as a paragraph — "the cleanest
 * hours are 08:00–15:00, averaging AQI 136" — is a sentence nobody finishes.
 * The shape of the day is the thing worth seeing; the exact value for any one
 * hour is a hover (or a keyboard focus) away.
 */
export function ForecastRibbon({ points, bestWindow }: ForecastRibbonProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const scale = useMemo(
    () => Math.max(MIN_SCALE, ...points.map((point) => point.aqi)),
    [points],
  );

  const windowRange = useMemo(() => {
    if (!bestWindow) return null;
    return {
      from: Date.parse(bestWindow.start),
      to: Date.parse(bestWindow.end),
    };
  }, [bestWindow]);

  const extremes = useMemo(() => {
    if (points.length === 0) return null;
    return {
      peak: points.reduce((worst, p) => (p.aqi > worst.aqi ? p : worst)),
      cleanest: points.reduce((best, p) => (p.aqi < best.aqi ? p : best)),
    };
  }, [points]);

  if (points.length === 0 || !extremes) return null;

  const description =
    `Forecast for the next ${points.length} hours. ` +
    `Worst around ${formatHour(extremes.peak.predictedFor)} at AQI ${extremes.peak.aqi}. ` +
    `Cleanest around ${formatHour(extremes.cleanest.predictedFor)} at AQI ${extremes.cleanest.aqi}.` +
    (bestWindow
      ? ` Best window ${formatHour(bestWindow.start)} to ${formatHour(bestWindow.end)}, averaging AQI ${bestWindow.averageAqi}.`
      : "");

  const active = activeIndex === null ? null : points[activeIndex];

  return (
    <figure className="space-y-2">
      <div className="relative">
        {/* Anchored over the hovered bar rather than following the cursor:
            the bars are one hour wide, so the pointer is already on the thing
            being described. */}
        {active ? (
          <div
            className="absolute bottom-full z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap"
            style={{
              left: `${((activeIndex as number) + 0.5) * (100 / points.length)}%`,
            }}
          >
            <TooltipSurface>
              <p className="mb-0.5 font-mono text-[10px] text-muted-foreground">
                {formatHour(active.predictedFor)}
              </p>
              <p className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-[2px]"
                  style={{ background: getSeverityBand(active.aqi).colorVar }}
                />
                <span className="font-mono tabular-nums">{active.aqi}</span>
                <span className="text-muted-foreground">
                  {getSeverityBand(active.aqi).label}
                </span>
              </p>
            </TooltipSurface>
          </div>
        ) : null}

        <div
          role="img"
          aria-label={description}
          className="flex h-28 items-end gap-[3px]"
          onMouseLeave={() => setActiveIndex(null)}
        >
          {points.map((point, index) => {
            const band = getSeverityBand(point.aqi);
            const at = Date.parse(point.predictedFor);
            const inWindow =
              windowRange !== null &&
              at >= windowRange.from &&
              at <= windowRange.to;
            const isActive = activeIndex === index;

            return (
              <button
                key={point.predictedFor}
                type="button"
                // Focusable so the values are reachable without a pointer;
                // the parent <div role="img"> already carries the summary, so
                // this only needs to name its own hour.
                aria-label={`${formatHour(point.predictedFor)}: AQI ${point.aqi}, ${band.label}`}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(null)}
                className="flex h-full flex-1 cursor-default items-end rounded-t-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <motion.span
                  className="block w-full rounded-t-[3px]"
                  style={{
                    // Height sizes the box; the animation only scales it, so
                    // the entrance never triggers layout.
                    height: `${(point.aqi / scale) * 100}%`,
                    background: band.colorVar,
                    opacity:
                      isActive || windowRange === null || inWindow ? 1 : DIMMED,
                    transformOrigin: "bottom",
                  }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{
                    duration: DURATION.base,
                    ease: EASE,
                    delay: index * 0.02,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="flex justify-between font-mono text-[10px] text-muted-foreground"
      >
        {points
          .filter((_, index) => index % LABEL_EVERY === 0)
          .map((point) => (
            <span key={point.predictedFor}>
              {formatHour(point.predictedFor)}
            </span>
          ))}
      </div>

      {bestWindow ? (
        <figcaption className="text-xs text-muted-foreground">
          Cleanest stretch{" "}
          <span className="font-mono text-foreground">
            {formatHour(bestWindow.start)}–{formatHour(bestWindow.end)}
          </span>{" "}
          · averages{" "}
          <span className="font-mono text-foreground">
            AQI {bestWindow.averageAqi}
          </span>
          , peaking at {bestWindow.peakAqi}.
        </figcaption>
      ) : null}
    </figure>
  );
}
