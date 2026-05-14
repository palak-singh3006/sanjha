import { getSupabaseAdmin } from "@/lib/supabase-admin";

const CROP_REQUIREMENTS: Record<string, { n: number; p: number; k: number }> = {
  legume: { n: 20, p: 30, k: 30 },
  onion: { n: 40, p: 50, k: 40 },
  chilli: { n: 50, p: 40, k: 45 },
  tomato: { n: 60, p: 50, k: 55 },
  wheat: { n: 70, p: 60, k: 65 },
};

export async function POST(req: Request) {
  try {
    const { farmId } = await req.json();
    const admin = getSupabaseAdmin();

  const { data: health } = await admin
    .from("soil_health")
    .select("n_estimate, p_estimate, k_estimate")
    .eq("farm_id", farmId)
    .order("recorded_date", { ascending: false })
    .limit(1)
    .single();

  if (!health) {
    return Response.json({ error: "No soil health data. Run /api/soil/health first." }, { status: 400 });
  }

  const currentNPK = {
    n: health.n_estimate,
    p: health.p_estimate,
    k: health.k_estimate,
  };

  const scores = Object.entries(CROP_REQUIREMENTS).map(([crop, needs]) => {
    const nMatch = 100 - Math.abs(currentNPK.n - needs.n);
    const pMatch = 100 - Math.abs(currentNPK.p - needs.p);
    const kMatch = 100 - Math.abs(currentNPK.k - needs.k);
    const avgMatch = (nMatch + pMatch + kMatch) / 3;

    return { crop, score: Math.max(0, avgMatch) };
  });

  scores.sort((a, b) => b.score - a.score);

  return Response.json({
    currentNPK,
    recommendations: scores.slice(0, 3),
  });
  } catch (e) {
    console.error("[api/soil/next-crop]", e);
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
