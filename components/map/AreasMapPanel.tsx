"use client";

import dynamic from "next/dynamic";

import { SeverityLegend } from "@/components/aqi/SeverityLegend";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AreaReading } from "@/lib/aqi/types";

interface AreasMapPanelProps {
  areas: AreaReading[];
}

/**
 * The map, pulled in only on the client: Leaflet touches the DOM at import time
 * and has icon assets that fight the bundler, so it must never run server-side.
 */
const AreasMap = dynamic(
  () => import("./AreasMap").then((module) => module.AreasMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[420px] w-full rounded-lg" />,
  },
);

export function AreasMapPanel({ areas }: AreasMapPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Neighbourhood map</CardTitle>
        <CardDescription>
          Real readings at model grid points across the city. Colours follow
          the severity scale; the glow around each point grows with the AQI, so
          bad air reads as heat.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <AreasMap areas={areas} />
        <SeverityLegend />
      </CardContent>
    </Card>
  );
}