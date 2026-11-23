import { getSupabaseAdminOptional } from "@/lib/supabase-admin";
import { formatRouteError } from "@/lib/api-errors";
import { apiSuccess, apiError, handleValidationError, handleCatchError } from "@/lib/api-response";
import { mandiRecordSchema, batchMandiRecordsSchema } from "@/lib/validations/mandi";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const crop = req.nextUrl.searchParams.get("crop") || "Tomato";
    const state = req.nextUrl.searchParams.get("state") || "Karnataka";
    const today = new Date().toISOString().split("T")[0];

    try {
      const admin = getSupabaseAdminOptional();
      if (admin) {
        const { data: cached } = await admin
          .from("mandi_prices")
          .select("*")
          .ilike("crop_name", `%${crop}%`)
          .eq("state", state)
          .order("date", { ascending: false })
          .limit(15);

        if (cached && cached.length > 0) return Response.json(cached);
      }
    } catch (e) {
      console.warn("[api/mandi] cache read skipped:", e);
    }

    const apiKey = process.env.DATAGOV_API_KEY?.trim();
    if (!apiKey) {
      // Deterministic realistic demo prices
      const demoPrices = [
        {
          crop_name: crop,
          market_name: "Yadgir APMC",
          state,
          price_min: 3100,
          price_max: 3900,
          price_modal: 3500,
          date: today,
          source: "demo",
        },
        {
          crop_name: crop,
          market_name: "Raichur APMC",
          state,
          price_min: 3200,
          price_max: 4100,
          price_modal: 3650,
          date: today,
          source: "demo",
        },
        {
          crop_name: crop,
          market_name: "Yeshwanthpur Bangalore",
          state,
          price_min: 3800,
          price_max: 4800,
          price_modal: 4300,
          date: today,
          source: "demo",
        },
      ];
      return Response.json(demoPrices);
    }

    const url =
      `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070` +
      `?api-key=${apiKey}` +
      `&format=json&limit=10` +
      `&filters[commodity]=${encodeURIComponent(crop)}` +
      `&filters[state]=${encodeURIComponent(state)}`;

    const res = await fetch(url);
    const data = await res.json();

    const prices = (data.records || []).map((r: Record<string, string>) => ({
      crop_name: crop,
      market_name: r.market,
      state: r.state,
      price_min: parseFloat(r.min_price),
      price_max: parseFloat(r.max_price),
      price_modal: parseFloat(r.modal_price),
      date: today,
      source: "agmarknet",
    }));

    if (prices.length > 0) {
      try {
        const admin = getSupabaseAdminOptional();
        if (admin) {
          await admin.from("mandi_prices").insert(prices);
        }
      } catch (e) {
        console.warn("[api/mandi] cache write skipped:", e);
      }
    }

    return Response.json(prices);
  } catch (e) {
    console.error("[api/mandi]", e);
    return Response.json(formatRouteError(e), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const isArray = Array.isArray(json);

    let recordsToInsert;
    if (isArray) {
      const parsed = batchMandiRecordsSchema.safeParse(json);
      if (!parsed.success) return handleValidationError(parsed.error);
      recordsToInsert = parsed.data;
    } else {
      const parsed = mandiRecordSchema.safeParse(json);
      if (!parsed.success) return handleValidationError(parsed.error);
      recordsToInsert = [parsed.data];
    }

    const admin = getSupabaseAdminOptional();
    if (!admin) {
      return apiSuccess({ count: recordsToInsert.length, isDemo: true }, { status: 201 });
    }

    const { data, error } = await admin
      .from("mandi_prices")
      .insert(recordsToInsert)
      .select();

    if (error) {
      return apiError(`Failed to save mandi prices: ${error.message}`, { status: 500, details: error });
    }

    return apiSuccess({ inserted: data?.length ?? 0, records: data }, { status: 201 });
  } catch (e) {
    return handleCatchError(e, "api/mandi POST");
  }
}
