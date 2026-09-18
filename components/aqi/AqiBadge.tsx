import { Badge } from "@/components/ui/badge";
import { getSeverityBand } from "@/lib/aqi/severity";
import { cn } from "@/lib/utils";

interface AqiBadgeProps {
  aqi: number;
  /** Show the numeric AQI alongside the band name. */
  showValue?: boolean;
  className?: string;
}

/**
 * The band label for an AQI value. Colour alone never carries the meaning —
 * the band name is always present as text.
 */
export function AqiBadge({ aqi, showValue = false, className }: AqiBadgeProps) {
  const band = getSeverityBand(aqi);

  return (
    <Badge className={cn(band.className, "border-transparent", className)}>
      {showValue ? `${aqi} · ${band.label}` : band.label}
    </Badge>
  );
}
