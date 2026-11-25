"use client";

import { Badge } from "@/components/ui/badge";
import { ClusterMapLazy } from "@/components/map/cluster-map-lazy";
import { useI18n } from "@/lib/i18n/provider";
import { MapPin, Layers } from "lucide-react";

export default function MapPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--border)] pb-5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
            SANJHA Spatial GIS
          </span>
          <span className="text-[var(--border-strong)]">·</span>
          <Badge variant="forest" className="text-[10px] py-0 px-2">Live Geolocation</Badge>
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl text-[var(--foreground)]">
          {t("map_title")}
        </h1>
        <p className="mt-1 text-xs text-[var(--muted-foreground)] max-w-2xl">
          Multi-cluster geographic coordinates, high-risk tomato glut catchment zones, and terminal mandi logistics corridors across Yadgir district.
        </p>
      </div>

      <ClusterMapLazy />

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex items-center gap-2 pb-2">
          <Layers className="h-4 w-4 text-[var(--forest)]" />
          <h2 className="text-sm font-semibold text-[var(--foreground)]">{t("map_waste_title")}</h2>
        </div>
        <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
          {t("map_waste_body")}
        </p>
      </div>
    </div>
  );
}
