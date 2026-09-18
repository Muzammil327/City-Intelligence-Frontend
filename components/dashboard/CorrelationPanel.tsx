"use client";

import { useState } from "react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/common/EmptyState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { pearson, type WeatherVariable } from "@/lib/aqi/correlation";
import type { HistoryPoint } from "@/lib/aqi/types";
import { cn } from "@/lib/utils";

interface CorrelationPanelProps {
  history: HistoryPoint[];
}

const CHOICES: ReadonlyArray<{
  variable: WeatherVariable;
  label: string;
  xLabel: string;
}> = [
  { variable: "windSpeedMs", label: "Wind", xLabel: "Wind speed (m/s)" },
  { variable: "humidityPct", label: "Humidity", xLabel: "Humidity (%)" },
  { variable: "temperatureC", label: "Temperature", xLabel: "Temperature (°C)" },
];

/** Describe a Pearson r without overstating it. */
function strength(r: number): string {
  const abs = Math.abs(r);
  if (abs >= 0.7) return "strong";
  if (abs >= 0.4) return "moderate";
  if (abs >= 0.2) return "weak";
  return "negligible";
}

/**
 * AQI against each weather variable, from real observations. The relationship
 * is described as an association and the caveat is in the UI: these variables
 * co-move with season and time of day, so nothing here is claimed as cause.
 */
export function CorrelationPanel({ history }: CorrelationPanelProps) {
  const [variable, setVariable] = useState<WeatherVariable>("windSpeedMs");
  const choice =
    CHOICES.find((candidate) => candidate.variable === variable) ??
    (CHOICES[0] as (typeof CHOICES)[number]);
  const result = pearson(history, variable);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weather &amp; pollution</CardTitle>
        <CardDescription>
          Hourly observations of AQI against weather. An association is shown —
          not a proven cause.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div
          role="tablist"
          aria-label="Weather variable"
          className="inline-flex rounded-lg border p-0.5"
        >
          {CHOICES.map(({ variable: key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={variable === key}
              onClick={() => setVariable(key)}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium",
                variable === key
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {result.r == null ? (
          <EmptyState
            title="Not enough joined data"
            description="Fewer than three hourly readings carried both AQI and this weather variable."
          />
        ) : (
          <>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 8, right: 8, bottom: 4, left: -12 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name={choice.xLabel}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                    tickFormatter={(value: number) =>
                      Number(value).toFixed(0)
                    }
                  />
                  <YAxis
                    type="number"
                    dataKey="aqi"
                    name="AQI"
                    domain={[0, "dataMax + 25"]}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--color-popover-foreground)",
                      fontSize: 12,
                    }}
                    formatter={(value, name) => [
                      name === "AQI" ? String(value) : `${value}`,
                      name === "AQI" ? "AQI" : choice.xLabel,
                    ]}
                    cursor={{ strokeDasharray: "3 3" }}
                  />
                  <Scatter
                    data={result.points}
                    fill="var(--color-primary)"
                    fillOpacity={0.5}
                    isAnimationActive={false}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <p className="text-sm text-muted-foreground">
              Association over {result.sampleHours} hours:{" "}
              <span className="font-medium">
                {strength(result.r)} ({result.r > 0 ? "positive" : "negative"}, r
                = {result.r.toFixed(2)})
              </span>
              . AQI and {choice.label.toLowerCase()} move together in the data,
              which can reflect daily patterns as much as weather — treat it as
              a hint, not a mechanism.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}