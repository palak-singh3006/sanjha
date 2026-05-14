import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { formatRouteError } from "@/lib/api-errors";

const CROP_NPK: Record<string, { n: number; p: number; k: number }> = {
  tomato: { n: 25, p: 15, k: 20 },
  onion: { n: 15, p: 20, k: 15 },
  chilli: { n: 20, p: 10, k: 15 },
  wheat: { n: 30, p: 20, k: 25 },
  legume: { n: -15, p: 5, k: 5 },
  fallow: { n: -10, p: -5, k: -5 },
};

export async function POST(req: Request) {
  try {
    const { farmId, cropPlanId: _cropPlanId, currentCrop } = await req.json();
    void _cropPlanId;

    const admin = getSupabaseAdmin();

  const { data: history } = await admin
    .from("rotation_history")
    .select("crop_name, soil_left")
    .eq("farm_id", farmId)
    .order("end_date", { ascending: false })
    .limit(3);

  const soilLeft = history?.[0]?.soil_left as { n: number; p: number; k: number } | undefined;
  const currentNPK = soilLeft ?? { n: 70, p: 70, k: 70 };

  let stressAccumulated = 0;
  for (const crop of history || []) {
    const profile = CROP_NPK[crop.crop_name as string] || { n: 15, p: 10, k: 10 };
    if (profile.n > 20 || profile.p > 15) stressAccumulated += 20;
  }

  const currentProfile = CROP_NPK[currentCrop as string] || { n: 15, p: 10, k: 10 };
  const projectedNPK = {
    n: Math.max(0, currentNPK.n - currentProfile.n),
    p: Math.max(0, currentNPK.p - currentProfile.p),
    k: Math.max(0, currentNPK.k - currentProfile.k),
  };

  const stressLevel = Math.min(
    100,
    stressAccumulated + (70 - (projectedNPK.n + projectedNPK.p + projectedNPK.k) / 3),
  );
  const recoveryScore = Math.max(0, 100 - stressLevel);

  const { data: healthRecord, error: insertErr } = await admin
    .from("soil_health")
    .insert({
      farm_id: farmId,
      recorded_date: new Date().toISOString().split("T")[0],
      n_estimate: Math.round(projectedNPK.n),
      p_estimate: Math.round(projectedNPK.p),
      k_estimate: Math.round(projectedNPK.k),
      stress_level: Math.round(stressLevel),
      recovery_score: Math.round(recoveryScore),
    })
    .select()
    .single();

  if (insertErr || !healthRecord) {
    return Response.json({ error: "Failed to save soil health", details: insertErr }, { status: 500 });
  }

  let recommendation = "";
  if (stressLevel > 60) {
    recommendation = "High soil stress. Consider fallow season or grow legumes (beans/peas) to restore nitrogen.";
  } else if (projectedNPK.n < 40) {
    recommendation = "Low nitrogen. Add organic compost or plant legumes next season.";
  } else if (projectedNPK.p < 40) {
    recommendation = "Low phosphorus. Add bone meal or rock phosphate.";
  } else {
    recommendation = "Soil health is good. Maintain with crop rotation and organic matter.";
  }

  return Response.json({
    npk: projectedNPK,
    stressLevel: Math.round(stressLevel),
    recoveryScore: Math.round(recoveryScore),
    recommendation,
    healthRecordId: healthRecord.id,
  });
  } catch (e) {
    console.error("[api/soil/health]", e);
    return Response.json(formatRouteError(e), { status: 500 });
  }
}
