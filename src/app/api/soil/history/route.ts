import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { formatRouteError } from "@/lib/api-errors";
import { formatZodError, soilHistoryQuerySchema } from "@/lib/validations/soil";
import { NextRequest } from "next/server";

/** GET /api/soil/history?farmId=uuid&limit=30 */
export async function GET(req: NextRequest) {
  try {
    const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = soilHistoryQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json(formatZodError(parsed.error), { status: 400 });
    }

    const { farmId, limit } = parsed.data;
    const admin = getSupabaseAdmin();

    const { data, error } = await admin
      .from("soil_analyses")
      .select("*")
      .eq("farm_id", farmId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return Response.json({ error: "Failed to load history", details: error }, { status: 500 });
    }

    return Response.json({ farmId, count: data?.length ?? 0, analyses: data ?? [] });
  } catch (e) {
    console.error("[api/soil/history]", e);
    return Response.json(formatRouteError(e), { status: 500 });
  }
}
