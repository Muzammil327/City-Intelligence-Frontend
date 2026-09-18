import { SEVERITY_BANDS } from "@/lib/aqi/severity";

/** The full band scale, so a colour on the map or chart can be read off. */
export function SeverityLegend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {SEVERITY_BANDS.map((band) => (
        <li key={band.id} className="flex items-center gap-1.5 text-xs">
          <span
            className={`${band.className} size-3 shrink-0 rounded-sm`}
            aria-hidden="true"
          />
          <span className="text-muted-foreground">
            {band.label}
            <span className="sr-only">
              , AQI {band.min} to {band.max}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
