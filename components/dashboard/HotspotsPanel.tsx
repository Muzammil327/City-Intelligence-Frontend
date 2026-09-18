import { AqiBadge } from "@/components/aqi/AqiBadge";
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

const TOP_N = 4;

/**
 * The areas with the highest pollution right now, compared against the city’s
 * overall value. No ranking here is invented — it is the real ordering of the
 * neighbourhood readings, plus an explicit note that they are model-derived
 * grid points rather than physical stations.
 */
export function HotspotsPanel({ areas, overall }: HotspotsPanelProps) {
  // Ranked worst-first: the list is not guaranteed sorted upstream.
  const hotspots = [...areas]
    .sort((a, b) => b.aqi - a.aqi)
    .slice(0, TOP_N);
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

      <CardContent>
        <ul className="space-y-2">
          {hotspots.map((area, index) => {
            const delta = area.aqi - overall.aqi;
            return (
              <li
                key={area.uid}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground">
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
      </CardContent>
    </Card>
  );
}