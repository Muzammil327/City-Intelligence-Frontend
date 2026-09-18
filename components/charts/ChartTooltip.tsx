"use client";

import type { ReactNode } from "react";

import { getSeverityBand } from "@/lib/aqi/severity";

/**
 * One tooltip for every chart in the dashboard.
 *
 * Six charts with six hand-rolled hover cards is six chances to drift. This
 * is the surface they all share — Recharts charts pass it as `content`, and
 * the hand-drawn ones (`ForecastRibbon`, `AreaRankingChart`) render the same
 * `TooltipSurface` directly, so a hover reads identically everywhere.
 */

/** Recharts hands `content` an untyped payload; this is the part we rely on. */
interface TooltipEntry {
  name?: string | number;
  value?: string | number | Array<string | number> | null;
  dataKey?: string | number;
  color?: string;
}

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  /** Turns the axis label into the tooltip heading. */
  labelFormatter?: (label: string | number) => string;
  /** Appended to each numeric value, e.g. "µg/m³". */
  unit?: string;
  /**
   * Name the AQI band beside the number. On for anything plotting an AQI, so
   * severity is never carried by the line colour alone.
   */
  showBand?: boolean;
  /** Replaces the rendered value entirely, for non-AQI scales. */
  valueFormatter?: (value: number, entry: TooltipEntry) => string;
}

/** The visual shell, shared with the charts that are not built on Recharts. */
export function TooltipSurface({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none rounded-md border border-white/10 bg-popover/95 px-2.5 py-1.5 text-xs text-popover-foreground shadow-lg backdrop-blur-sm">
      {children}
    </div>
  );
}

/** Heading plus one row per series. */
export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  unit,
  showBand = false,
  valueFormatter,
}: ChartTooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;

  // A series with no value at this x is absent, not zero — skip the row
  // rather than printing a number the chart is not drawing.
  const rows = payload.filter(
    (entry) => entry.value !== null && entry.value !== undefined,
  );
  if (rows.length === 0) return null;

  const heading =
    label === undefined || label === null
      ? null
      : labelFormatter
        ? labelFormatter(label)
        : String(label);

  return (
    <TooltipSurface>
      {heading ? (
        <p className="mb-1 text-[10px] text-muted-foreground">
          {heading}
        </p>
      ) : null}

      <ul className="space-y-0.5">
        {rows.map((entry, index) => {
          const raw = Array.isArray(entry.value) ? entry.value[0] : entry.value;
          const numeric = typeof raw === "number" ? raw : Number(raw);
          const isNumber = Number.isFinite(numeric);

          const rendered =
            isNumber && valueFormatter
              ? valueFormatter(numeric, entry)
              : isNumber
                ? `${Math.round(numeric * 10) / 10}${unit ? ` ${unit}` : ""}`
                : String(raw);

          return (
            <li
              key={`${entry.dataKey ?? entry.name ?? index}`}
              className="flex items-center gap-2"
            >
              {entry.color ? (
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-[2px]"
                  style={{ background: entry.color }}
                />
              ) : null}
              {rows.length > 1 && entry.name ? (
                <span className="text-muted-foreground">{entry.name}</span>
              ) : null}
              <span className="tabular-nums">{rendered}</span>
              {showBand && isNumber ? (
                <span className="text-muted-foreground">
                  {getSeverityBand(numeric).label}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </TooltipSurface>
  );
}
