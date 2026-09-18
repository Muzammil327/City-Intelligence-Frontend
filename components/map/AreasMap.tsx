"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

import type { AreaReading } from "@/lib/aqi/types";
import { getSeverityBand } from "@/lib/aqi/severity";
import { compassDirection } from "@/lib/format";

interface AreasMapProps {
  areas: AreaReading[];
}

const LAHORE_CENTER: [number, number] = [31.52, 74.36];

/**
 * The neighbourhood points on a real map. Each marker is coloured by its AQI
 * band; every point also carries a glow whose size and brightness grow with
 * the AQI, so bad air reads as heat at a glance. The points are rendered
 * *as model grid points* in the popup — this is not claiming physical stations.
 */
export function AreasMap({ areas }: AreasMapProps) {
  if (areas.length === 0) return null;

  return (
    <MapContainer
      center={LAHORE_CENTER}
      zoom={11}
      className="z-0 h-[420px] w-full rounded-lg"
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {areas.map((area) => {
        const band = getSeverityBand(area.aqi);
        // Glow scales with AQI: faint for clean air, hot and large when bad.
        const heat = Math.min(1, Math.max(0, (area.aqi - 50) / 250));
        return (
          <CircleMarker
            key={`${area.uid}-glow`}
            center={[area.latitude, area.longitude]}
            radius={12 + heat * 24}
            pathOptions={{
              color: band.colorVar,
              fillColor: band.colorVar,
              fillOpacity: 0.08 + heat * 0.75,
              opacity: 0,
            }}
          />
        );
      })}

      {areas.map((area) => {
        const band = getSeverityBand(area.aqi);
        return (
          <CircleMarker
            key={area.uid}
            center={[area.latitude, area.longitude]}
            radius={7}
            pathOptions={{
              color: band.colorVar,
              fillColor: band.colorVar,
              fillOpacity: 0.85,
              weight: 2,
            }}
          >
            <Popup>
              <div className="space-y-0.5 text-sm">
                <p className="font-medium">{area.name}</p>
                <p className="text-xs text-muted-foreground">
                  AQI {area.aqi} · {band.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  PM2.5{" "}
                  {area.pm25 != null ? `${area.pm25.toFixed(1)} µg/m³` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {area.temperatureC != null
                    ? `${area.temperatureC.toFixed(1)} °C`
                    : ""}
                  {area.windSpeedMs != null
                    ? ` · ${area.windSpeedMs.toFixed(1)} m/s ${
                        compassDirection(area.windDirectionDeg) ?? ""
                      }`
                    : ""}
                </p>
                <p className="pt-1 text-[10px] text-muted-foreground">
                  Model grid point, not a physical station
                </p>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}