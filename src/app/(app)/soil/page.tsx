"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  estimateSoilReport,
  type FarmMethod,
  type SoilType,
} from "@/lib/soil-engine";
import { useI18n } from "@/lib/i18n/provider";

const soilOptions: { value: SoilType; key: string }[] = [
  { value: "black", key: "soil_opt_black" },
  { value: "clay", key: "soil_opt_clay" },
  { value: "loam", key: "soil_opt_loam" },
  { value: "sandy", key: "soil_opt_sandy" },
];

const methodOptions: { value: FarmMethod; key: string }[] = [
  { value: "organic", key: "soil_opt_organic" },
  { value: "mixed", key: "soil_opt_mixed" },
  { value: "conventional", key: "soil_opt_conventional" },
];

export default function SoilPage() {
  const [crop, setCrop] = useState("tomato");
  const [soilType, setSoilType] = useState<SoilType>("black");
  const [method, setMethod] = useState<FarmMethod>("mixed");
  const [weeks, setWeeks] = useState(4);
  const { t, tReplace } = useI18n();

  const report = useMemo(
    () =>
      estimateSoilReport({
        previousCrop: crop,
        soilType,
        method,
        weeksSinceHarvest: weeks,
      }),
    [crop, soilType, method, weeks],
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("soil_title")}</h1>
        <p className="mt-2 max-w-3xl text-[var(--foreground)]/65">{t("soil_sub")}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card glass className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t("soil_inputs")}</CardTitle>
            <CardDescription>{t("soil_inputs_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="block text-sm">
              <span className="text-[var(--foreground)]/60">{t("soil_prev_crop")}</span>
              <Input className="mt-1" value={crop} onChange={(e) => setCrop(e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--foreground)]/60">{t("soil_soil_type")}</span>
              <select
                className="mt-1 flex h-11 w-full rounded-xl border border-[var(--foreground)]/15 bg-[var(--foreground)]/5 px-3 text-sm"
                value={soilType}
                onChange={(e) => setSoilType(e.target.value as SoilType)}
              >
                {soilOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t(o.key)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-[var(--foreground)]/60">{t("soil_method")}</span>
              <select
                className="mt-1 flex h-11 w-full rounded-xl border border-[var(--foreground)]/15 bg-[var(--foreground)]/5 px-3 text-sm"
                value={method}
                onChange={(e) => setMethod(e.target.value as FarmMethod)}
              >
                {methodOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t(o.key)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-[var(--foreground)]/60">{t("soil_weeks")}</span>
              <Input
                type="number"
                min={1}
                className="mt-1"
                value={weeks}
                onChange={(e) => setWeeks(Number(e.target.value))}
              />
            </label>
            <Button type="button" variant="secondary" className="w-full">
              {t("soil_save_btn")}
            </Button>
          </CardContent>
        </Card>

        <Card glass className="lg:col-span-2">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>{t("soil_est_title")}</CardTitle>
              <CardDescription>{t("soil_est_desc")}</CardDescription>
            </div>
            <Badge variant="gold">{t("soil_iot_badge")}</Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { k: "soil_n", v: report.nitrogen },
                { k: "soil_p", v: report.phosphorus },
                { k: "soil_k", v: report.potassium },
              ].map((x) => (
                <div key={x.k} className="rounded-2xl border border-[var(--foreground)]/10 p-4">
                  <p className="text-xs uppercase tracking-wider text-[var(--foreground)]/50">{t(x.k)}</p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums">{Math.round(x.v)}%</p>
                  <Progress value={x.v} className="mt-3" />
                </div>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 p-4 text-sm">
                <p className="text-xs uppercase tracking-wider text-[var(--foreground)]/50">
                  {t("soil_stress")}
                </p>
                <p className="mt-2 text-4xl font-semibold">{Math.round(report.stress)}</p>
                <Progress value={report.stress} className="mt-3" />
                <p className="mt-3 text-[var(--foreground)]/65">
                  {tReplace("soil_recovery_line", { weeks: report.recoveryWeeks })}
                </p>
              </div>
              <div className="space-y-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm">
                <p>
                  <strong>{t("soil_label_compost")}</strong> {report.compostSuggestion}
                </p>
                <p>
                  <strong>{t("soil_label_green")}</strong> {report.greenManure}
                </p>
                <p>
                  <strong>{t("soil_label_legume")}</strong> {report.legume}
                </p>
                <p>
                  <strong>{t("soil_label_short")}</strong> {report.shortRecoveryCrops.join(", ")}
                </p>
                <p>
                  <strong>{t("soil_label_next")}</strong> {report.nextCrop}
                </p>
                <p className="text-emerald-800 dark:text-emerald-100/90">{report.profitBand}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
