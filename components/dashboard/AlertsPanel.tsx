import { Bell, CircleAlert, TriangleAlert } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AqiAlert } from "@/lib/aqi/alerts";
import { EmptyState } from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";

interface AlertsPanelProps {
  alerts: AqiAlert[];
}

const SEVERITY_CLASS = {
  critical: "border-red-600/50 text-red-700 dark:text-red-400",
  warning: "border-amber-500/50 text-amber-700 dark:text-amber-400",
  info: "border-sky-500/40 text-sky-700 dark:text-sky-400",
} as const;

const ICON = {
  critical: TriangleAlert,
  warning: CircleAlert,
  info: Bell,
} as const;

/** In-dashboard alert list — generated from data, needs no notification infra. */
export function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts</CardTitle>
        <CardDescription>
          Thresholds crossed, rapid rises and forecast crossings.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-2">
        {alerts.length === 0 ? (
          <EmptyState
            title="No active alerts"
            description="Nothing is crossing a pollution threshold right now."
          />
        ) : (
          alerts.map((alert) => {
            const Icon = ICON[alert.severity];
            return (
              <div
                key={alert.id}
                role="status"
                className={cn(
                  "flex gap-3 rounded-lg border p-3",
                  SEVERITY_CLASS[alert.severity],
                )}
              >
                <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {alert.detail}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}