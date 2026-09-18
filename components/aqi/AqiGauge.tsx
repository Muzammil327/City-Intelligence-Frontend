"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useEffect } from "react";

import { getSeverityBand, MAX_AQI, SEVERITY_BANDS } from "@/lib/aqi/severity";
import { DURATION, EASE } from "@/lib/motion";

interface AqiGaugeProps {
  aqi: number;
  /** Rendered under the value. Keep it short — it sits inside the ring. */
  caption?: string;
}

/**
 * The headline AQI as a radial gauge.
 *
 * The track carries the six EPA bands in order, so the needle's position is
 * readable as "deep into unhealthy" without consulting a legend. The value arc
 * is scaled against the full 0–500 scale rather than stretched to fill the
 * ring: a gauge that always looks three-quarters full communicates nothing.
 */

const SIZE = 210;
const STROKE = 13;
const CENTER = SIZE / 2;
const RADIUS = CENTER - STROKE;

/** Leaves a gap at the bottom, so the scale has a visible start and end. */
const START_ANGLE = 135;
const SWEEP = 270;

function polarToCartesian(angleDeg: number, radius: number) {
  const radians = ((angleDeg - 0) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians),
  };
}

/** An SVG arc between two absolute angles, drawn clockwise. */
function describeArc(startAngle: number, endAngle: number): string {
  const start = polarToCartesian(startAngle, RADIUS);
  const end = polarToCartesian(endAngle, RADIUS);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/** Where a value sits along the sweep, clamped to the scale. */
function fractionFor(aqi: number): number {
  if (Number.isNaN(aqi)) return 0;
  return Math.min(Math.max(aqi, 0), MAX_AQI) / MAX_AQI;
}

const FULL_ARC = describeArc(START_ANGLE, START_ANGLE + SWEEP);

export function AqiGauge({ aqi, caption = "US EPA AQI" }: AqiGaugeProps) {
  const prefersReducedMotion = useReducedMotion();
  const band = getSeverityBand(aqi);
  const fraction = fractionFor(aqi);

  const count = useMotionValue(prefersReducedMotion ? aqi : 0);
  const displayed = useTransform(count, (value) => Math.round(value));

  useEffect(() => {
    if (prefersReducedMotion) {
      count.set(aqi);
      return;
    }

    const controls = animate(count, aqi, {
      duration: DURATION.slow * 2,
      ease: EASE,
    });

    return () => controls.stop();
  }, [aqi, count, prefersReducedMotion]);

  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`Air quality index ${Math.round(aqi)}, ${band.label}`}
      >
        {/* The scale itself: each band occupying its true share of 0–500. */}
        <g opacity={0.22}>
          {SEVERITY_BANDS.map((scaleBand) => {
            const from = START_ANGLE + (scaleBand.min / MAX_AQI) * SWEEP;
            const to = START_ANGLE + ((scaleBand.max + 1) / MAX_AQI) * SWEEP;

            return (
              <path
                key={scaleBand.id}
                d={describeArc(from, to)}
                fill="none"
                stroke={scaleBand.colorVar}
                strokeWidth={STROKE}
              />
            );
          })}
        </g>

        {/* Unfilled remainder, to give the ring a continuous edge. */}
        <path
          d={FULL_ARC}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={1}
        />

        <motion.path
          d={FULL_ARC}
          fill="none"
          stroke={band.colorVar}
          strokeWidth={STROKE}
          strokeLinecap="round"
          initial={{ pathLength: prefersReducedMotion ? fraction : 0 }}
          animate={{ pathLength: fraction }}
          transition={{ duration: DURATION.slow * 2, ease: EASE }}
          style={{ filter: `drop-shadow(0 0 12px ${band.colorVar})` }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/*
          `aria-hidden`: the accessible name on the <svg> already states the
          value, and a counting number read out by a screen reader is noise.
        */}
        <motion.span
          aria-hidden="true"
          className="text-5xl leading-none font-medium tabular-nums"
        >
          {displayed}
        </motion.span>
        <span
          aria-hidden="true"
          className="mt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
        >
          {caption}
        </span>
      </div>
    </div>
  );
}
