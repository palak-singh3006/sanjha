import { getSupabaseAdminOptional } from "@/lib/supabase-admin";
import { formatRouteError, stringifySupabaseError } from "@/lib/api-errors";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const crop = req.nextUrl.searchParams.get("crop");
    const region = req.nextUrl.searchParams.get("region");
    const pest = req.nextUrl.searchParams.get("pest");
    const admin = getSupabaseAdminOptional();

    if (!admin) {
      const demoPosts = [
        {
          id: "k1000000-0000-0000-0000-000000000001",
          author_id: "a1000000-0000-0000-0000-000000000001",
          cluster_id: "HUN-01",
          crop_tag: "Tomato",
          pest_tag: "Tuta absoluta / Pinworm",
          region_tag: "Yadgir",
          title: "ಪೆರೋಮೋನ್ ಬಲೆ ಮತ್ತು ಬೇವಿನ ಎಣ್ಣೆ ಸಿಂಪಡಣೆ (Pheromone Traps for Tomato Pinworm)",
          body: "ಟೊಮೆಟೊ ಬೆಳೆಯಲ್ಲಿ ಪಿನ್‌ವರ್ಮ್ ನಿಯಂತ್ರಣಕ್ಕೆ ಎಕರೆಗೆ 12 ಪೆರೋಮೋನ್ ಬಲೆಗಳನ್ನು ಅಳವಡಿಸಿ. ಸಂಜೆ 5 ಲೀಟರ್ ನೀರಿಗೆ 10 ಮಿಲಿ ಬೇವಿನ ಎಣ್ಣೆ (10,000 ppm) ಮಿಶ್ರಣ ಮಾಡಿ ಸಿಂಪಡಿಸಿದಾಗ 85% ಕ್ಕೂ ಹೆಚ್ಚು ನಿಯಂತ್ರಣ ಕಂಡಿದೆ.",
          language: "kn",
          upvotes: 42,
          validated_count: 18,
          success_rate: 92,
        },
        {
          id: "k1000000-0000-0000-0000-000000000002",
          author_id: "a1000000-0000-0000-0000-000000000002",
          cluster_id: "HUN-01",
          crop_tag: "Onion",
          pest_tag: "Purple Blotch / ಕಪ್ಪು ಚುಕ್ಕೆ",
          region_tag: "Yadgir",
          title: "ಹನಿ ನೀರಾವರಿ ಮೂಲಕ ಶಿಲೀಂಧ್ರ ನಿಯಂತ್ರಣ (Managing Purple Blotch via Drip Scheduling)",
          body: "ಹೆಚ್ಚು ಆರ್ದ್ರತೆ ಇರುವಾಗ ಹನಿ ನೀರಾವರಿಯನ್ನು ಮುಂಜಾನೆ 6-8 ಗಂಟೆಯೊಳಗೆ ಮುಗಿಸಿ. ಎಲೆಗಳ ಮೇಲೆ ನೀರು ದೀರ್ಘಕಾಲ ನಿಲ್ಲದಂತೆ ನೋಡಿಕೊಂಡರೆ ಪರ್ಪಲ್ ಬ್ಲಾಚ್ ಹರಡುವಿಕೆ ತಡೆಯಬಹುದು.",
          language: "kn",
          upvotes: 35,
          validated_count: 14,
          success_rate: 88,
        },
      ];
      let filtered = demoPosts;
      if (crop) filtered = filtered.filter((p) => p.crop_tag.toLowerCase().includes(crop.toLowerCase()));
      if (region) filtered = filtered.filter((p) => p.region_tag.toLowerCase().includes(region.toLowerCase()));
      if (pest) filtered = filtered.filter((p) => p.pest_tag.toLowerCase().includes(pest.toLowerCase()));
      return Response.json(filtered);
    }

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
    const admin = getSupabaseAdminOptional();

    if (!admin) {
      return Response.json({
        id: crypto.randomUUID(),
        author_id: body.authorId || "a1000000-0000-0000-0000-000000000001",
        cluster_id: body.clusterId || "HUN-01",
        crop_tag: body.cropTag,
        pest_tag: body.pestTag,
        region_tag: body.regionTag,
        title: body.title,
        body: body.body,
        language: body.lang || "kn",
        upvotes: 0,
        validated_count: 0,
        success_rate: 85,
        isDemo: true,
      });
    }

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
