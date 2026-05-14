import { formatRouteError } from "@/lib/api-errors";
import { formatZodError, soilRecommendationsQuerySchema } from "@/lib/validations/soil";
import { staticRecommendationBlurb } from "@/lib/soil/soil-engine";
import { supplementStaticRecommendation } from "@/services/soil-gemini";
import { NextRequest } from "next/server";

/** GET /api/soil/recommendations?crop=tomato&soil=loamy&useAi=true */
export async function GET(req: NextRequest) {
  try {
    const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = soilRecommendationsQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json(formatZodError(parsed.error), { status: 400 });
    }

    const { crop, soil, useAi } = parsed.data;
    const staticBlock = staticRecommendationBlurb(crop, soil);
    const staticSummary = [staticBlock.headline, ...staticBlock.bullets].join(" ");

    let gemini_supplement: string | null = null;
    if (useAi) {
      gemini_supplement = await supplementStaticRecommendation(crop, soil, staticSummary);
    }

    return Response.json({
      crop,
      soil,
      static: staticBlock,
      gemini_supplement,
    });
  } catch (e) {
    console.error("[api/soil/recommendations]", e);
    return Response.json(formatRouteError(e), { status: 500 });
  }
}
