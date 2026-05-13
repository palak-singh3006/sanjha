"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ClusterMapLazy } from "@/components/map/cluster-map-lazy";
import { useI18n } from "@/lib/i18n/provider";

export default function MapPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("map_title")}</h1>
        <p className="mt-2 max-w-3xl text-[var(--foreground)]/65">{t("map_sub")}</p>
      </div>
      <ClusterMapLazy />
      <Card glass>
        <CardHeader>
          <CardTitle>{t("map_waste_title")}</CardTitle>
          <CardDescription>{t("map_waste_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-[var(--foreground)]/70">{t("map_waste_body")}</CardContent>
      </Card>
    </div>
  );
}
