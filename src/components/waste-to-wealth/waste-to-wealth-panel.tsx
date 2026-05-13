"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n/provider";
import {
  computeB2BMatches,
  computePotentialSecondaryIncome,
  computeResiduesKg,
  cropFromLabel,
  fetchMarketPrices,
  makeQrPayload,
  type CollectionLot,
  type HarvestLogInput,
  type IndustryType,
} from "@/lib/waste-to-wealth";
import { addCollectionLot, addHarvestLog, getCollectionLots, getHarvestLogs, updateCollectionLotStage } from "@/lib/offline/db";
import { getCurrentGeo } from "@/lib/waste-to-wealth/geolocation";
import { QrCode } from "./qr-code";

function formatINR(n: number) {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `₹${Math.round(n)}`;
  }
}

function formatKg(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(2)}t`;
  return `${Math.round(n)}kg`;
}

export function WasteToWealthPanel() {
  const { t, tReplace } = useI18n();
  const [farmLabel, setFarmLabel] = useState("Plot A — Shivappa");
  const [cropLabel, setCropLabel] = useState("Tomato");
  const [harvestedKg, setHarvestedKg] = useState(1200);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [busyGeo, setBusyGeo] = useState(false);

  const [harvestLogs, setHarvestLogs] = useState<Awaited<ReturnType<typeof getHarvestLogs>>>([]);
  const [lots, setLots] = useState<Awaited<ReturnType<typeof getCollectionLots>>>([]);

  const [lastAlert, setLastAlert] = useState<{
    logId: string;
    incomeINR: number;
    savedKgCO2e: number;
    confidence: number;
  } | null>(null);

  const crop = useMemo(() => cropFromLabel(cropLabel), [cropLabel]);

  useEffect(() => {
    (async () => {
      setHarvestLogs(await getHarvestLogs());
      setLots(await getCollectionLots());
    })();
  }, []);

  const nowMs = () => new Date().valueOf();

  const previewInput: HarvestLogInput = useMemo(
    () => ({
      crop,
      harvestedKg: Number(harvestedKg) || 0,
      farmLabel,
      geo: geo ?? undefined,
    }),
    [crop, harvestedKg, farmLabel, geo],
  );

  const previewResidues = useMemo(() => computeResiduesKg(previewInput), [previewInput]);

  const previewMatches = useMemo(() => computeB2BMatches({ residues: previewResidues, geo: geo ?? undefined }).slice(0, 3), [
    previewResidues,
    geo,
  ]);

  async function refreshStores() {
    setHarvestLogs(await getHarvestLogs());
    setLots(await getCollectionLots());
  }

  async function onUseLocation() {
    setBusyGeo(true);
    try {
      const g = await getCurrentGeo();
      setGeo(g);
    } finally {
      setBusyGeo(false);
    }
  }

  async function onLogHarvest() {
    const g = geo ?? { lat: 16.45, lng: 76.45 };
    const harvestedAt = nowMs();
    const prices = await fetchMarketPrices(g);
    const input: HarvestLogInput = { ...previewInput, harvestedAt };
    const residues = computeResiduesKg(input);
    const prediction = computePotentialSecondaryIncome({ input, residues, prices });

    const id = crypto.randomUUID();
    await addHarvestLog({
      id,
      crop,
      harvestedKg: input.harvestedKg,
      harvestedAt: input.harvestedAt ?? harvestedAt,
      farmLabel: input.farmLabel,
      geo: input.geo,
      residueBreakdownKg: residues,
      marketPricesINRPerTon: prices,
      potentialIncomeINR: prediction.potentialIncomeINR,
      breakdownINR: prediction.breakdownINR,
      ecoCreditSavedKgCO2e: prediction.ecoCreditSavedKgCO2e,
      confidence: prediction.confidence,
      createdAt: nowMs(),
    });

    setLastAlert({
      logId: id,
      incomeINR: prediction.potentialIncomeINR,
      savedKgCO2e: prediction.ecoCreditSavedKgCO2e,
      confidence: prediction.confidence,
    });

    await refreshStores();
  }

  async function onCreateLot(match: { industryType: IndustryType; industryName: string }) {
    const recent = [...harvestLogs].slice(-5);
    const harvestLogIds = recent.map((h) => h.id);

    // Aggregate residue for selected logs
    const residueBreakdownKg = recent.reduce(
      (acc, h) => {
        acc.stalkKg += h.residueBreakdownKg.stalkKg;
        acc.huskKg += h.residueBreakdownKg.huskKg;
        acc.stubbleKg += h.residueBreakdownKg.stubbleKg;
        acc.totalResidueKg += h.residueBreakdownKg.totalResidueKg;
        return acc;
      },
      { stalkKg: 0, huskKg: 0, stubbleKg: 0, totalResidueKg: 0 },
    );

    const lotId = crypto.randomUUID();
    const qrPayload = makeQrPayload(lotId);
    const createdAt = nowMs();

    const lot: CollectionLot = {
      lotId,
      createdAt,
      industryType: match.industryType,
      industryName: match.industryName,
      harvestLogIds,
      residueBreakdownKg,
      geo: geo ?? undefined,
      qrPayload,
      stages: [{ stage: "created", at: createdAt, note: "Lot created for aggregated pickup" }],
    };

    await addCollectionLot(lot);
    await refreshStores();
  }

  async function onAdvanceLot(lotId: string) {
    const lot = lots.find((l) => l.lotId === lotId);
    if (!lot) return;
    const stages = lot.stages?.map((s) => s.stage) ?? [];
    const last = stages[stages.length - 1] ?? "created";
    const next =
      last === "created"
        ? "collected"
        : last === "collected"
          ? "packed"
          : last === "packed"
            ? "in-transit"
            : last === "in-transit"
              ? "delivered"
              : "delivered";
    if (next === last) return;
    await updateCollectionLotStage(lotId, { stage: next, at: nowMs() });
    await refreshStores();
  }

  const ecoTotals = useMemo(() => {
    const saved = harvestLogs.reduce((sum, h) => sum + (h.ecoCreditSavedKgCO2e ?? 0), 0);
    const income = harvestLogs.reduce((sum, h) => sum + (h.potentialIncomeINR ?? 0), 0);
    return { saved, income };
  }, [harvestLogs]);

  return (
    <div className="space-y-4">
      <Card glass>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>{t("w2w_title")}</CardTitle>
              <CardDescription>
                {t("w2w_sub")}
              </CardDescription>
            </div>
            <Badge variant="gold">{t("w2w_badge_new")}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-3 rounded-2xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--foreground)]/50">{t("w2w_harvest_log")}</p>
            <label className="block text-sm">
              <span className="text-[var(--foreground)]/60">{t("w2w_farm")}</span>
              <Input className="mt-1" value={farmLabel} onChange={(e) => setFarmLabel(e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--foreground)]/60">{t("w2w_crop")}</span>
              <Input className="mt-1" value={cropLabel} onChange={(e) => setCropLabel(e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--foreground)]/60">{t("w2w_harvested_kg")}</span>
              <Input
                type="number"
                min={0}
                className="mt-1"
                value={String(harvestedKg)}
                onChange={(e) => setHarvestedKg(Number(e.target.value))}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={onUseLocation} disabled={busyGeo}>
                {busyGeo
                  ? t("w2w_locating")
                  : geo
                    ? t("w2w_location_set")
                    : t("w2w_use_location")}
              </Button>
              <Button type="button" onClick={onLogHarvest}>
                {t("w2w_log_harvest")}
              </Button>
            </div>
            <p className="text-xs text-[var(--foreground)]/55">
              {tReplace("w2w_residue_estimate", {
                total: formatKg(previewResidues.totalResidueKg),
                stalk: formatKg(previewResidues.stalkKg),
                husk: formatKg(previewResidues.huskKg),
                stubble: formatKg(previewResidues.stubbleKg),
              })}
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--foreground)]/50">{t("w2w_potential_income")}</p>
            {lastAlert ? (
              <>
                <p className="text-3xl font-semibold tabular-nums">{formatINR(lastAlert.incomeINR)}</p>
                <p className="text-sm text-[var(--foreground)]/70">
                  {t("w2w_eco_saved")}:{" "}
                  <strong>{Math.round(lastAlert.savedKgCO2e).toLocaleString("en-IN")} kg CO2e</strong>
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs uppercase tracking-wider text-[var(--foreground)]/50">
                    <span>{t("w2w_confidence")}</span>
                    <span>{Math.round(lastAlert.confidence * 100)}%</span>
                  </div>
                  <Progress value={Math.round(lastAlert.confidence * 100)} />
                </div>
                <p className="text-xs text-[var(--foreground)]/55">
                  {t("w2w_alert_line")}
                </p>
              </>
            ) : (
              <p className="text-sm text-[var(--foreground)]/60">{t("w2w_log_prompt")}</p>
            )}
          </div>

          <div className="space-y-3 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--foreground)]/50">{t("w2w_b2b_matches")}</p>
            <div className="space-y-2">
              {previewMatches.map((m) => (
                <div key={m.industryType} className="rounded-xl border border-[var(--foreground)]/10 bg-[var(--background)]/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{m.industryName}</p>
                    <Badge variant="secondary">{m.suitabilityScore}/100</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--foreground)]/60">{m.why.slice(1).join(" · ")}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    onClick={() => onCreateLot({ industryType: m.industryType, industryName: m.industryName })}
                    disabled={harvestLogs.length === 0}
                  >
                    {t("w2w_create_lot")}
                  </Button>
                </div>
              ))}
              {harvestLogs.length === 0 && (
                <p className="text-xs text-[var(--foreground)]/55">{t("w2w_lot_hint")}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card glass className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("w2w_circular_title")}</CardTitle>
            <CardDescription>{t("w2w_circular_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {lots.length === 0 ? (
              <div className="rounded-2xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 p-4 text-sm text-[var(--foreground)]/60">
                {t("w2w_no_lots")}
              </div>
            ) : (
              lots
                .slice()
                .reverse()
                .slice(0, 4)
                .map((lot) => {
                  const lastStage = lot.stages?.[lot.stages.length - 1]?.stage ?? "created";
                  const stagePct =
                    lastStage === "created"
                      ? 20
                      : lastStage === "collected"
                        ? 40
                        : lastStage === "packed"
                          ? 60
                          : lastStage === "in-transit"
                            ? 80
                            : 100;
                  return (
                    <div key={lot.lotId} className="rounded-2xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{lot.industryName}</p>
                          <p className="mt-1 text-xs text-[var(--foreground)]/60">
                            {tReplace("w2w_lot_size_line", {
                              size: formatKg(lot.residueBreakdownKg.totalResidueKg),
                              count: lot.harvestLogIds.length,
                            })}
                          </p>
                        </div>
                        <Badge variant="outline">{String(lastStage).replace("-", " ")}</Badge>
                      </div>
                      <div className="mt-3 space-y-2">
                        <Progress value={stagePct} />
                        <Button type="button" size="sm" variant="secondary" onClick={() => onAdvanceLot(lot.lotId)} disabled={stagePct >= 100}>
                          {t("w2w_advance_stage")}
                        </Button>
                      </div>
                    </div>
                  );
                })
            )}
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader>
            <CardTitle>{t("w2w_eco_title")}</CardTitle>
            <CardDescription>{t("w2w_eco_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 p-4">
              <p className="text-xs uppercase tracking-wider text-[var(--foreground)]/50">{t("w2w_total_secondary")}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{formatINR(ecoTotals.income)}</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs uppercase tracking-wider text-[var(--foreground)]/50">{t("w2w_co2_avoided")}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {Math.round(ecoTotals.saved).toLocaleString("en-IN")} kg
              </p>
              <p className="mt-2 text-xs text-[var(--foreground)]/60">
                {t("w2w_co2_note")}
              </p>
            </div>

            {lots[0] && (
              <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4">
                <p className="text-xs uppercase tracking-wider text-[var(--foreground)]/50">{t("w2w_latest_qr")}</p>
                <div className="mt-3 flex justify-center">
                  <QrCode value={lots[0].qrPayload} size={170} />
                </div>
                <p className="mt-2 break-words text-[10px] text-[var(--foreground)]/60">{lots[0].qrPayload}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

