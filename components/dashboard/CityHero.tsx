"use client";

import { Droplets, Navigation, Thermometer, Wind } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import { AqiBadge } from "@/components/aqi/AqiBadge";
import { AqiGauge } from "@/components/aqi/AqiGauge";
import { QualityIndicator } from "@/components/dashboard/QualityIndicator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSeverityBand } from "@/lib/aqi/severity";
import type { DataQuality } from "@/lib/aqi/quality";
import type { CurrentReading } from "@/lib/aqi/types";
import { compassDirection } from "@/lib/format";
import { riseIn, stagger } from "@/lib/motion";

interface CityHeroProps {
  current: CurrentReading;
  quality: DataQuality;
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <motion.div
      variants={riseIn}
      className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5"
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/5 text-muted-foreground"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </dt>
        <dd className="font-mono text-base tabular-nums leading-tight">
          {value}
        </dd>
      </div>
    </motion.div>
  );
}

/**
 * The headline readout: the live city AQI as the primary visual element, its
 * category, the data-quality state, and the weather metrics that travel with it.
 *
 * The gauge earns the left column on its own — everything else on the page is
 * a qualification of that one number, so nothing else competes with it.
 */
export function CityHero({ current, quality }: CityHeroProps) {
  const band = getSeverityBand(current.aqi);
  const windDirection = compassDirection(
    current.weather?.windDirectionDeg ?? null,
  );

  return (
    <Card className="relative overflow-hidden">
      {/* A wash of the current band's colour, so the card itself carries the
          severity before any text is read. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: band.colorVar, opacity: 0.5 }}
      />

      <CardHeader>
        <CardTitle className="text-xl tracking-tight">
          Current air quality — Lahore
        </CardTitle>
        <CardDescription>
          <QualityIndicator quality={quality} />
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:gap-10">
          <div className="flex flex-col items-center gap-4">
            <AqiGauge aqi={current.aqi} />
            <AqiBadge aqi={current.aqi} />
          </div>

          <div className="flex flex-col justify-center gap-5">
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              {band.advice}
            </p>

            <motion.dl
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 gap-3 sm:grid-cols-3"
            >
              <Metric
                icon={<span className="text-[10px] font-semibold">PM2.5</span>}
                label="Fine"
                value={
                  current.concentrations.pm25 != null
                    ? `${current.concentrations.pm25.toFixed(1)}`
                    : "—"
                }
              />
              <Metric
                icon={<span className="text-[10px] font-semibold">PM10</span>}
                label="Coarse"
                value={
                  current.concentrations.pm10 != null
                    ? `${current.concentrations.pm10.toFixed(1)}`
                    : "—"
                }
              />
              <Metric
                icon={<Thermometer className="size-4" aria-hidden="true" />}
                label="Temp"
                value={
                  current.weather?.temperatureC != null
                    ? `${current.weather.temperatureC.toFixed(1)} °C`
                    : "—"
                }
              />
              <Metric
                icon={<Droplets className="size-4" aria-hidden="true" />}
                label="Humidity"
                value={
                  current.weather?.humidityPct != null
                    ? `${Math.round(current.weather.humidityPct)}%`
                    : "—"
                }
              />
              <Metric
                icon={<Wind className="size-4" aria-hidden="true" />}
                label="Wind"
                value={
                  current.weather?.windSpeedMs != null
                    ? `${current.weather.windSpeedMs.toFixed(1)} m/s`
                    : "—"
                }
              />
              <Metric
                icon={<Navigation className="size-4" aria-hidden="true" />}
                label="Bearing"
                value={
                  windDirection ??
                  (current.weather?.windDirectionDeg != null
                    ? `${Math.round(current.weather.windDirectionDeg)}°`
                    : "—")
                }
              />
            </motion.dl>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
