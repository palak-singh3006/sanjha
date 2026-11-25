import { getSupabaseAdminOptional } from "@/lib/supabase-admin";
import { formatRouteError } from "@/lib/api-errors";

// Cluster baseline peer counts and regional weather risks
const clusterDefaults: Record<string, { weatherScore: number; peerCount: Record<string, number> }> = {
  "HUN-01": {
    weatherScore: 48, // Late Nov scattered showers risk on tomato
    peerCount: {
      tomato: 28,
      onion: 12,
      chilli: 8,
      maize: 5,
    },
  },
  "KEM-01": {
    weatherScore: 16, // Dry, sunny conditions
    peerCount: {
      cotton: 7,
      "red gram": 9,
      "bengal gram": 6,
      chana: 6,
      tomato: 3,
      chilli: 4,
    },
  },
  "SHO-01": {
    weatherScore: 22, // Krishna canal command, clear weather
    peerCount: {
      paddy: 14,
      groundnut: 7,
      maize: 4,
      sunflower: 3,
    },
  },
};

const soilScores: Record<string, Record<string, number>> = {
  loamy: {
    tomato: 25,
    onion: 15,
    chilli: 20,
    wheat: 10,
    cotton: 20,
    "bengal gram": 15,
    "red gram": 18,
    chana: 15,
    paddy: 28,
    groundnut: 18,
  },
  clay: {
    tomato: 55,
    onion: 58,
    chilli: 50,
    wheat: 25,
    cotton: 35,
    "bengal gram": 40,
    "red gram": 35,
    chana: 40,
    paddy: 15, // Clay holds water well for paddy
    groundnut: 45,
  },
  sandy: {
    tomato: 35,
    onion: 40,
    chilli: 30,
    wheat: 45,
    cotton: 40,
    "bengal gram": 30,
    "red gram": 25,
    chana: 30,
    paddy: 60,
    groundnut: 20,
  },
  red: {
    tomato: 30,
    onion: 35,
    chilli: 25,
    wheat: 30,
    cotton: 25,
    "bengal gram": 20,
    "red gram": 15,
    chana: 20,
    paddy: 40,
    groundnut: 22,
  },
  black: {
    tomato: 35,
    onion: 20,
    chilli: 22,
    wheat: 15,
    cotton: 15, // Black cotton soil is ideal for cotton
    "bengal gram": 18,
    "red gram": 20,
    chana: 18,
    paddy: 25,
    groundnut: 30,
  },
};

export async function POST(req: Request) {
  try {
    const { farmId, cropName, clusterId, expectedHarvestDate, soilType, cropPlanId } = await req.json();

    const cropKey = String(cropName || "Tomato").toLowerCase().trim();
    const clusterKey = String(clusterId || "HUN-01").toUpperCase().trim();
    const soilKey = String(soilType || "loamy").toLowerCase().trim();
    const admin = getSupabaseAdminOptional();

    const clusterConfig = clusterDefaults[clusterKey] || clusterDefaults["HUN-01"];
    let weatherScore = clusterConfig.weatherScore;
    let peerCount = clusterConfig.peerCount[cropKey] ?? (cropKey.includes("tomato") ? 24 : cropKey.includes("cotton") ? 6 : 8);

    if (admin) {
      try {
        const { data: weather } = await admin
          .from("weather_cache")
          .select("rainfall_mm, temp_max")
          .eq("cluster_id", clusterKey)
          .order("date", { ascending: false })
          .limit(3);

        const rows = weather ?? [];
        if (rows.length > 0) {
          const avgRain = rows.reduce((s, w) => s + (w.rainfall_mm || 0), 0) / (rows.length || 1);
          const avgTemp = rows.reduce((s, w) => s + (w.temp_max || 30), 0) / (rows.length || 1);
          weatherScore = Math.min(avgRain * 4 + (avgTemp > 38 ? (avgTemp - 38) * 3 : 0), 100);
        }

        const { data: peers } = await admin
          .from("crop_plans")
          .select("id, farm_id")
          .ilike("crop_name", `%${cropName}%`)
          .in("status", ["growing", "harvest_ready"])
          .neq("farm_id", farmId);

        if (peers && peers.length > 0) {
          peerCount = peers.length;
        }
      } catch (err) {
        console.warn("[api/dri] database lookup skipped, using cluster baseline:", err);
      }
    }

    // Market pressure formula: proportional to peer volume arriving at APMC
    const isPerishable = cropKey.includes("tomato") || cropKey.includes("onion") || cropKey.includes("chilli");
    const peerScaling = isPerishable ? 35 : 20;
    const marketPressure = Math.min(Math.round((peerCount / peerScaling) * 100), 95);

    // Soil vulnerability score
    const soilScore = soilScores[soilKey]?.[cropKey] ?? 25;

    // Composite Delay-Risk Index (0-100)
    const driRaw = weatherScore * 0.35 + marketPressure * 0.45 + soilScore * 0.20;
    const dri = Math.min(Math.max(Math.round(driRaw), 15), 95);

    // Calculated staggering delay
    let delayDays = 0;
    if (dri >= 68) {
      delayDays = Math.min(Math.max(Math.round(peerCount / 7), 3), 5); // 3 to 5 days stagger for peak glut
    } else if (dri >= 45) {
      delayDays = 2; // 2 days for moderate risk
    } else if (dri >= 32) {
      delayDays = 1;
    } else {
      delayDays = 0; // Low risk, harvest immediately
    }

    const base = expectedHarvestDate ? new Date(expectedHarvestDate) : new Date();
    base.setDate(base.getDate() + delayDays);
    const recommendedDate = base.toISOString().split("T")[0];

    // Actionable agronomic verdict
    let verdict = "Optimal harvest window";
    if (dri >= 68) {
      verdict = `Critical Market Glut Alert: High ${cropName || "produce"} volume in ${clusterKey}. Stagger harvest by +${delayDays} days to evade APMC price crash.`;
    } else if (dri >= 45) {
      verdict = `Moderate Delay Risk: Weather moisture elevated. Stagger harvest by +${delayDays} days for dry curing.`;
    } else {
      verdict = `Optimal Harvest Timing: Market demand is strong for ${cropName || "crop"}. Proceed with scheduled harvest.`;
    }

    if (admin && cropPlanId) {
      try {
        await admin
          .from("crop_plans")
          .update({
            dri_score: dri,
            market_pressure: marketPressure,
            recommended_harvest_date: recommendedDate,
          })
          .eq("id", cropPlanId);
      } catch (e) {
        console.warn("[api/dri] crop_plans update skipped:", e);
      }
    }

    return Response.json({
      dri,
      marketPressure,
      weatherScore: Math.round(weatherScore),
      soilScore,
      delayDays,
      recommendedDate,
      verdict,
    });
  } catch (e) {
    console.error("[api/dri]", e);
    return Response.json(formatRouteError(e), { status: 500 });
  }
}
