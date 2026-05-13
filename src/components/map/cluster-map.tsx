"use client";

import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { mapFarms } from "@/lib/demo-data";
import { useI18n } from "@/lib/i18n/provider";

const center: [number, number] = [16.45, 76.45];

const riskColor: Record<string, string> = {
  high: "#f87171",
  med: "#fbbf24",
  low: "#4ade80",
};

function riskLabelKey(risk: string): "risk_high" | "risk_med" | "risk_low" {
  if (risk === "high") return "risk_high";
  if (risk === "med") return "risk_med";
  return "risk_low";
}

export function ClusterMap() {
  const { t } = useI18n();

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-[var(--foreground)]/10 shadow-xl">
      <MapContainer center={center} zoom={14} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mapFarms.map((f) => (
          <CircleMarker
            key={f.id}
            center={[f.lat, f.lng]}
            radius={10}
            pathOptions={{
              color: riskColor[f.risk] ?? "#22c55e",
              fillColor: riskColor[f.risk] ?? "#22c55e",
              fillOpacity: 0.55,
            }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={1}>
              {f.name} · {f.crop}
            </Tooltip>
            <Popup className="text-[var(--foreground)]">
              <div className="text-sm font-medium">{f.name}</div>
              <div className="text-xs opacity-80">{f.crop}</div>
              <div className="mt-1 text-xs">
                {t("map_popup_risk")} {t(riskLabelKey(f.risk))}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-xl border border-[var(--foreground)]/10 bg-[var(--background)]/80 px-3 py-2 text-xs backdrop-blur-md">
        {t("map_overlay_tip")}
      </div>
    </div>
  );
}
