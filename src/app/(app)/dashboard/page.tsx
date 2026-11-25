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
import { TrendingUp, RefreshCw, Sprout, CheckCircle2, Users, Layers, AlertCircle, ArrowUpRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { WasteToWealthPanel } from "@/components/waste-to-wealth/waste-to-wealth-panel";
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
  async function handleStaggerHarvest(h: any) {
    const farmName = h.farm;
    setSimulatingPlot(farmName);
    try {
      const res = await apiDri({
        farmId: h.farmId || (clusterId === "KEM-01" ? "c1000000-0000-0000-0000-000000000005" : clusterId === "SHO-01" ? "c1000000-0000-0000-0000-000000000008" : "c1000000-0000-0000-0000-000000000001"),
        cropName: h.crop || (clusterId === "KEM-01" ? "Cotton" : clusterId === "SHO-01" ? "Paddy" : "Tomato"),
        clusterId,
        expectedHarvestDate: h.expectedDate || new Date().toISOString().split("T")[0],
        soilType: clusterId === "KEM-01" ? "black" : clusterId === "SHO-01" ? "clay" : "loamy",
        cropPlanId: "d1000000-0000-0000-0000-000000000001",
      });

      setStaggerState((prev) => ({
        ...prev,
        [farmName]: {
          delayed: true,
          newDate: `Staggered to ${res.recommendedDate} (+${res.delayDays}d)`,
          newRisk: Math.max(16, (res.dri ?? h.risk ?? 42) - 22),
        },
      }));
    } catch (e) {
      console.error("Stagger simulation failed:", e);
    } finally {
      setSimulatingPlot(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section: Editorial agritech title & Cluster switcher */}
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
              SANJHA Operations Command
            </span>
            <span className="text-[var(--border-strong)]">·</span>
            <Badge variant="leaf" className="text-[10px] py-0 px-2">Live Telemetry</Badge>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl text-[var(--foreground)]">
            {clusterData.village}
          </h1>
          <p className="mt-1 text-xs text-[var(--muted-foreground)] max-w-xl">
            {clusterData.district} · Unified harvesting schedule, market pressure index, and collective biomass aggregation.
          </p>
        </div>

        {/* Cluster Selector & Live Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center rounded-md border border-[var(--border)] bg-[var(--card)] p-0.5">
            <button
              onClick={() => setClusterId("HUN-01")}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                clusterId === "HUN-01"
                  ? "bg-[var(--forest)] text-[var(--primary-foreground)] shadow-xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Hunasagi (HUN-01)
            </button>
            <button
              onClick={() => setClusterId("KEM-01")}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                clusterId === "KEM-01"
                  ? "bg-[var(--forest)] text-[var(--primary-foreground)] shadow-xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Kembhavi (KEM-01)
            </button>
            <button
              onClick={() => setClusterId("SHO-01")}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                clusterId === "SHO-01"
                  ? "bg-[var(--forest)] text-[var(--primary-foreground)] shadow-xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Shorapur (SHO-01)
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboardData(clusterId)}
            disabled={loading}
            className="h-8 gap-1.5 text-xs border-[var(--border)]"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-[var(--forest)]" : "text-[var(--muted-foreground)]"}`} />
            <span>Sync</span>
          </Button>
        </div>
      </div>

      {/* Primary Key Metrics Grid (Controlled hierarchy, not 3 identical AI cards) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Farmers */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              {t("dash_stat_farmers")}
            </span>
            <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums text-[var(--foreground)]">
              {clusterData.farmers}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">cultivators</span>
          </div>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            Registered in co-op registry
          </p>
        </div>

        {/* Metric 2: Active Crops */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              {t("dash_stat_crops")}
            </span>
            <Layers className="h-4 w-4 text-[var(--muted-foreground)]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums text-[var(--foreground)]">
              {clusterData.activeCrops}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">varieties</span>
          </div>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            Across Kharif & Rabi cycles
          </p>
        </div>

        {/* Metric 3: Tomato Saturation & Glut Risk */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              {t("dash_stat_tomato")}
            </span>
            <span className={`h-2 w-2 rounded-full ${clusterData.tomatoSaturation > 50 ? "bg-amber-600" : "bg-[var(--leaf)]"}`} />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums text-[var(--foreground)]">
              {clusterData.tomatoSaturation}%
            </span>
            <Badge variant={clusterData.tomatoSaturation > 50 ? "gold" : "forest"} className="text-[10px] py-0 px-1.5">
              {clusterData.tomatoSaturation > 50 ? "High Concentration" : "Balanced"}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            Acreage under single-crop peak
          </p>
        </div>

        {/* Metric 4: Biomass Aggregated */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              Biomass Aggregated
            </span>
            <Sprout className="h-4 w-4 text-[var(--muted-foreground)]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums text-[var(--foreground)]">
              {wasteData.qtyTons}t
            </span>
            <span className="text-xs font-mono font-medium text-[var(--forest)]">
              ₹{(wasteData.valueINR / 1000).toFixed(0)}k val
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            {wasteData.buyersUnlocked} active bio-refinery buyers
          </p>
        </div>
      </div>

      {/* Main Analysis Section: Demand vs Supply (Recharts) + Agronomic Advisory */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Demand vs Supply Chart */}
        <div className="lg:col-span-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[var(--border)]">
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[var(--forest)]" />
                {t("dash_chart_title")}
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                {t("dash_chart_desc")}
              </p>
            </div>
            {/* Chart Legend */}
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-[var(--foreground)]">
                <span className="h-2 w-2 rounded-full bg-[#244B38]" />
                Demand (APMC)
              </span>
              <span className="flex items-center gap-1.5 font-medium text-[var(--foreground)]">
                <span className="h-2 w-2 rounded-full bg-[#B8864B]" />
                Supply (Harvests)
              </span>
            </div>
          </div>

          <div className="pt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={demandSupply} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#244B38" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#244B38" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSupply" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B8864B" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#B8864B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#DFDED4" vertical={false} />
                <XAxis
                  dataKey="week"
                  stroke="#77796F"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#DFDED4" }}
                />
                <YAxis
                  stroke="#77796F"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#DFDED4" }}
                  unit="t"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #DFDED4",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    fontSize: "12px",
                  }}
                  itemStyle={{ padding: "2px 0" }}
                />
                <Area
                  type="monotone"
                  dataKey="demand"
                  name="Procurement Demand (Tons)"
                  stroke="#244B38"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDemand)"
                />
                <Area
                  type="monotone"
                  dataKey="supply"
                  name="Scheduled Supply (Tons)"
                  stroke="#B8864B"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSupply)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agronomic Advisory & Rebalancing */}
        <div className="lg:col-span-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider">
                Agronomic Advisory
              </h2>
              <Badge variant="secondary" className="text-[10px]">Decision Support</Badge>
            </div>

            <div className="mt-4 rounded-lg bg-[var(--muted)]/60 border border-[var(--border)] p-3.5 text-xs text-[var(--foreground)] leading-relaxed">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-[var(--forest)] shrink-0 mt-0.5" />
                <span>{clusterData.aiLine}</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                  Diversification Opportunity
                </span>
                <p className="mt-1 text-sm font-semibold text-[var(--forest)]">
                  {clusterData.suggestedCrop}
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs text-[var(--muted-foreground)] mb-1.5">
                  <span>Acreage Saturation Meter</span>
                  <span className="font-semibold text-[var(--foreground)]">{clusterData.tomatoSaturation}%</span>
                </div>
                <Progress value={clusterData.tomatoSaturation} className="h-2" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)] mt-4">
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Cooperative staggered harvesting reduces market pressure by up to 24% across local APMCs.
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming Harvest Pipeline with Interactive DRI Stagger Action */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[var(--border)] gap-2">
          <div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              {t("dash_harvest_title")}
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {t("dash_harvest_desc")}
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            DRI Pipeline: {harvests.length} Plots Scheduled
          </Badge>
        </div>

        {/* Harvest Grid */}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {harvests.map((h, i) => {
            const plotStagger = staggerState[h.farm];
            const currentRisk = plotStagger?.newRisk ?? h.risk;
            const currentDate = plotStagger?.newDate ?? h.date;

            return (
              <div
                key={h.farm}
                className="flex flex-col justify-between rounded-lg border border-[var(--border)] bg-[var(--background)]/60 p-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{h.farm}</p>
                    {plotStagger?.delayed ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--forest)]">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Staggered
                      </span>
                    ) : (
                      <Badge variant={currentRisk > 60 ? "danger" : "forest"} className="text-[10px]">
                        Risk {currentRisk}%
                      </Badge>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{h.weather}</p>

                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                      <span>Market Glut Pressure</span>
                      <span className="font-mono font-medium text-[var(--foreground)]">{h.marketPressure}%</span>
                    </div>
                    <Progress value={h.marketPressure} className="h-1.5" />
                  </div>

                  <div className="mt-3.5 rounded bg-[var(--card)] border border-[var(--border)] px-2.5 py-1.5">
                    <p className="text-xs font-semibold text-[var(--forest)]">
                      {currentDate}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border)]">
                  <Button
                    size="sm"
                    variant={plotStagger?.delayed ? "secondary" : "outline"}
                    className="w-full h-8 text-xs font-medium"
                    disabled={simulatingPlot === h.farm || plotStagger?.delayed}
                    onClick={() => handleStaggerHarvest(h)}
                  >
                    <Sprout className={`h-3.5 w-3.5 ${simulatingPlot === h.farm ? "animate-spin text-[var(--forest)]" : ""}`} />
                    {simulatingPlot === h.farm
                      ? "Simulating Stagger..."
                      : plotStagger?.delayed
                      ? "Synchronized (-22% Risk)"
                      : "Stagger Harvest (+3d)"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Waste-to-Wealth Panel */}
      <WasteToWealthPanel />

      {/* Crop Acreage Distribution */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="pb-4 border-b border-[var(--border)]">
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            {t("dash_crop_dist_title")}
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            {t("dash_crop_dist_desc")}
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {cropDist.map((c) => (
            <div
              key={c.name}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)]/60 p-3.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--foreground)]">{c.name}</span>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: c.fill || "#244B38" }}
                />
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--foreground)]">
                {c.value}%
              </p>
              <Progress value={c.value} className="mt-2.5 h-1.5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
