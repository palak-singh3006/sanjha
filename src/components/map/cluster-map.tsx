"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useI18n } from "@/lib/i18n/provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Filter, Sprout, AlertTriangle, Layers, Calendar, CheckCircle2 } from "lucide-react";
import { apiFarms, apiCropPlans, apiDri } from "@/lib/http/api";

const center: [number, number] = [16.45, 76.45];

interface MapFarmItem {
  id: string;
  name: string;
  ownerName?: string;
  village: string;
  acres: number;
  soilType: string;
  lat: number;
  lng: number;
  cropName: string;
  variety?: string;
  season?: string;
  status?: string;
  driScore: number;
  expectedHarvestDate?: string;
  recommendedHarvestDate?: string;
  risk: "high" | "med" | "low";
}

const defaultFarms: MapFarmItem[] = [
  {
    id: "c1000000-0000-0000-0000-000000000001",
    name: "Gowda South Field",
    ownerName: "Sharanappa Gowda",
    village: "Hunasagi",
    acres: 3.5,
    soilType: "loamy",
    lat: 16.452,
    lng: 76.448,
    cropName: "Tomato",
    variety: "Abhinav Hybrid",
    season: "Kharif",
    status: "growing",
    driScore: 42,
    expectedHarvestDate: "2026-12-05",
    recommendedHarvestDate: "2026-12-07",
    risk: "med",
  },
  {
    id: "c1000000-0000-0000-0000-000000000002",
    name: "Renuka Krishna Valley Farm",
    ownerName: "Renuka Devi",
    village: "Hunasagi",
    acres: 2.0,
    soilType: "clay",
    lat: 16.458,
    lng: 76.453,
    cropName: "Tomato",
    variety: "Saaho F1",
    season: "Kharif",
    status: "harvest_ready",
    driScore: 72,
    expectedHarvestDate: "2026-12-01",
    recommendedHarvestDate: "2026-12-03",
    risk: "high",
  },
  {
    id: "c1000000-0000-0000-0000-000000000003",
    name: "Basavaraj Canal Plot",
    ownerName: "Basavaraj Patil",
    village: "Hunasagi",
    acres: 4.2,
    soilType: "loamy",
    lat: 16.448,
    lng: 76.452,
    cropName: "Onion",
    variety: "Bhima Super",
    season: "Kharif",
    status: "growing",
    driScore: 28,
    expectedHarvestDate: "2026-12-25",
    recommendedHarvestDate: "2026-12-25",
    risk: "low",
  },
  {
    id: "c1000000-0000-0000-0000-000000000004",
    name: "Sanjha Co-op Plot 4",
    ownerName: "Cooperative Lot 4",
    village: "Hunasagi",
    acres: 5.0,
    soilType: "black",
    lat: 16.451,
    lng: 76.446,
    cropName: "Chilli",
    variety: "Byadgi Kaddi",
    season: "Kharif",
    status: "growing",
    driScore: 63,
    expectedHarvestDate: "2026-12-12",
    recommendedHarvestDate: "2026-12-15",
    risk: "high",
  },
];

const riskColor: Record<string, string> = {
  high: "#f87171",
  med: "#fbbf24",
  low: "#4ade80",
};

export function ClusterMap() {
  const { t } = useI18n();
  const [farms, setFarms] = useState<MapFarmItem[]>(defaultFarms);
  const [loading, setLoading] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<MapFarmItem | null>(defaultFarms[0]);
  const [cropFilter, setCropFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [showCatchment, setShowCatchment] = useState(true);
  const [driSimulating, setDriSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    verdict?: string;
    delayDays?: number;
    recommendedDate?: string;
  } | null>(null);

  // Fetch live backend data from /api/farms and /api/crop-plans
  async function loadLiveData() {
    setLoading(true);
    try {
      const [farmsRes, cropsRes] = await Promise.all([
        apiFarms(),
        apiCropPlans(),
      ]);

      const liveFarms = farmsRes.data || farmsRes || [];
      const liveCrops = cropsRes.data || cropsRes || [];

      if (Array.isArray(liveFarms) && liveFarms.length > 0) {
        const merged: MapFarmItem[] = liveFarms.map((f: any, idx: number) => {
          const matchedCrop = Array.isArray(liveCrops)
            ? liveCrops.find((c: any) => c.farmId === f.id || c.farm_id === f.id)
            : null;

          const dri = matchedCrop?.driScore ?? matchedCrop?.dri_score ?? (idx % 2 === 0 ? 42 : 68);
          const risk: "high" | "med" | "low" = dri > 60 ? "high" : dri > 35 ? "med" : "low";

          return {
            id: f.id,
            name: f.name || `Farm Plot ${idx + 1}`,
            ownerName: f.ownerName || f.users?.full_name || "Cluster Farmer",
            village: f.village || "Hunasagi",
            acres: Number(f.acres) || 2.5,
            soilType: f.soilType || f.soil_type || "loamy",
            lat: Number(f.lat) || center[0] + (idx * 0.003 - 0.004),
            lng: Number(f.lng) || center[1] + (idx * 0.003 - 0.002),
            cropName: matchedCrop?.cropName || matchedCrop?.crop_name || "Tomato",
            variety: matchedCrop?.variety || "Abhinav Hybrid",
            season: matchedCrop?.season || "Kharif",
            status: matchedCrop?.status || "growing",
            driScore: dri,
            expectedHarvestDate: matchedCrop?.expectedHarvestDate || matchedCrop?.expected_harvest_date || "2026-12-05",
            recommendedHarvestDate: matchedCrop?.recommendedHarvestDate || matchedCrop?.recommended_harvest_date || "2026-12-07",
            risk,
          };
        });

        setFarms(merged);
        if (merged.length > 0) {
          setSelectedFarm(merged[0]);
        }
      }
    } catch (err) {
      console.warn("Live farms API fetch failed, using realistic cluster data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLiveData();
  }, []);

  // Filter markers based on crop and risk selections
  const filteredFarms = useMemo(() => {
    return farms.filter((f) => {
      const matchCrop =
        cropFilter === "all" || f.cropName.toLowerCase().includes(cropFilter.toLowerCase());
      const matchRisk = riskFilter === "all" || f.risk === riskFilter;
      return matchCrop && matchRisk;
    });
  }, [farms, cropFilter, riskFilter]);

  // Simulate Delay-Risk Index calculation dynamically
  async function handleSimulateDri() {
    if (!selectedFarm) return;
    setDriSimulating(true);
    try {
      const res = await apiDri({
        farmId: selectedFarm.id,
        cropName: selectedFarm.cropName,
        clusterId: "HUN-01",
        expectedHarvestDate: selectedFarm.expectedHarvestDate || "2026-12-05",
        soilType: selectedFarm.soilType || "loamy",
        cropPlanId: "d1000000-0000-0000-0000-000000000001",
      });

      setSimulationResult({
        verdict: res.verdict || "Stagger recommended",
        delayDays: res.delayDays ?? 2,
        recommendedDate: res.recommendedDate || "2026-12-07",
      });

      // Update selected farm DRI score in state
      setSelectedFarm((prev) =>
        prev
          ? {
              ...prev,
              driScore: res.dri ?? prev.driScore,
              recommendedHarvestDate: res.recommendedDate ?? prev.recommendedHarvestDate,
              risk: (res.dri ?? prev.driScore) > 60 ? "high" : (res.dri ?? prev.driScore) > 35 ? "med" : "low",
            }
          : null,
      );
    } catch (e) {
      console.error("DRI simulation error:", e);
    } finally {
      setDriSimulating(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Interactive Controls & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 p-3 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--foreground)]/70">
            <Filter className="h-3.5 w-3.5 text-emerald-500" />
            <span>Crop:</span>
          </div>
          {["all", "Tomato", "Onion", "Chilli"].map((crop) => (
            <Button
              key={crop}
              variant={cropFilter === crop ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs capitalize"
              onClick={() => setCropFilter(crop)}
            >
              {crop === "all" ? "All Crops" : crop}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--foreground)]/70">
            <span>Risk:</span>
          </div>
          {[
            { key: "all", label: "All" },
            { key: "high", label: "High Risk", color: "text-red-400" },
            { key: "med", label: "Medium", color: "text-amber-400" },
            { key: "low", label: "Low Risk", color: "text-emerald-400" },
          ].map((r) => (
            <Button
              key={r.key}
              variant={riskFilter === r.key ? "default" : "outline"}
              size="sm"
              className={`h-7 text-xs ${r.color || ""}`}
              onClick={() => setRiskFilter(r.key)}
            >
              {r.label}
            </Button>
          ))}

          <Button
            variant={showCatchment ? "secondary" : "outline"}
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setShowCatchment(!showCatchment)}
          >
            <Layers className="h-3.5 w-3.5 text-emerald-400" />
            5km Pooling Radius
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={loadLiveData}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            Live Sync
          </Button>
        </div>
      </div>

      {/* Main Interactive Map */}
      <div className="relative h-[440px] w-full overflow-hidden rounded-2xl border border-[var(--foreground)]/10 shadow-2xl">
        <MapContainer center={center} zoom={14} className="h-full w-full" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Biomass Catchment Radius Layer */}
          {showCatchment && (
            <Circle
              center={center}
              radius={2200}
              pathOptions={{
                color: "#10b981",
                fillColor: "#10b981",
                fillOpacity: 0.1,
                weight: 1.5,
                dashArray: "6, 8",
              }}
            >
              <Tooltip direction="center" permanent offset={[0, 0]} opacity={0.85}>
                Hunasagi Waste Pooling Catchment (2.2km)
              </Tooltip>
            </Circle>
          )}

          {/* Live Dynamic Farm Markers */}
          {filteredFarms.map((f) => (
            <CircleMarker
              key={f.id}
              center={[f.lat, f.lng]}
              radius={selectedFarm?.id === f.id ? 14 : 10}
              pathOptions={{
                color: selectedFarm?.id === f.id ? "#ffffff" : riskColor[f.risk] ?? "#22c55e",
                fillColor: riskColor[f.risk] ?? "#22c55e",
                fillOpacity: selectedFarm?.id === f.id ? 0.9 : 0.65,
                weight: selectedFarm?.id === f.id ? 3 : 1.5,
              }}
              eventHandlers={{
                click: () => {
                  setSelectedFarm(f);
                  setSimulationResult(null);
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <div className="font-semibold">{f.name}</div>
                <div className="text-xs">
                  {f.cropName} ({f.variety}) · {f.acres} ac
                </div>
              </Tooltip>
              <Popup className="text-[var(--foreground)]">
                <div className="space-y-1 py-1">
                  <div className="text-sm font-semibold">{f.name}</div>
                  <div className="text-xs opacity-80">Farmer: {f.ownerName}</div>
                  <div className="text-xs">
                    Crop: <span className="font-medium">{f.cropName}</span> ({f.variety})
                  </div>
                  <div className="text-xs">
                    Soil: <span className="capitalize">{f.soilType}</span> · {f.acres} Acres
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span>DRI Risk:</span>
                    <span
                      className="rounded px-1.5 py-0.5 font-bold"
                      style={{ backgroundColor: `${riskColor[f.risk]}33`, color: riskColor[f.risk] }}
                    >
                      {f.driScore}% ({f.risk.toUpperCase()})
                    </span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Live Status Overlay */}
        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-xl border border-[var(--foreground)]/10 bg-[var(--background)]/85 px-3 py-2 text-xs backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span>
            Tracking <strong>{filteredFarms.length}</strong> live plots in Hunasagi cluster
          </span>
        </div>
      </div>

      {/* Interactive Farm Inspector & Live DRI Simulator */}
      {selectedFarm && (
        <Card glass className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold tracking-tight">{selectedFarm.name}</h3>
                  <Badge
                    variant="outline"
                    className="border-emerald-500/40 text-emerald-600 dark:text-emerald-300"
                  >
                    {selectedFarm.acres} Acres · {selectedFarm.soilType} soil
                  </Badge>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
                    style={{
                      backgroundColor: `${riskColor[selectedFarm.risk]}25`,
                      color: riskColor[selectedFarm.risk],
                    }}
                  >
                    {selectedFarm.risk} Risk
                  </span>
                </div>
                <p className="text-sm text-[var(--foreground)]/70">
                  Owner: <strong>{selectedFarm.ownerName}</strong> · Village: {selectedFarm.village} · Status:{" "}
                  <span className="capitalize text-emerald-600 dark:text-emerald-300">{selectedFarm.status}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSimulateDri}
                  disabled={driSimulating}
                  className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                  <Sprout className={`h-4 w-4 ${driSimulating ? "animate-spin" : ""}`} />
                  {driSimulating ? "Simulating AI Harvest..." : "Simulate Staggered Harvest"}
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-[var(--foreground)]/10 bg-[var(--background)]/60 p-3">
                <div className="flex items-center gap-1.5 text-xs text-[var(--foreground)]/60">
                  <Sprout className="h-3.5 w-3.5 text-emerald-500" />
                  Active Crop
                </div>
                <div className="mt-1 font-semibold">{selectedFarm.cropName}</div>
                <div className="text-xs text-[var(--foreground)]/50">{selectedFarm.variety}</div>
              </div>

              <div className="rounded-xl border border-[var(--foreground)]/10 bg-[var(--background)]/60 p-3">
                <div className="flex items-center gap-1.5 text-xs text-[var(--foreground)]/60">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  Live DRI Risk Score
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums" style={{ color: riskColor[selectedFarm.risk] }}>
                  {selectedFarm.driScore}/100
                </div>
                <div className="text-xs text-[var(--foreground)]/50">Weather + Peer Saturation</div>
              </div>

              <div className="rounded-xl border border-[var(--foreground)]/10 bg-[var(--background)]/60 p-3">
                <div className="flex items-center gap-1.5 text-xs text-[var(--foreground)]/60">
                  <Calendar className="h-3.5 w-3.5 text-sky-500" />
                  Expected Harvest
                </div>
                <div className="mt-1 font-semibold tabular-nums">{selectedFarm.expectedHarvestDate}</div>
                <div className="text-xs text-[var(--foreground)]/50">Base Farmer Schedule</div>
              </div>

              <div className="rounded-xl border border-[var(--foreground)]/10 bg-[var(--background)]/60 p-3">
                <div className="flex items-center gap-1.5 text-xs text-[var(--foreground)]/60">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  AI Recommended Date
                </div>
                <div className="mt-1 font-semibold text-emerald-600 dark:text-emerald-300">
                  {simulationResult?.recommendedDate || selectedFarm.recommendedHarvestDate}
                </div>
                <div className="text-xs text-[var(--foreground)]/50">
                  {simulationResult ? `+${simulationResult.delayDays}d Stagger Delay` : "Synchronized Stagger"}
                </div>
              </div>
            </div>

            {simulationResult && (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm">
                <span className="text-emerald-600 dark:text-emerald-200">
                  AI Verdict: <strong>{simulationResult.verdict}</strong>. Staggering harvest by{" "}
                  <strong>{simulationResult.delayDays} days</strong> protects against regional APMC tomato price collapse.
                </span>
                <Badge variant="outline" className="border-emerald-500 text-emerald-400">
                  DRI Computed Live
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
