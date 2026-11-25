import { NextRequest } from "next/server";
import { getSupabaseAdminOptional } from "@/lib/supabase-admin";
import { apiSuccess, handleCatchError } from "@/lib/api-response";
import { clusterStats, cropDistribution, harvestRows, wastePool } from "@/lib/demo-data";

// Cluster-specific demand vs supply profiles reflecting regional agricultural dynamics
const clusterProfiles: Record<string, {
  name: string;
  code: string;
  village: string;
  district: string;
  farmersCount: number;
  activeCropsCount: number;
  tomatoSaturation: number;
  suggestedCrop: string;
  aiAdvisory: string;
  cropDistribution: Array<{ name: string; value: number; fill: string }>;
  demandSupplyTrends: Array<{ week: string; demand: number; supply: number }>;
  upcomingHarvests: Array<{ farm: string; crop: string; risk: number; marketPressure: number; expectedDate: string; weather: string }>;
  wastePool: { pooledBiomassTons: number; potentialIncomeINR: number; activeBuyersCount: number };
}> = {
  "HUN-01": {
    name: "Hunasagi Progressive Farmers Cluster",
    code: "HUN-01",
    village: "Hunasagi",
    district: "Yadgir, Karnataka",
    farmersCount: 84,
    activeCropsCount: 11,
    tomatoSaturation: 76,
    suggestedCrop: "Onion or Chilli (evades tomato market glut)",
    aiAdvisory: "76% of acreage is under tomato. 34 tons anticipated in Week 4 creates high price crash risk. Staggering harvest by 3-5 days recommended.",
    cropDistribution: [
      { name: "Tomato", value: 52, fill: "#ef4444" },
      { name: "Onion", value: 24, fill: "#a78bfa" },
      { name: "Chilli", value: 14, fill: "#f97316" },
      { name: "Maize", value: 10, fill: "#22c55e" },
    ],
    demandSupplyTrends: [
      { week: "W1", demand: 45, supply: 38 },
      { week: "W2", demand: 48, supply: 55 },
      { week: "W3", demand: 52, supply: 64 },
      { week: "W4", demand: 58, supply: 88 }, // Peak Tomato Glut! Excess supply
      { week: "W5", demand: 50, supply: 42 },
    ],
    upcomingHarvests: [
      { farm: "Gowda South Field", crop: "Tomato", risk: 78, marketPressure: 72, expectedDate: "2026-12-05", weather: "Unseasonal rain alert" },
      { farm: "Renuka Krishna Valley Farm", crop: "Tomato", risk: 72, marketPressure: 68, expectedDate: "2026-12-08", weather: "High humidity risk" },
      { farm: "Basavaraj Canal Plot", crop: "Onion", risk: 36, marketPressure: 40, expectedDate: "2026-12-18", weather: "Favorable conditions" },
      { farm: "Sanjha Co-op Tomato Plot", crop: "Tomato", risk: 82, marketPressure: 85, expectedDate: "2026-12-04", weather: "High moisture" },
    ],
    wastePool: {
      pooledBiomassTons: 14.8,
      potentialIncomeINR: 62160,
      activeBuyersCount: 4,
    },
  },
  "KEM-01": {
    name: "Kembhavi Integrated Pulses & Cotton Cluster",
    code: "KEM-01",
    village: "Kembhavi",
    district: "Yadgir, Karnataka",
    farmersCount: 68,
    activeCropsCount: 7,
    tomatoSaturation: 14,
    suggestedCrop: "Red Gram (Toor) & Cotton",
    aiAdvisory: "Optimal diversification: 62% under pulses and 24% under cotton. Stable APMC procurement with minimal glut risk and resilient moisture retention.",
    cropDistribution: [
      { name: "Red Gram", value: 45, fill: "#f59e0b" },
      { name: "Cotton", value: 28, fill: "#38bdf8" },
      { name: "Bengal Gram", value: 15, fill: "#10b981" },
      { name: "Tomato", value: 8, fill: "#ef4444" },
      { name: "Chilli", value: 4, fill: "#a78bfa" },
    ],
    demandSupplyTrends: [
      { week: "W1", demand: 62, supply: 60 },
      { week: "W2", demand: 66, supply: 64 },
      { week: "W3", demand: 70, supply: 68 },
      { week: "W4", demand: 72, supply: 71 }, // Steady balance between demand and supply
      { week: "W5", demand: 75, supply: 73 },
    ],
    upcomingHarvests: [
      { farm: "Patil Cotton Acreage", crop: "Cotton", risk: 22, marketPressure: 28, expectedDate: "2026-12-14", weather: "Optimal dry spell" },
      { farm: "Kembhavi Pulse Cooperative", crop: "Bengal Gram", risk: 28, marketPressure: 32, expectedDate: "2026-12-20", weather: "Favorable conditions" },
      { farm: "Mallikarjun Red Gram Plot", crop: "Red Gram", risk: 24, marketPressure: 26, expectedDate: "2026-12-28", weather: "Clear skies" },
    ],
    wastePool: {
      pooledBiomassTons: 22.4,
      potentialIncomeINR: 94080,
      activeBuyersCount: 6,
    },
  },
  "SHO-01": {
    name: "Shorapur Krishna Basin Paddy Cluster",
    code: "SHO-01",
    village: "Shorapur",
    district: "Yadgir, Karnataka",
    farmersCount: 96,
    activeCropsCount: 5,
    tomatoSaturation: 6,
    suggestedCrop: "Paddy & Groundnut",
    aiAdvisory: "Canal water availability optimal for Sona Masoori paddy. Strong institutional buyer demand exceeds local supply, ensuring price stability.",
    cropDistribution: [
      { name: "Paddy", value: 58, fill: "#10b981" },
      { name: "Groundnut", value: 22, fill: "#f59e0b" },
      { name: "Maize", value: 12, fill: "#38bdf8" },
      { name: "Sunflower", value: 8, fill: "#eab308" },
    ],
    demandSupplyTrends: [
      { week: "W1", demand: 55, supply: 48 },
      { week: "W2", demand: 65, supply: 52 },
      { week: "W3", demand: 74, supply: 58 },
      { week: "W4", demand: 82, supply: 64 }, // High demand leads supply!
      { week: "W5", demand: 88, supply: 70 },
    ],
    upcomingHarvests: [
      { farm: "Shorapur Basin Paddy Farm", crop: "Paddy", risk: 26, marketPressure: 30, expectedDate: "2026-12-10", weather: "Canal flow stable" },
      { farm: "Raja Venkatappa Canal Plot", crop: "Groundnut", risk: 31, marketPressure: 34, expectedDate: "2026-12-16", weather: "Clear conditions" },
    ],
    wastePool: {
      pooledBiomassTons: 31.0,
      potentialIncomeINR: 130200,
      activeBuyersCount: 7,
    },
  },
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawClusterId = (searchParams.get("clusterId") || "HUN-01").toUpperCase();
    const clusterId = clusterProfiles[rawClusterId] ? rawClusterId : "HUN-01";
    const profile = clusterProfiles[clusterId] || clusterProfiles["HUN-01"];
    const villageParam = searchParams.get("village") || profile.village;
    const admin = getSupabaseAdminOptional();

    if (!admin) {
      // Return realistic cluster-specific dataset
      return apiSuccess({
        cluster: {
          id: `b1000000-0000-0000-0000-00000000000${clusterId === "HUN-01" ? "1" : clusterId === "KEM-01" ? "2" : "3"}`,
          name: profile.name,
          code: profile.code,
          village: profile.village,
          district: profile.district,
          farmersCount: profile.farmersCount,
          activeCropsCount: profile.activeCropsCount,
          tomatoSaturation: profile.tomatoSaturation,
          suggestedCrop: profile.suggestedCrop,
          aiAdvisory: profile.aiAdvisory,
        },
        cropDistribution: profile.cropDistribution,
        upcomingHarvests: profile.upcomingHarvests,
        demandSupplyTrends: profile.demandSupplyTrends,
        marketplace: {
          openListingsCount: clusterId === "HUN-01" ? 4 : clusterId === "KEM-01" ? 6 : 5,
          totalAvailableKg: clusterId === "HUN-01" ? 8500 : clusterId === "KEM-01" ? 14200 : 19000,
          pendingBidsCount: clusterId === "HUN-01" ? 2 : clusterId === "KEM-01" ? 5 : 4,
        },
        wasteToWealth: {
          pooledBiomassTons: profile.wastePool.pooledBiomassTons,
          potentialIncomeINR: profile.wastePool.potentialIncomeINR,
          carbonOffsetKgCO2e: Math.round(profile.wastePool.pooledBiomassTons * 324),
          activeBuyersCount: profile.wastePool.activeBuyersCount,
        },
        weather: {
          tempMax: clusterId === "HUN-01" ? 33.5 : clusterId === "KEM-01" ? 31.8 : 34.0,
          tempMin: clusterId === "HUN-01" ? 22.0 : clusterId === "KEM-01" ? 20.5 : 23.0,
          rainfallMm: clusterId === "HUN-01" ? 8.4 : clusterId === "KEM-01" ? 0.0 : 1.2,
          condition: clusterId === "HUN-01" ? "scattered_showers" : "clear",
        },
      });
    }

    // 1. Fetch Cluster details from Database (`clusters` table)
    let cluster: any = null;
    try {
      const { data } = await admin
        .from("clusters")
        .select("id, name, center_lat, center_lng")
        .ilike("name", `%${villageParam}%`)
        .limit(1)
        .maybeSingle();

      if (data) {
        const isKembhavi = data.name?.toLowerCase().includes("kembhavi");
        const isShorapur = data.name?.toLowerCase().includes("shorapur");
        cluster = {
          id: data.id,
          name: data.name,
          code: isKembhavi ? "KEM-01" : isShorapur ? "SHO-01" : "HUN-01",
          village: isKembhavi ? "Kembhavi" : isShorapur ? "Shorapur" : "Hunasagi",
          district: "Yadgir, Karnataka",
          lat: Number(data.center_lat ?? 16.45),
          lng: Number(data.center_lng ?? 76.45),
        };
      }
    } catch (e) {
      console.warn("[api/dashboard/summary] clusters lookup:", e);
    }

    // 2. Count registered farms in this cluster
    let farmerCount = profile.farmersCount;
    if (cluster?.id) {
      try {
        const { count: farmCount } = await admin
          .from("farms")
          .select("*", { count: "exact", head: true })
          .eq("cluster_id", cluster.id);
        if (farmCount && farmCount > 0) {
          farmerCount = farmCount * 9; // Cluster membership multiplier
        }
      } catch {
        // use baseline
      }
    }

    // 3. Fetch active crop plans for farms belonging to this cluster
    let dbCropPlans: any[] = [];
    try {
      let cropPlansQuery = admin
        .from("crop_plans")
        .select(`
          id, crop_name, sow_date, expected_harvest_date, recommended_harvest_date, dri_score, market_pressure, quantity_kg, status,
          farms (id, name, area_acres, cluster_id, soil_type, lat, lng)
        `)
        .in("status", ["growing", "harvest_ready"]);

      if (cluster?.id) {
        cropPlansQuery = cropPlansQuery.eq("farms.cluster_id", cluster.id);
      }

      const { data } = await cropPlansQuery;
      dbCropPlans = data || [];
    } catch (err) {
      console.warn("[api/dashboard/summary] crop_plans query skipped:", err);
    }

    // Calculate crop distribution & saturation
    let totalTons = 0;
    let tomatoTons = 0;
    const cropVolumeMap = new Map<string, number>();

    const activePlans = dbCropPlans.filter((cp: any) => cp.farms);

    if (activePlans.length > 0) {
      activePlans.forEach((cp: any) => {
        const volume = Number(cp.quantity_kg || (Number(cp.farms?.area_acres || 2.5) * 4000));
        totalTons += volume;
        if (cp.crop_name?.toLowerCase().includes("tomato")) {
          tomatoTons += volume;
        }
        cropVolumeMap.set(cp.crop_name, (cropVolumeMap.get(cp.crop_name) || 0) + volume);
      });
    }

    const activeCropsCount = cropVolumeMap.size > 0 ? cropVolumeMap.size : profile.activeCropsCount;
    const tomatoSaturation = totalTons > 0 ? Math.round((tomatoTons / totalTons) * 100) : profile.tomatoSaturation;

    const colors = ["#ef4444", "#a78bfa", "#f97316", "#22c55e", "#38bdf8", "#eab308"];
    const dynamicCropDistribution = cropVolumeMap.size > 0
      ? Array.from(cropVolumeMap.entries()).map(([name, vol], idx) => ({
          name,
          value: Math.round(vol / 100) / 10, // metric tons
          fill: colors[idx % colors.length],
        }))
      : profile.cropDistribution;

    // Upcoming harvest risks
    const upcomingHarvests = activePlans.length > 0
      ? activePlans.slice(0, 5).map((cp: any) => ({
          farm: cp.farms?.name || "Plot",
          crop: cp.crop_name,
          risk: cp.dri_score || (cp.crop_name === "Tomato" ? 76 : 24),
          marketPressure: cp.market_pressure || 40,
          expectedDate: cp.expected_harvest_date,
          weather: (cp.dri_score ?? 35) > 60 ? "Unseasonal rain alert" : "Favorable conditions",
        }))
      : profile.upcomingHarvests;

    // 4. Marketplace stats
    const { count: openListingsCount } = await admin
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");

    const { count: pendingBidsCount } = await admin
      .from("bids")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // 5. Weather cache (gracefully handles if table absent)
    let weather = null;
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await admin
        .from("weather_cache")
        .select("temp_max, temp_min, rainfall_mm, condition")
        .eq("cluster_id", cluster?.code || clusterId)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();
      weather = data;
    } catch {
      // Table absent or not populated
    }

    return apiSuccess({
      cluster: {
        id: cluster?.id ?? `b1000000-0000-0000-0000-00000000000${clusterId === "HUN-01" ? "1" : clusterId === "KEM-01" ? "2" : "3"}`,
        name: cluster?.name ?? profile.name,
        code: cluster?.code ?? profile.code,
        village: cluster?.village ?? profile.village,
        district: `${cluster?.district ?? "Yadgir"}, Karnataka`,
        farmersCount: farmerCount,
        activeCropsCount,
        tomatoSaturation,
        suggestedCrop: profile.suggestedCrop,
        aiAdvisory: profile.aiAdvisory,
      },
      cropDistribution: dynamicCropDistribution,
      upcomingHarvests,
      demandSupplyTrends: profile.demandSupplyTrends,
      marketplace: {
        openListingsCount: openListingsCount ?? (clusterId === "HUN-01" ? 4 : 6),
        pendingBidsCount: pendingBidsCount ?? 2,
      },
      wasteToWealth: {
        pooledBiomassTons: profile.wastePool.pooledBiomassTons,
        potentialIncomeINR: profile.wastePool.potentialIncomeINR,
        carbonOffsetKgCO2e: Math.round(profile.wastePool.pooledBiomassTons * 324),
        activeBuyersCount: profile.wastePool.activeBuyersCount,
      },
      weather: weather || {
        tempMax: clusterId === "HUN-01" ? 33.5 : 31.8,
        tempMin: clusterId === "HUN-01" ? 22.0 : 20.5,
        rainfallMm: clusterId === "HUN-01" ? 8.4 : 0.0,
        condition: clusterId === "HUN-01" ? "scattered_showers" : "clear",
      },
    });
  } catch (e) {
    return handleCatchError(e, "api/dashboard/summary GET");
  }
}
