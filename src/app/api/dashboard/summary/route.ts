import { NextRequest } from "next/server";
import { getSupabaseAdminOptional } from "@/lib/supabase-admin";
import { apiSuccess, handleCatchError } from "@/lib/api-response";
import { clusterStats, cropDistribution, harvestRows, wastePool } from "@/lib/demo-data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clusterId = searchParams.get("clusterId") || "HUN-01";
    const village = searchParams.get("village") || "Hunasagi";
    const admin = getSupabaseAdminOptional();

    if (!admin) {
      // Graceful fallback to rich demo data
      return apiSuccess({
        cluster: {
          id: "b1000000-0000-0000-0000-000000000001",
          name: "Hunasagi Progressive Farmers Cluster",
          code: clusterId,
          village: "Hunasagi",
          district: "Yadgir, Karnataka",
          farmersCount: clusterStats.farmers,
          activeCropsCount: clusterStats.activeCrops,
          tomatoSaturation: clusterStats.tomatoSaturation,
          suggestedCrop: clusterStats.suggestedCrop,
          aiAdvisory: clusterStats.aiLine,
        },
        cropDistribution,
        upcomingHarvests: harvestRows,
        demandSupplyTrends: [
          { week: "W1", demand: 42, supply: 38 },
          { week: "W2", demand: 48, supply: 55 },
          { week: "W3", demand: 54, supply: 49 },
          { week: "W4", demand: 61, supply: 72 },
          { week: "W5", demand: 58, supply: 44 },
        ],
        marketplace: {
          openListingsCount: 2,
          totalAvailableKg: 6500,
          pendingBidsCount: 1,
        },
        wasteToWealth: {
          pooledBiomassTons: wastePool.qtyTons,
          potentialIncomeINR: wastePool.valueINR,
          carbonOffsetKgCO2e: 4800,
          activeBuyersCount: wastePool.buyersUnlocked,
        },
        weather: {
          tempMax: 33.5,
          tempMin: 22.0,
          rainfallMm: 0.0,
          condition: "clear",
        },
      });
    }

    // 1. Fetch Cluster details
    const { data: cluster } = await admin
      .from("farmer_groups")
      .select("id, name, code, village, district, total_acres")
      .or(`code.eq.${clusterId},village.ilike.%${village}%`)
      .limit(1)
      .maybeSingle();

    // 2. Count registered farmers
    const { count: farmerCount } = await admin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "farmer");

    // 3. Fetch active crop plans
    const { data: cropPlans } = await admin
      .from("crop_plans")
      .select("crop_name, area_acres, status, dri_score, market_pressure, expected_harvest_date, farms(name, village)")
      .in("status", ["growing", "harvest_ready"]);

    // Calculate crop distribution & saturation
    let totalAcres = 0;
    let tomatoAcres = 0;
    const cropAcresMap = new Map<string, number>();

    (cropPlans || []).forEach((cp: any) => {
      const acres = Number(cp.area_acres || 0);
      totalAcres += acres;
      if (cp.crop_name.toLowerCase().includes("tomato")) {
        tomatoAcres += acres;
      }
      cropAcresMap.set(cp.crop_name, (cropAcresMap.get(cp.crop_name) || 0) + acres);
    });

    const activeCropsCount = cropAcresMap.size || 11;
    const tomatoSaturation = totalAcres > 0 ? Math.round((tomatoAcres / totalAcres) * 100) : 78;

    const colors = ["#ef4444", "#a78bfa", "#f97316", "#22c55e", "#38bdf8", "#eab308"];
    const dynamicCropDistribution = Array.from(cropAcresMap.entries()).map(([name, acres], idx) => ({
      name,
      value: Math.round(acres * 10) / 10,
      fill: colors[idx % colors.length],
    }));

    // Upcoming harvest risks
    const upcomingHarvests = (cropPlans || [])
      .slice(0, 5)
      .map((cp: any) => ({
        farm: cp.farms?.name || "Plot",
        crop: cp.crop_name,
        risk: cp.dri_score || 45,
        marketPressure: cp.market_pressure || 50,
        expectedDate: cp.expected_harvest_date,
        weather: cp.dri_score > 50 ? "Rain risk near harvest" : "Favorable conditions",
      }));

    // 4. Marketplace stats
    const { count: openListingsCount } = await admin
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");

    const { count: pendingBidsCount } = await admin
      .from("bids")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // 5. Weather cache
    const today = new Date().toISOString().split("T")[0];
    const { data: weather } = await admin
      .from("weather_cache")
      .select("temp_max, temp_min, rainfall_mm, condition")
      .eq("cluster_id", cluster?.code || clusterId)
      .eq("date", today)
      .maybeSingle();

    return apiSuccess({
      cluster: {
        id: cluster?.id ?? "b1000000-0000-0000-0000-000000000001",
        name: cluster?.name ?? "Hunasagi Progressive Farmers Cluster",
        code: cluster?.code ?? clusterId,
        village: cluster?.village ?? "Hunasagi",
        district: `${cluster?.district ?? "Yadgir"}, Karnataka`,
        farmersCount: farmerCount || clusterStats.farmers,
        activeCropsCount,
        tomatoSaturation,
        suggestedCrop: tomatoSaturation > 60 ? "Onion or Chilli (evades tomato market glut)" : "Tomato",
        aiAdvisory: `${tomatoSaturation}% of acreage is currently under tomato. Consider staggering harvest or diversifying to onion.`,
      },
      cropDistribution: dynamicCropDistribution.length > 0 ? dynamicCropDistribution : cropDistribution,
      upcomingHarvests: upcomingHarvests.length > 0 ? upcomingHarvests : harvestRows,
      demandSupplyTrends: [
        { week: "W1", demand: 42, supply: 38 },
        { week: "W2", demand: 48, supply: 55 },
        { week: "W3", demand: 54, supply: 49 },
        { week: "W4", demand: 61, supply: 72 },
        { week: "W5", demand: 58, supply: 44 },
      ],
      marketplace: {
        openListingsCount: openListingsCount ?? 2,
        pendingBidsCount: pendingBidsCount ?? 1,
      },
      wasteToWealth: {
        pooledBiomassTons: wastePool.qtyTons,
        potentialIncomeINR: wastePool.valueINR,
        carbonOffsetKgCO2e: 4800,
        activeBuyersCount: wastePool.buyersUnlocked,
      },
      weather: weather || {
        tempMax: 33.5,
        tempMin: 22.0,
        rainfallMm: 0.0,
        condition: "clear",
      },
    });
  } catch (e) {
    return handleCatchError(e, "api/dashboard/summary GET");
  }
}
