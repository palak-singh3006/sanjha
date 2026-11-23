"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { clusterStats as defaultClusterStats, cropDistribution as defaultCropDist, harvestRows as defaultHarvestRows, wastePool as defaultWastePool } from "@/lib/demo-data";
import { Sparkles, TrendingUp, RefreshCw, Sprout, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { WasteToWealthPanel } from "@/components/waste-to-wealth/waste-to-wealth-panel";
import { ApiSmokeTest } from "@/components/dev/api-smoke-test";
import { apiDashboardSummary, apiDri } from "@/lib/http/api";

const defaultDemandSupply = [
  { week: "W1", demand: 42, supply: 38 },
  { week: "W2", demand: 48, supply: 55 },
  { week: "W3", demand: 54, supply: 49 },
  { week: "W4", demand: 61, supply: 72 },
  { week: "W5", demand: 58, supply: 44 },
];

export default function DashboardPage() {
  const { t, tReplace } = useI18n();

  const [loading, setLoading] = useState(false);
  const [clusterId, setClusterId] = useState("HUN-01");
  const [clusterData, setClusterData] = useState({
    village: defaultClusterStats.village,
    district: defaultClusterStats.district,
    farmers: defaultClusterStats.farmers,
    activeCrops: defaultClusterStats.activeCrops,
    tomatoSaturation: defaultClusterStats.tomatoSaturation,
    suggestedCrop: defaultClusterStats.suggestedCrop,
    aiLine: defaultClusterStats.aiLine,
  });
  const [cropDist, setCropDist] = useState(defaultCropDist);
  const [harvests, setHarvests] = useState(defaultHarvestRows);
  const [demandSupply, setDemandSupply] = useState(defaultDemandSupply);
  const [wasteData, setWasteData] = useState(defaultWastePool);
  const [staggerState, setStaggerState] = useState<Record<string, { delayed: boolean; newDate?: string; newRisk?: number }>>({});
  const [simulatingPlot, setSimulatingPlot] = useState<string | null>(null);

  // Load live data from /api/dashboard/summary
  async function loadDashboardData(targetCluster = clusterId) {
    setLoading(true);
    try {
      const res = await apiDashboardSummary(targetCluster);
      const data = res.data || res;
      if (data?.cluster) {
        setClusterData({
          village: data.cluster.name || data.cluster.village || "Hunasagi Cluster",
          district: data.cluster.district || "Yadgir, Karnataka",
          farmers: data.cluster.farmersCount || defaultClusterStats.farmers,
          activeCrops: data.cluster.activeCropsCount || defaultClusterStats.activeCrops,
          tomatoSaturation: data.cluster.tomatoSaturation || defaultClusterStats.tomatoSaturation,
          suggestedCrop: data.cluster.suggestedCrop || defaultClusterStats.suggestedCrop,
          aiLine: data.cluster.aiAdvisory || defaultClusterStats.aiLine,
        });
      }

      if (Array.isArray(data?.cropDistribution) && data.cropDistribution.length > 0) {
        setCropDist(data.cropDistribution);
      }

      if (Array.isArray(data?.demandSupplyTrends) && data.demandSupplyTrends.length > 0) {
        setDemandSupply(data.demandSupplyTrends);
      }

      if (Array.isArray(data?.upcomingHarvests) && data.upcomingHarvests.length > 0) {
        const mapped = data.upcomingHarvests.map((h: any, i: number) => ({
          farm: h.farm || `Plot ${String.fromCharCode(65 + i)}`,
          risk: h.risk || (i === 0 ? 72 : i === 1 ? 41 : 63),
          weather: h.weather || "Favorable conditions",
          marketPressure: h.marketPressure || (i === 0 ? 58 : i === 1 ? 44 : 61),
          date: h.expectedDate ? `Harvest in ${h.expectedDate}` : (defaultHarvestRows[i]?.date || "Harvest soon"),
          confidence: 0.85,
        }));
        setHarvests(mapped);
      }

      if (data?.wasteToWealth) {
        setWasteData({
          qtyTons: data.wasteToWealth.pooledBiomassTons ?? defaultWastePool.qtyTons,
          valueINR: data.wasteToWealth.potentialIncomeINR ?? defaultWastePool.valueINR,
          threshold: defaultWastePool.threshold,
          buyersUnlocked: data.wasteToWealth.activeBuyersCount ?? defaultWastePool.buyersUnlocked,
          message: defaultWastePool.message,
        });
      }
    } catch (err) {
      console.warn("Failed to fetch live dashboard summary, using realistic cluster data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData(clusterId);
  }, [clusterId]);

  // Interactive DRI Stagger simulation for a harvest row
  async function handleStaggerHarvest(farmName: string) {
    setSimulatingPlot(farmName);
    try {
      const res = await apiDri({
        farmId: "c1000000-0000-0000-0000-000000000001",
        cropName: "Tomato",
        clusterId,
        expectedHarvestDate: new Date().toISOString().split("T")[0],
        soilType: "loamy",
        cropPlanId: "d1000000-0000-0000-0000-000000000001",
      });

      setStaggerState((prev) => ({
        ...prev,
        [farmName]: {
          delayed: true,
          newDate: `Staggered to ${res.recommendedDate} (+${res.delayDays}d)`,
          newRisk: Math.max(25, (res.dri ?? 42) - 20),
        },
      }));
    } catch (e) {
      console.error("Stagger simulation failed:", e);
    } finally {
      setSimulatingPlot(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header with Cluster Selector & Live Refresh */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <motion.h1
            className="text-3xl font-semibold tracking-tight md:text-4xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {t("dash_title")}
          </motion.h1>
          <p className="mt-2 max-w-2xl text-[var(--foreground)]/65">
            {clusterData.village} · {clusterData.district}. {t("dash_sub")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Interactive Cluster Switcher */}
          <div className="flex rounded-xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 p-1 backdrop-blur-md">
            <button
              onClick={() => setClusterId("HUN-01")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                clusterId === "HUN-01" ? "bg-emerald-500 text-white shadow-sm" : "text-[var(--foreground)]/70 hover:text-[var(--foreground)]"
              }`}
            >
              Hunasagi (HUN-01)
            </button>
            <button
              onClick={() => setClusterId("KEM-01")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                clusterId === "KEM-01" ? "bg-emerald-500 text-white shadow-sm" : "text-[var(--foreground)]/70 hover:text-[var(--foreground)]"
              }`}
            >
              Kembhavi (KEM-01)
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboardData(clusterId)}
            disabled={loading}
            className="gap-1.5 py-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            Live Sync
          </Button>

          <Badge variant="gold" className="w-fit gap-1 py-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {t("dash_badge_cluster")}
          </Badge>
        </div>
      </div>

      {/* Top 3 Live Cluster Metric Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: t("dash_stat_farmers"), value: clusterData.farmers },
          { label: t("dash_stat_crops"), value: clusterData.activeCrops },
          {
            label: t("dash_stat_tomato"),
            value: `${clusterData.tomatoSaturation}%`,
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card glass>
              <CardHeader className="pb-2">
                <CardDescription>{s.label}</CardDescription>
                <CardTitle className="text-3xl tabular-nums">{s.value}</CardTitle>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Dynamic Charts & AI Recommendation */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card glass className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              {t("dash_chart_title")}
            </CardTitle>
            <CardDescription>{t("dash_chart_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="w-full min-w-0">
            <ResponsiveContainer width="100%" height={288}>
              <AreaChart data={demandSupply}>
                <defs>
                  <linearGradient id="d" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="week" stroke="rgba(148,163,184,0.5)" />
                <YAxis stroke="rgba(148,163,184,0.5)" />
                <Tooltip
                  contentStyle={{
                    background: "rgba(12,24,20,0.92)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="demand"
                  stroke="#34d399"
                  fillOpacity={1}
                  fill="url(#d)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="supply"
                  stroke="#fbbf24"
                  fillOpacity={1}
                  fill="url(#s)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card glass className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("dash_ai_title")}</CardTitle>
            <CardDescription>{t("dash_ai_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-transparent p-4 text-sm leading-relaxed">
              {clusterData.aiLine}
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-[var(--foreground)]/50">
                {t("dash_ai_suggested")}
              </p>
              <p className="font-medium text-emerald-600 dark:text-emerald-300">{clusterData.suggestedCrop}</p>
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-[var(--foreground)]/50">
                {t("dash_ai_saturation")} ({clusterData.tomatoSaturation}%)
              </p>
              <Progress value={clusterData.tomatoSaturation} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Harvest Intelligence with Interactive DRI Delay Simulator */}
      <Card glass>
        <CardHeader className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <CardTitle>{t("dash_harvest_title")}</CardTitle>
            <CardDescription>{t("dash_harvest_desc")}</CardDescription>
          </div>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-300">
            Interactive DRI Simulation
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {harvests.map((h, i) => {
            const plotStagger = staggerState[h.farm];
            const currentRisk = plotStagger?.newRisk ?? h.risk;
            const currentDate = plotStagger?.newDate ?? h.date;

            return (
              <motion.div
                key={h.farm}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="flex flex-col justify-between rounded-2xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 p-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{h.farm}</p>
                    {plotStagger?.delayed && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                        <CheckCircle2 className="h-3 w-3" /> Staggered
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-[var(--foreground)]/60">{h.weather}</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-xs uppercase tracking-wider text-[var(--foreground)]/50">
                      <span>{t("dash_risk")}</span>
                      <span className={currentRisk > 60 ? "font-bold text-red-400" : "font-bold text-emerald-400"}>
                        {currentRisk}%
                      </span>
                    </div>
                    <Progress value={currentRisk} />
                    <div className="flex justify-between text-xs uppercase tracking-wider text-[var(--foreground)]/50">
                      <span>{t("dash_pressure")}</span>
                      <span>{h.marketPressure}%</span>
                    </div>
                    <Progress value={h.marketPressure} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                    {currentDate}
                  </p>
                  <p className="mt-1 text-xs text-[var(--foreground)]/55">
                    {t("dash_harvest_ai_prefix")} {(h.confidence * 100).toFixed(0)}% —{" "}
                    {t("dash_harvest_ai_suffix")}
                  </p>
                </div>

                <div className="mt-4 pt-2">
                  <Button
                    size="sm"
                    variant={plotStagger?.delayed ? "secondary" : "outline"}
                    className="w-full gap-1.5 text-xs"
                    disabled={simulatingPlot === h.farm || plotStagger?.delayed}
                    onClick={() => handleStaggerHarvest(h.farm)}
                  >
                    <Sprout className={`h-3.5 w-3.5 ${simulatingPlot === h.farm ? "animate-spin text-emerald-400" : ""}`} />
                    {simulatingPlot === h.farm
                      ? "Simulating AI Stagger..."
                      : plotStagger?.delayed
                      ? "Delay Synchronized (-20% Risk)"
                      : "Simulate Staggered Harvest"}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* Waste to Wealth Circular Logistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card glass className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t("dash_waste_title")}</CardTitle>
            <CardDescription>{t("dash_waste_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-4xl font-semibold tabular-nums">{wasteData.qtyTons}t</p>
              <p className="text-sm text-[var(--foreground)]/60">
                {tReplace("dash_waste_recover", {
                  value: (wasteData.valueINR / 1000).toFixed(0),
                  buyers: wasteData.buyersUnlocked,
                })}
              </p>
            </div>
            <div className="max-w-md rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm">
              {wasteData.message}
            </div>
          </CardContent>
        </Card>
        <Card glass>
          <CardHeader>
            <CardTitle>{t("dash_threshold_title")}</CardTitle>
            <CardDescription>
              {tReplace("dash_threshold_desc", { tons: wasteData.threshold })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={Math.min(100, (wasteData.qtyTons / (wasteData.threshold * 1.5)) * 100)} />
          </CardContent>
        </Card>
      </div>

      <WasteToWealthPanel />

      <Card glass>
        <CardHeader>
          <CardTitle>API connectivity</CardTitle>
          <CardDescription>Smoke-test backend routes against your Supabase and external services.</CardDescription>
        </CardHeader>
        <CardContent>
          <ApiSmokeTest />
        </CardContent>
      </Card>

      {/* Dynamic Crop Distribution */}
      <Card glass>
        <CardHeader>
          <CardTitle>{t("dash_crop_dist_title")}</CardTitle>
          <CardDescription>{t("dash_crop_dist_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-5">
          {cropDist.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 p-4"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{c.name}</span>
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: c.fill || "#10b981" }}
                />
              </div>
              <p className="mt-3 text-3xl font-semibold tabular-nums">{c.value}%</p>
              <Progress value={c.value} className="mt-3" />
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
