import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ForecastInsight } from "@/lib/aqi/insights";
import type { ForecastResponse } from "@/lib/aqi/types";

interface ExplainableForecastCardProps {
  insight: ForecastInsight;
  forecast: ForecastResponse;
}

/**
 * The "why" behind the forecast, kept honest: model inputs and associated
 * conditions, never claimed as causes. The model metadata line states how the
 * forecast was produced and flags that r2 is in-sample fit, not accuracy.
 */
export function ExplainableForecastCard({
  insight,
  forecast,
}: ExplainableForecastCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Why this forecast</CardTitle>
        <CardDescription>
          {insight.summary}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {insight.factors.map((factor) => (
            <li key={factor.label} className="flex gap-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{factor.label}</p>
                <p className="text-xs text-muted-foreground">
                  {factor.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <p className="text-xs text-muted-foreground">{insight.caveat}</p>

        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
          <div>
            <dt className="inline">Model: </dt>
            <dd className="inline font-medium">{forecast.model}</dd>
          </div>
          <div>
            <dt className="inline">Training hours: </dt>
            <dd className="inline font-medium">{forecast.trainingSamples}</dd>
          </div>
          <div>
            <dt className="inline">Weather basis: </dt>
            <dd className="inline font-medium capitalize">
              {forecast.weatherBasis}
            </dd>
          </div>
          {forecast.r2Score != null ? (
            <div>
              <dt className="inline">In-sample r² (fit, not accuracy): </dt>
              <dd className="inline font-medium">{forecast.r2Score}</dd>
            </div>
          ) : null}
          <Badge
            variant="outline"
            className="border-dashed text-muted-foreground"
          >
            Predicted — not observed
          </Badge>
        </dl>
      </CardContent>
    </Card>
  );
}