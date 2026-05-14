import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { formatRouteError, stringifySupabaseError } from "@/lib/api-errors";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const crop = req.nextUrl.searchParams.get("crop");
    const region = req.nextUrl.searchParams.get("region");
    const pest = req.nextUrl.searchParams.get("pest");
    const admin = getSupabaseAdmin();

    let query = admin.from("knowledge_posts").select("*").order("upvotes", { ascending: false }).limit(20);

    if (crop) query = query.eq("crop_tag", crop);
    if (region) query = query.eq("region_tag", region);
    if (pest) query = query.ilike("pest_tag", `%${pest}%`);

    const { data, error } = await query;
    if (error) {
      return Response.json({ error: stringifySupabaseError(error), details: error }, { status: 500 });
    }
    return Response.json(data || []);
  } catch (e) {
    console.error("[api/knowledge GET]", e);
    return Response.json(formatRouteError(e), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const admin = getSupabaseAdmin();

    const { data, error } = await admin
      .from("knowledge_posts")
      .insert({
        author_id: body.authorId,
        cluster_id: body.clusterId,
        crop_tag: body.cropTag,
        pest_tag: body.pestTag,
        region_tag: body.regionTag,
        title: body.title,
        body: body.body,
        language: body.lang || "kn",
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: stringifySupabaseError(error), details: error }, { status: 500 });
    }
    return Response.json(data);
  } catch (e) {
    console.error("[api/knowledge POST]", e);
    return Response.json(formatRouteError(e), { status: 500 });
  }
}
