"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useI18n } from "@/lib/i18n/provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Filter, Sprout, AlertTriangle, Layers, Calendar, CheckCircle2, MapPin, ShieldAlert, Sparkles } from "lucide-react";
import { apiFarms, apiCropPlans, apiDri } from "@/lib/http/api";

interface MapFarmItem {
  id: string;
  name: string;
  ownerName?: string;
  village: string;
  clusterCode: string;
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

// Multi-cluster coordinate centers
const clusterCoordinates: Record<string, { center: [number, number]; zoom: number; label: string }> = {
  all: { center: [16.55, 76.58], zoom: 11, label: "All Clusters (Yadgir District)" },
  "HUN-01": { center: [16.452, 76.448], zoom: 14, label: "Hunasagi Cluster (HUN-01)" },
  "KEM-01": { center: [16.664, 76.562], zoom: 14, label: "Kembhavi Cluster (KEM-01)" },
  "SHO-01": { center: [16.520, 76.758], zoom: 14, label: "Shorapur Cluster (SHO-01)" },
};

// Realistic geographic risk catchment zones
interface RiskZone {
  id: string;
  name: string;
  riskLevel: "high" | "med" | "low";
  center: [number, number];
  radius: number;
  color: string;
  driRange: string;
  description: string;
  dominantCrop: string;
}

const geographicRiskZones: RiskZone[] = [
  {
    id: "zone-hun-high",
    name: "Hunasagi Central Basin: High Glut & Delay Risk Area",
    riskLevel: "high",
    center: [16.452, 76.448],
    radius: 2400,
    color: "#ef4444",
    driRange: "DRI 72 - 85%",
    description: "Critical tomato saturation (76%). High price collapse risk due to simultaneous harvest arriving in Hunasagi APMC yard.",
    dominantCrop: "Tomato",
  },
  {
    id: "zone-hun-med",
    name: "Krishna Canal Belt: Moderate Moisture Watch Area",
    riskLevel: "med",
    center: [16.448, 76.456],
    radius: 1800,
    color: "#f59e0b",
    driRange: "DRI 40 - 55%",
    description: "High humidity along canal command. Onion and chilli drying requires 48hr dry window.",
    dominantCrop: "Onion / Chilli",
  },
  {
    id: "zone-kem-low",
    name: "Kembhavi Uplands: High Resilience Diversified Safe Area",
    riskLevel: "low",
    center: [16.664, 76.562],
    radius: 2800,
    color: "#10b981",
    driRange: "DRI 18 - 28%",
    description: "Optimal climate resilience. Red gram, bengal gram and cotton diversified across black soil with steady APMC forward procurement.",
    dominantCrop: "Pulses & Cotton",
  },
  {
    id: "zone-sho-low",
    name: "Shorapur Basin: Krishna Command Low Risk Area",
    riskLevel: "low",
    center: [16.520, 76.758],
    radius: 2600,
    color: "#06b6d4",
    driRange: "DRI 24 - 32%",
    description: "Canal-backed Sona Masoori paddy & groundnut. Stable procurement under government minimum support price (MSP).",
    dominantCrop: "Paddy & Groundnut",
  },
];

// Rich fallback farms across all three clusters with distinct risk profiles
const defaultFarms: MapFarmItem[] = [
  // Hunasagi Cluster (High & Medium Risk Tomato/Onion)
  {
    id: "c1000000-0000-0000-0000-000000000001",
    name: "Gowda South Field",
    ownerName: "Sharanappa Gowda",
    village: "Hunasagi",
    clusterCode: "HUN-01",
    acres: 3.5,
    soilType: "loamy",
    lat: 16.452,
    lng: 76.448,
    cropName: "Tomato",
    variety: "Abhinav Hybrid",
    season: "Kharif",
    status: "growing",
    driScore: 78,
    expectedHarvestDate: "2026-12-05",
    recommendedHarvestDate: "2026-12-09",
    risk: "high",
  },
  {
    id: "c1000000-0000-0000-0000-000000000002",
    name: "Renuka Krishna Valley Farm",
    ownerName: "Renuka Devi",
    village: "Hunasagi",
    clusterCode: "HUN-01",
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
    recommendedHarvestDate: "2026-12-04",
    risk: "high",
  },
  {
    id: "c1000000-0000-0000-0000-000000000003",
    name: "Basavaraj Canal Plot",
    ownerName: "Basavaraj Patil",
    village: "Hunasagi",
    clusterCode: "HUN-01",
    acres: 4.2,
    soilType: "loamy",
    lat: 16.446,
    lng: 76.456,
    cropName: "Onion",
    variety: "Bhima Super",
    season: "Kharif",
    status: "growing",
    driScore: 36,
    expectedHarvestDate: "2026-12-18",
    recommendedHarvestDate: "2026-12-18",
    risk: "med",
  },
  {
    id: "c1000000-0000-0000-0000-000000000004",
    name: "Sanjha Co-op Tomato Plot",
    ownerName: "Cooperative Lot 4",
    village: "Hunasagi",
    clusterCode: "HUN-01",
    acres: 5.0,
    soilType: "black",
    lat: 16.451,
    lng: 76.442,
    cropName: "Tomato",
    variety: "Namdhari NS-501",
    season: "Kharif",
    status: "harvest_ready",
    driScore: 82,
    expectedHarvestDate: "2026-12-04",
    recommendedHarvestDate: "2026-12-08",
    risk: "high",
  },

  // Kembhavi Cluster (Low Risk Diversified Pulses & Cotton)
  {
    id: "c1000000-0000-0000-0000-000000000005",
    name: "Patil Cotton Acreage",
    ownerName: "Hanumantappa Pujari",
    village: "Kembhavi",
    clusterCode: "KEM-01",
    acres: 4.8,
    soilType: "black",
    lat: 16.665,
    lng: 76.561,
    cropName: "Cotton",
    variety: "Bt Cotton RCH-2",
    season: "Kharif",
    status: "growing",
    driScore: 22,
    expectedHarvestDate: "2026-12-14",
    recommendedHarvestDate: "2026-12-14",
    risk: "low",
  },
  {
    id: "c1000000-0000-0000-0000-000000000006",
    name: "Kembhavi Pulse Cooperative",
    ownerName: "Kembhavi Raitha Sangha",
    village: "Kembhavi",
    clusterCode: "KEM-01",
    acres: 6.0,
    soilType: "loamy",
    lat: 16.669,
    lng: 76.568,
    cropName: "Bengal Gram",
    variety: "JG-11 (Chana)",
    season: "Rabi",
    status: "growing",
    driScore: 18,
    expectedHarvestDate: "2026-12-20",
    recommendedHarvestDate: "2026-12-20",
    risk: "low",
  },
  {
    id: "c1000000-0000-0000-0000-000000000007",
    name: "Mallikarjun Red Gram Plot",
    ownerName: "Mallikarjun Biradar",
    village: "Kembhavi",
    clusterCode: "KEM-01",
    acres: 3.2,
    soilType: "red",
    lat: 16.660,
    lng: 76.556,
    cropName: "Red Gram",
    variety: "TS-3R (Maruti)",
    season: "Kharif",
    status: "growing",
    driScore: 24,
    expectedHarvestDate: "2026-12-28",
    recommendedHarvestDate: "2026-12-28",
    risk: "low",
  },

  // Shorapur Cluster (Low/Nominal Risk Paddy & Groundnut)
  {
    id: "c1000000-0000-0000-0000-000000000008",
    name: "Shorapur Basin Paddy Farm",
    ownerName: "Venkatesh Nayak",
    village: "Shorapur",
    clusterCode: "SHO-01",
    acres: 5.5,
    soilType: "clay",
    lat: 16.522,
    lng: 76.755,
    cropName: "Paddy",
    variety: "BPT 5204 (Sona Masoori)",
    season: "Kharif",
    status: "growing",
    driScore: 26,
    expectedHarvestDate: "2026-12-10",
    recommendedHarvestDate: "2026-12-11",
    risk: "low",
  },
  {
    id: "c1000000-0000-0000-0000-000000000009",
    name: "Raja Venkatappa Canal Plot",
    ownerName: "Raja Venkatappa FPO",
    village: "Shorapur",
    clusterCode: "SHO-01",
    acres: 4.0,
    soilType: "loamy",
    lat: 16.518,
    lng: 76.762,
    cropName: "Groundnut",
    variety: "TMV-2",
    season: "Kharif",
    status: "growing",
    driScore: 31,
    expectedHarvestDate: "2026-12-16",
    recommendedHarvestDate: "2026-12-16",
    risk: "low",
  },
];

const riskColor: Record<string, string> = {
  high: "#ef4444",
  med: "#f59e0b",
  low: "#10b981",
};

// Helper component to pan/zoom map on cluster selection
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

export function ClusterMap() {
  const { t } = useI18n();
  const [farms, setFarms] = useState<MapFarmItem[]>(defaultFarms);
  const [loading, setLoading] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<MapFarmItem | null>(defaultFarms[0]);
  const [selectedCluster, setSelectedCluster] = useState<string>("all");
  const [cropFilter, setCropFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [showRiskZones, setShowRiskZones] = useState(true);
  const [showCatchment, setShowCatchment] = useState(false);
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

          const dri = matchedCrop?.driScore ?? matchedCrop?.dri_score ?? (f.clusterCode === "HUN-01" ? 76 : 24);
          const risk: "high" | "med" | "low" = dri > 60 ? "high" : dri > 35 ? "med" : "low";

          return {
            id: f.id,
            name: f.name || `Farm Plot ${idx + 1}`,
            ownerName: f.ownerName || f.users?.full_name || "Cluster Farmer",
            village: f.village || "Hunasagi",
            clusterCode: f.clusterCode || (f.village?.toLowerCase().includes("kembhavi") ? "KEM-01" : f.village?.toLowerCase().includes("shorapur") ? "SHO-01" : "HUN-01"),
            acres: Number(f.acres) || 3.0,
            soilType: f.soilType || f.soil_type || "loamy",
            lat: Number(f.lat) || (16.45 + idx * 0.003),
            lng: Number(f.lng) || (76.45 + idx * 0.003),
            cropName: matchedCrop?.cropName || matchedCrop?.crop_name || (f.clusterCode === "KEM-01" ? "Cotton" : f.clusterCode === "SHO-01" ? "Paddy" : "Tomato"),
            variety: matchedCrop?.variety || "Hybrid",
            season: matchedCrop?.season || "Kharif",
            status: matchedCrop?.status || "growing",
            driScore: dri,
            expectedHarvestDate: matchedCrop?.expectedHarvestDate || matchedCrop?.expected_harvest_date || "2026-12-05",
            recommendedHarvestDate: matchedCrop?.recommendedHarvestDate || matchedCrop?.recommended_harvest_date || "2026-12-08",
            risk,
          };
        });

        setFarms(merged);
        if (merged.length > 0) {
          setSelectedFarm(merged[0]);
        }
      }
    } catch (err) {
      console.warn("Live farms API fetch failed, using multi-cluster realistic dataset:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLiveData();
  }, []);

  // Filter markers based on cluster, crop and risk selections
  const filteredFarms = useMemo(() => {
    return farms.filter((f) => {
      const matchCluster = selectedCluster === "all" || f.clusterCode === selectedCluster;
      const matchCrop =
        cropFilter === "all" ||
        f.cropName.toLowerCase().includes(cropFilter.toLowerCase()) ||
        (cropFilter === "Pulses" && (f.cropName.includes("Gram") || f.cropName.includes("Chana")));
      const matchRisk = riskFilter === "all" || f.risk === riskFilter;
      return matchCluster && matchCrop && matchRisk;
    });
  }, [farms, selectedCluster, cropFilter, riskFilter]);

  // Current map center & zoom based on cluster
  const currentView = clusterCoordinates[selectedCluster] || clusterCoordinates.all;

  // Simulate Delay-Risk Index calculation dynamically
  async function handleSimulateDri() {
    if (!selectedFarm) return;
    setDriSimulating(true);
    try {
      const res = await apiDri({
        farmId: selectedFarm.id,
        cropName: selectedFarm.cropName,
        clusterId: selectedFarm.clusterCode || "HUN-01",
        expectedHarvestDate: selectedFarm.expectedHarvestDate || "2026-12-05",
        soilType: selectedFarm.soilType || "loamy",
        cropPlanId: "d1000000-0000-0000-0000-000000000001",
      });

      setSimulationResult({
        verdict: res.verdict || "Stagger recommended",
        delayDays: res.delayDays ?? 3,
        recommendedDate: res.recommendedDate || "2026-12-08",
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
      {/* Top Filter Bar: Multi-Cluster Navigation & Regional Controls */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground)]">
            <MapPin className="h-4 w-4 text-[var(--forest)]" />
            <span>Regional Cluster:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All Regions (District)" },
              { id: "HUN-01", label: "Hunasagi (HUN-01)" },
              { id: "KEM-01", label: "Kembhavi (KEM-01)" },
              { id: "SHO-01", label: "Shorapur (SHO-01)" },
            ].map((c) => (
              <Button
                key={c.id}
                variant={selectedCluster === c.id ? "default" : "outline"}
                size="sm"
                className={`h-7 px-3 text-xs rounded border-[var(--border)] ${
                  selectedCluster === c.id ? "bg-[var(--forest)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
                onClick={() => {
                  setSelectedCluster(c.id);
                  const firstInCluster = farms.find((f) => c.id === "all" || f.clusterCode === c.id);
                  if (firstInCluster) setSelectedFarm(firstInCluster);
                  setSimulationResult(null);
                }}
              >
                {c.label}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs border-[var(--border)]"
              onClick={loadLiveData}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-[var(--forest)]" : "text-[var(--muted-foreground)]"}`} />
              Sync
            </Button>
          </div>
        </div>

        {/* Commodity & Risk Filtering + Area Overlays Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)]">
              <Filter className="h-3 w-3 text-[var(--forest)]" />
              <span>Crop:</span>
            </div>
            {["all", "Tomato", "Onion", "Cotton", "Pulses", "Paddy"].map((crop) => (
              <Button
                key={crop}
                variant={cropFilter === crop ? "default" : "outline"}
                size="sm"
                className="h-7 px-2.5 text-xs capitalize rounded border-[var(--border)]"
                onClick={() => setCropFilter(crop)}
              >
                {crop === "all" ? "All Crops" : crop}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)]">
              <span>Risk:</span>
            </div>
            {[
              { key: "all", label: "All" },
              { key: "high", label: "High Risk Area", color: "text-red-700" },
              { key: "med", label: "Moderate", color: "text-amber-700" },
              { key: "low", label: "Safe Zone", color: "text-[var(--forest)]" },
            ].map((r) => (
              <Button
                key={r.key}
                variant={riskFilter === r.key ? "default" : "outline"}
                size="sm"
                className={`h-7 px-2.5 text-xs rounded border-[var(--border)] ${r.color || ""}`}
                onClick={() => setRiskFilter(r.key)}
              >
                {r.label}
              </Button>
            ))}

            <Button
              variant={showRiskZones ? "default" : "outline"}
              size="sm"
              className={`h-7 px-2.5 gap-1.5 text-xs rounded border-[var(--border)] ${showRiskZones ? "bg-[#B8864B] text-white hover:bg-[#A3753E]" : ""}`}
              onClick={() => setShowRiskZones(!showRiskZones)}
            >
              <ShieldAlert className="h-3 w-3" />
              Risk Catchments
            </Button>

            <Button
              variant={showCatchment ? "secondary" : "outline"}
              size="sm"
              className="h-7 px-2.5 gap-1.5 text-xs rounded border-[var(--border)]"
              onClick={() => setShowCatchment(!showCatchment)}
            >
              <Layers className="h-3 w-3 text-[var(--forest)]" />
              Biomass Catchment
            </Button>
          </div>
        </div>
      </div>

      {/* Main Interactive Map */}
      <div className="relative h-[500px] w-full overflow-hidden rounded-xl border border-[var(--border)]">
        <MapContainer center={currentView.center} zoom={currentView.zoom} className="h-full w-full" scrollWheelZoom>
          <MapController center={currentView.center} zoom={currentView.zoom} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* High-Risk vs Low-Risk Geographic Catchment Zones */}
          {showRiskZones &&
            geographicRiskZones.map((zone) => (
              <Circle
                key={zone.id}
                center={zone.center}
                radius={zone.radius}
                pathOptions={{
                  color: zone.color,
                  fillColor: zone.color,
                  fillOpacity: zone.riskLevel === "high" ? 0.18 : 0.14,
                  weight: zone.riskLevel === "high" ? 2.5 : 1.5,
                  dashArray: zone.riskLevel === "high" ? "4, 6" : undefined,
                }}
              >
                <Tooltip direction="center" permanent offset={[0, 0]} opacity={0.9}>
                  <div className="text-center font-semibold text-xs leading-tight">
                    <span
                      className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                      style={{ backgroundColor: zone.color }}
                    >
                      {zone.riskLevel === "high" ? "HIGH RISK AREA" : zone.riskLevel === "med" ? "WATCH AREA" : "LOW RISK SAFE ZONE"}
                    </span>
                    <div className="mt-1 font-bold">{zone.driRange}</div>
                    <div className="text-[10px] opacity-75">{zone.dominantCrop} Focus</div>
                  </div>
                </Tooltip>
                <Popup className="text-[var(--foreground)]">
                  <div className="space-y-1.5 py-1">
                    <div className="font-bold text-sm" style={{ color: zone.color }}>
                      {zone.name}
                    </div>
                    <p className="text-xs text-[var(--foreground)]/80 leading-relaxed">{zone.description}</p>
                    <div className="text-xs font-medium">Dominant Crop: {zone.dominantCrop}</div>
                  </div>
                </Popup>
              </Circle>
            ))}

          {/* Biomass Catchment Radius Layer (Optional) */}
          {showCatchment && (
            <Circle
              center={[16.452, 76.448]}
              radius={2400}
              pathOptions={{
                color: "#10b981",
                fillColor: "#10b981",
                fillOpacity: 0.1,
                weight: 1.5,
                dashArray: "6, 8",
              }}
            >
              <Tooltip direction="center" permanent offset={[0, 0]} opacity={0.85}>
                5km Biomass Waste Pooling Catchment (14.8t)
              </Tooltip>
            </Circle>
          )}

          {/* Live Dynamic Farm Markers */}
          {filteredFarms.map((f) => (
            <CircleMarker
              key={f.id}
              center={[f.lat, f.lng]}
              radius={selectedFarm?.id === f.id ? 14 : 9}
              pathOptions={{
                color: selectedFarm?.id === f.id ? "#ffffff" : riskColor[f.risk] ?? "#22c55e",
                fillColor: riskColor[f.risk] ?? "#22c55e",
                fillOpacity: selectedFarm?.id === f.id ? 0.95 : 0.75,
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
                  {f.cropName} ({f.variety}) · {f.acres} ac · {f.clusterCode}
                </div>
              </Tooltip>
              <Popup className="text-[var(--foreground)]">
                <div className="space-y-1 py-1">
                  <div className="text-sm font-semibold">{f.name}</div>
                  <div className="text-xs opacity-80">Farmer: {f.ownerName} ({f.clusterCode})</div>
                  <div className="text-xs">
                    Crop: <span className="font-medium">{f.cropName}</span> ({f.variety})
                  </div>
                  <div className="text-xs">
                    Soil: <span className="capitalize">{f.soilType}</span> · {f.acres} Acres
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span>Delay Risk (DRI):</span>
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

        {/* Live Legend & Status Overlay */}
        <div className="pointer-events-none absolute bottom-3 left-3 flex flex-col gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)]/95 p-3 text-xs shadow-xs">
          <div className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
            <span className="h-2 w-2 rounded-full bg-[var(--forest)]" />
            <span>{currentView.label}</span>
          </div>

          <div className="flex items-center gap-3 pt-1 text-[11px] text-[var(--muted-foreground)]">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-600" />
              <span>High Risk (&gt;60%)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Moderate (35-60%)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[var(--forest)]" />
              <span>Low Risk (&lt;35%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Farm Detail & Live Simulation Panel */}
      {selectedFarm && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[var(--foreground)]">{selectedFarm.name}</h3>
                <Badge
                  variant={selectedFarm.risk === "high" ? "danger" : selectedFarm.risk === "med" ? "gold" : "forest"}
                  className="text-[10px]"
                >
                  {selectedFarm.risk.toUpperCase()} RISK · DRI {selectedFarm.driScore}%
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {selectedFarm.clusterCode} · {selectedFarm.village}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Cultivator: <span className="font-medium text-[var(--foreground)]">{selectedFarm.ownerName}</span> · {selectedFarm.acres} Acres ({selectedFarm.soilType} soil) · Variety: {selectedFarm.variety}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-[var(--muted-foreground)]">
                  <Calendar className="h-3.5 w-3.5 text-[var(--forest)]" />
                  Target Harvest: <strong className="text-[var(--foreground)] font-mono">{selectedFarm.expectedHarvestDate}</strong>
                </span>
                {selectedFarm.recommendedHarvestDate && (
                  <span className="flex items-center gap-1 text-[var(--forest)] font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Optimized Slot: <strong className="font-mono">{selectedFarm.recommendedHarvestDate}</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleSimulateDri}
                disabled={driSimulating}
                className="h-8 gap-2 text-xs bg-[var(--forest)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]"
              >
                <Sprout className={`h-3.5 w-3.5 ${driSimulating ? "animate-spin" : ""}`} />
                {driSimulating ? "Computing Stagger..." : "Simulate Staggered Harvest"}
              </Button>
            </div>
          </div>

          {/* Simulation Result Banner */}
          {simulationResult && (
            <div className="mt-4 rounded-lg border border-[var(--forest)]/30 bg-[var(--muted)]/50 p-3.5 text-xs">
              <div className="flex items-center gap-2 font-semibold text-[var(--forest)]">
                <CheckCircle2 className="h-4 w-4" />
                <span>Harvest Synchronization for {selectedFarm.name} ({selectedFarm.clusterCode})</span>
              </div>
              <p className="mt-1 text-xs text-[var(--foreground)] leading-relaxed">
                {simulationResult.verdict}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-4 text-xs font-medium">
                <span>Calculated Offset: <strong className="font-mono text-[var(--forest)]">+{simulationResult.delayDays} Days</strong></span>
                <span>Recommended Slot: <strong className="font-mono text-[var(--forest)]">{simulationResult.recommendedDate}</strong></span>
                <span>Mitigated DRI Score: <strong className="font-mono text-[var(--forest)]">{Math.max(16, selectedFarm.driScore - 22)}% (Nominal)</strong></span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
