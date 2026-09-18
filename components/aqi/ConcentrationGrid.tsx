"use client";

import { motion } from "motion/react";

import { DISPLAY_CEILING } from "@/lib/aqi/reference-levels";
import type { Concentrations } from "@/lib/aqi/types";
import { DURATION, EASE, riseIn, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface ConcentrationGridProps {
  concentrations: Concentrations;
  /** Colour for the filled portion — pass the current band's `colorVar`. */
  accent?: string;
  className?: string;
}

const ROWS: ReadonlyArray<{
  field: keyof Concentrations;
  label: string;
  unit: string;
}> = [
  { field: "pm25", label: "PM2.5", unit: "µg/m³" },
  { field: "pm10", label: "PM10", unit: "µg/m³" },
  { field: "o3", label: "O₃", unit: "µg/m³" },
  { field: "no2", label: "NO₂", unit: "µg/m³" },
  { field: "so2", label: "SO₂", unit: "µg/m³" },
  { field: "co", label: "CO", unit: "µg/m³" },
  { field: "nh3", label: "NH₃", unit: "µg/m³" },
];

/**
 * Measured concentrations as proportional bars.
 *
 * Missing values render as "—" with no bar rather than 0: a zero-length bar
 * looks like a measurement of nothing, and a blank is honest about absence.
 */
export function ConcentrationGrid({
  concentrations,
  accent = "var(--color-primary)",
  className,
}: ConcentrationGridProps) {
  return (
    <motion.dl
      variants={stagger}
      initial="hidden"
      animate="visible"
      className={cn("space-y-3.5", className)}
    >
      {ROWS.map(({ field, label, unit }, index) => {
        const value = concentrations[field];
        const fraction =
          value != null
            ? Math.min(value / DISPLAY_CEILING[field], 1)
            : 0;

        return (
          <motion.div
            key={field}
            variants={riseIn}
            className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3"
          >
            <dt className="leading-tight">
              <span className="block text-xs font-medium">{label}</span>
              <span className="block font-mono text-[10px] text-muted-foreground">
                {unit}
              </span>
            </dt>

            <div
              className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
              aria-hidden="true"
            >
              {value != null ? (
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: accent, transformOrigin: "left" }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: fraction }}
                  transition={{
                    duration: DURATION.slow,
                    ease: EASE,
                    delay: 0.05 * index,
                  }}
                />
              ) : null}
            </div>

            <dd className="min-w-[4rem] text-right font-mono text-sm tabular-nums">
              {value != null ? (
                value.toFixed(1)
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </dd>
          </motion.div>
        );
      })}
    </motion.dl>
  );
}
