import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { formatRouteError } from "@/lib/api-errors";
import { formatZodError, soilSensorIngestBodySchema } from "@/lib/validations/soil";

/** POST /api/soil/sensor-ingest */
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = soilSensorIngestBodySchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(formatZodError(parsed.error), { status: 400 });
    }

    const { farmId, nitrogen, phosphorus, potassium, moisture, ph } = parsed.data;
    const admin = getSupabaseAdmin();

    const { data: farm } = await admin.from("farms").select("id").eq("id", farmId).maybeSingle();

    if (!farm) {
      return Response.json({ error: "farmId not found", farmId }, { status: 404 });
    }

    const { data, error } = await admin
      .from("soil_sensor_readings")
      .insert({
        farm_id: farmId,
        nitrogen: nitrogen ?? null,
        phosphorus: phosphorus ?? null,
        potassium: potassium ?? null,
        moisture: moisture ?? null,
        ph: ph ?? null,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: "Failed to store sensor reading", details: error }, { status: 500 });
    }

    return Response.json({
      ok: true,
      reading: data,
      note: "Raw ingest only — fuse into soil_analyses in a future worker/cron.",
    });
  } catch (e) {
    console.error("[api/soil/sensor-ingest]", e);
    return Response.json(formatRouteError(e), { status: 500 });
  }
}
