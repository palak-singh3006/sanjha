"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { queueListingDraft } from "@/lib/offline/db";
import { useI18n } from "@/lib/i18n/provider";
import { getHarvestLogs } from "@/lib/offline/db";
import { useEffect } from "react";

export default function ProfilePage() {
  const [village, setVillage] = useState("Hunasagi");
  const [land, setLand] = useState("3.5");
  const [crops, setCrops] = useState("Tomato, Onion");
  const [lang, setLang] = useState("kn");
  const { t } = useI18n();
  const [eco, setEco] = useState<{ income: number; savedKgCO2e: number }>({ income: 0, savedKgCO2e: 0 });

  useEffect(() => {
    (async () => {
      const logs = await getHarvestLogs();
      const income = logs.reduce((sum, h) => sum + (h.potentialIncomeINR ?? 0), 0);
      const savedKgCO2e = logs.reduce((sum, h) => sum + (h.ecoCreditSavedKgCO2e ?? 0), 0);
      setEco({ income, savedKgCO2e });
    })();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("profile_title")}</h1>
        <p className="mt-2 max-w-3xl text-[var(--foreground)]/65">{t("profile_sub")}</p>
      </div>

      <Card glass className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t("profile_card_title")}</CardTitle>
          <CardDescription>{t("profile_card_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block text-sm">
            <span className="text-[var(--foreground)]/60">{t("profile_village")}</span>
            <Input className="mt-1" value={village} onChange={(e) => setVillage(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--foreground)]/60">{t("profile_land")}</span>
            <Input className="mt-1" value={land} onChange={(e) => setLand(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--foreground)]/60">{t("profile_crops")}</span>
            <Input className="mt-1" value={crops} onChange={(e) => setCrops(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--foreground)]/60">{t("profile_lang_code")}</span>
            <Input className="mt-1" value={lang} onChange={(e) => setLang(e.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2">
            <Badge>{t("profile_coord_badge")}</Badge>
            <Badge variant="secondary">{t("profile_kyc_badge")}</Badge>
          </div>
          <Button
            type="button"
            onClick={async () => {
              await queueListingDraft({
                id: crypto.randomUUID(),
                crop: crops.split(",")[0]?.trim() || "Mixed",
                qtyKg: 500,
                minPrice: 36,
                status: "queued",
                createdAt: Date.now(),
              });
            }}
          >
            {t("profile_queue_btn")}
          </Button>
        </CardContent>
      </Card>

      <Card glass className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t("profile_eco_title")}</CardTitle>
          <CardDescription>{t("profile_eco_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--foreground)]/50">{t("profile_eco_income")}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              ₹{Math.round(eco.income).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--foreground)]/50">{t("profile_eco_co2")}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {Math.round(eco.savedKgCO2e).toLocaleString("en-IN")} kg
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
