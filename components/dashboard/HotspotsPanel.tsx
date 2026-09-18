import { AqiBadge } from "@/components/aqi/AqiBadge";
import { SeverityDonut } from "@/components/charts/SeverityDonut";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AreaReading, OverallSummary } from "@/lib/aqi/types";

interface HotspotsPanelProps {
  /** Sorted worst-first. */
  areas: AreaReading[];
  overall: OverallSummary;
}

/**
 * The areas with the highest pollution right now, compared against the city’s
 * overall value. No ranking here is invented — it is the real ordering of the
 * neighbourhood readings, plus an explicit note that they are model-derived
 * grid points rather than physical stations.
 */
export function HotspotsPanel({ areas, overall }: HotspotsPanelProps) {
  // Ranked worst-first: the list is not guaranteed sorted upstream. Every
  // area is listed, so the ranking and the ring beside it count the same set.
  const hotspots = [...areas].sort((a, b) => b.aqi - a.aqi);
  if (hotspots.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Highest pollution areas</CardTitle>
        <CardDescription>
          Real neighbourhood readings, ranked against the city average of{" "}
          {overall.aqi}.
        </CardDescription>
      </CardHeader>

      {/* Ranking on the left, the city-wide band split on the right. */}
      <CardContent className="grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
        <div>
          <ul className="space-y-2">
            {hotspots.map((area, index) => {
              const delta = area.aqi - overall.aqi;
              return (
                <li
                  key={area.uid}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-5 shrink-0 text-right text-xs text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{area.name}</p>
                      <p className="text-xs text-muted-foreground">
                        AQI {area.aqi}
                        {delta > 0 ? ` · +${delta} above city average` : ""}
                      </p>
                    </div>
                  </div>
                  <AqiBadge aqi={area.aqi} />
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Values come from Open-Meteo’s model at each neighbourhood’s
            coordinates — real, but grid-based, not physical stations.
          </p>
        </div>

        <SeverityDonut areas={areas} />
      </CardContent>
    </Card>
  );
}