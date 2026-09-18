import { ArrowDownRight, ArrowUpRight, MoveRight } from "lucide-react";

import { AqiTrendChart } from "@/components/charts/AqiTrendChart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ForecastPoint, HistoryPoint } from "@/lib/aqi/types";
import type { TrendSummary } from "@/lib/aqi/trend";
import { cn } from "@/lib/utils";

interface TrendPanelProps {
  history: HistoryPoint[];
  forecast: ForecastPoint[];
  trend: TrendSummary | null;
}

function TrendBadge({ trend }: { trend: TrendSummary | null }) {
  if (!trend) {
    return (
      <Badge variant="secondary">Trend unavailable</Badge>
    );
  }

  const Icon =
    trend.direction === "increasing"
      ? ArrowUpRight
      : trend.direction === "decreasing"
        ? ArrowDownRight
        : MoveRight;

  return (
    <Badge
      variant="secondary"
      className={cn(
        trend.direction === "increasing" && "border-red-600/40 text-red-600",
        trend.direction === "decreasing" && "border-emerald-600/40 text-emerald-600",
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {trend.label} · {trend.deltaAqi > 0 ? "+" : ""}
      {trend.deltaAqi} over {trend.sampleHours} h
    </Badge>
  );
}

/**
 * The observed-vs-predicted AQI series. The trend chip is computed from real
 * observations (see `lib/aqi/trend.ts`); the dashed forecast is labelled as a
 * projection everywhere, including the chart legend.
 */
export function TrendPanel({ history, forecast, trend }: TrendPanelProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <CardTitle>AQI trend &amp; 24h forecast</CardTitle>
            <CardDescription>
              Solid line: observed. Dashed line: predicted.
            </CardDescription>
          </div>
          <TrendBadge trend={trend} />
        </div>
      </CardHeader>
      <CardContent>
        <AqiTrendChart history={history} forecast={forecast} />
      </CardContent>
    </Card>
  );
}