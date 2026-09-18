"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltipContent } from "@/components/charts/ChartTooltip";

import type { HistoryPoint } from "@/lib/aqi/types";
import { formatDateTime, formatHour, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/** The trace. Kept literal so the chart always reads as one red line. */
const TRACE_COLOR = "#ef4444";
/** The two provenance squares under the chart. */
const STORED_COLOR = "#f59e0b";
const ARCHIVE_COLOR = "#ef4444";

interface HistoryLineChartProps {
  history: HistoryPoint[];
  /** How many most-recent hours to draw. */
  hours?: number;
}

interface Datum {
  timestamp: string;
  aqi: number;
}

/**
 * Historical AQI as a single smooth red trace — the peak is the only thing
 * annotated on the plot. Lines are continuous even across mixed provenance:
 * the two squares underneath (orange = stored, red = archive) are the source
 * legend, not separate series.
 */
export function HistoryLineChart({ history, hours = 24 }: HistoryLineChartProps) {
  const data = useMemo<Datum[]>(() => {
    return [...history]
      .slice(0, Math.max(1, hours))
      .sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt))
      .map((point) => ({ timestamp: point.observedAt, aqi: point.aqi }));
  }, [history, hours]);

  const peak = useMemo(
    () =>
      data.reduce<Datum | null>(
        (best, datum) => (best && datum.aqi <= best.aqi ? best : datum),
        null,
      ),
    [data],
  );

  const hasStored = history.some((point) => point.source === "stored");
  const hasArchive = history.some((point) => point.source !== "stored");

  if (data.length === 0 || !peak) return null;

  return (
    <figure>
      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 30, right: 12, bottom: 0, left: 12 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="2 4"
              stroke="#ffffff0d"
            />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatHour}
              tickLine={false}
              axisLine={false}
              minTickGap={48}
              tick={{ fill: "#ffffff66", fontSize: 11 }}
            />
            <YAxis
              domain={[0, "dataMax + 30"]}
              hide
              width={0}
            />
            <Tooltip
              cursor={{ stroke: "#ffffff33", strokeWidth: 1 }}
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => formatDateTime(String(label))}
                  showBand
                />
              }
            />
            <Line
              dataKey="aqi"
              type="monotone"
              stroke={TRACE_COLOR}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <ReferenceDot
              x={peak.timestamp}
              y={peak.aqi}
              r={3.5}
              fill={TRACE_COLOR}
              stroke="none"
              ifOverflow="extendDomain"
              label={{
                value: String(peak.aqi),
                position: "top",
                fill: "#ffffff",
                fontSize: 13,
                fontWeight: 600,
                offset: 9,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-foreground/80">
          Peak <span className="tabular-nums">{peak.aqi}</span>
          <span className="text-muted-foreground">
            {" "}
            · {formatTime(peak.timestamp)}
          </span>
        </p>

        <ul className="flex items-center gap-4 text-xs text-muted-foreground">
          {hasStored ? (
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn("size-2.5 rounded-[3px]")}
                style={{ background: STORED_COLOR }}
              />
              Stored
            </li>
          ) : null}
          {hasArchive ? (
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn("size-2.5 rounded-[3px]")}
                style={{ background: ARCHIVE_COLOR }}
              />
              Archive
            </li>
          ) : null}
        </ul>
      </figcaption>
    </figure>
  );
}