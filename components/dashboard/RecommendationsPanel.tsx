"use client";

import { motion } from "motion/react";

import { ForecastRibbon } from "@/components/charts/ForecastRibbon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BestWindow } from "@/lib/aqi/best-time";
import {
  getSeverityBand,
  SEVERITY_BANDS,
  type SeverityId,
} from "@/lib/aqi/severity";
import type { ForecastPoint } from "@/lib/aqi/types";
import { DURATION, EASE, riseIn, stagger } from "@/lib/motion";

interface RecommendationsPanelProps {
  /** The current city AQI, or null while it is still loading. */
  currentAqi: number | null;
  forecast: ForecastPoint[];
  bestWindow: BestWindow | null;
}

/**
 * A compact restatement of each band's EPA guidance, per topic.
 *
 * Two or three words, because this is read at a glance beside a meter. The
 * full sentence for the current band is already on the hero card, so nothing
 * is lost by not repeating it here.
 */
const GUIDANCE: Record<
  SeverityId,
  { activity: string; exercise: string; indoor: string }
> = {
  good: { activity: "Go ahead", exercise: "No limits", indoor: "Open up" },
  moderate: { activity: "Fine", exercise: "Fine", indoor: "Open up" },
  sensitive: {
    activity: "Take care",
    exercise: "Ease off",
    indoor: "Air out briefly",
  },
  unhealthy: {
    activity: "Limit time",
    exercise: "Move indoors",
    indoor: "Keep closed",
  },
  "very-unhealthy": {
    activity: "Avoid",
    exercise: "Indoors only",
    indoor: "Keep closed",
  },
  hazardous: { activity: "Stay in", exercise: "Rest", indoor: "Seal up" },
};

const TOPICS = [
  { key: "activity", label: "Outdoors" },
  { key: "exercise", label: "Exercise" },
  { key: "indoor", label: "Windows" },
] as const;

/** Where the current band sits on the six-band scale. */
function bandIndex(id: SeverityId): number {
  return SEVERITY_BANDS.findIndex((band) => band.id === id);
}

function Meter({ level, color }: { level: number; color: string }) {
  return (
    <div className="flex gap-0.5" aria-hidden="true">
      {SEVERITY_BANDS.map((band, index) => (
        <motion.span
          key={band.id}
          className="h-1 w-full rounded-full"
          style={{ background: index <= level ? color : "var(--color-border)" }}
          initial={{ opacity: 0, scaleX: 0.4 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{
            duration: DURATION.fast,
            ease: EASE,
            delay: index * 0.03,
          }}
        />
      ))}
    </div>
  );
}

/**
 * What today's air means for what you do, and when in the day to do it.
 *
 * Deliberately not prose: the previous version was five paragraphs of advice
 * that read as a wall and got skipped. The forecast strip answers "when", the
 * meters answer "how bad, for what" — both without a sentence to finish.
 */
export function RecommendationsPanel({
  currentAqi,
  forecast,
  bestWindow,
}: RecommendationsPanelProps) {
  if (currentAqi === null) return null;

  const band = getSeverityBand(currentAqi);
  const level = bandIndex(band.id);
  const guidance = GUIDANCE[band.id];

  return (
    <Card>
      <CardHeader>
        <CardTitle>What to do today</CardTitle>
        <CardDescription>
          Informational guidance from the current band and forecast — not
          medical advice.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <motion.dl
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-3 gap-4"
        >
          {TOPICS.map((topic) => (
            <motion.div key={topic.key} variants={riseIn} className="space-y-2">
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {topic.label}
              </dt>
              <dd className="space-y-2">
                <p className="text-sm font-medium leading-tight">
                  {guidance[topic.key]}
                </p>
                <Meter level={level} color={band.colorVar} />
              </dd>
            </motion.div>
          ))}
        </motion.dl>

        {forecast.length > 0 ? (
          <div className="space-y-2 border-t border-white/5 pt-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Next {forecast.length} hours
            </p>
            <ForecastRibbon points={forecast} bestWindow={bestWindow} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
