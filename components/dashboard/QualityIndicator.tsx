import { Badge } from "@/components/ui/badge";
import type { DataQuality } from "@/lib/aqi/quality";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface QualityIndicatorProps {
  quality: DataQuality;
}

const STATUS_CLASS: Record<DataQuality["status"], string> = {
  live: "bg-emerald-600 text-white",
  recent: "bg-amber-500 text-black",
  stale: "bg-red-600 text-white",
  limited: "bg-orange-500 text-black",
  unavailable: "bg-muted text-muted-foreground",
};

/**
 * A badge that says how trustworthy the current numbers are and when they were
 * actually observed. A stale reading is labelled stale; nothing here pretends
 * old data is live.
 */
export function QualityIndicator({ quality }: QualityIndicatorProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <Badge className={cn("border-transparent", STATUS_CLASS[quality.status])}>
        {quality.label}
      </Badge>
      <span className="text-xs text-muted-foreground">{quality.detail}</span>
      {quality.lastUpdated ? (
        <time
          dateTime={quality.lastUpdated}
          className="text-xs text-muted-foreground"
        >
          {formatDateTime(quality.lastUpdated)}
        </time>
      ) : null}
    </div>
  );
}