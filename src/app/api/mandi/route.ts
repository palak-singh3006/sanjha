import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { formatRouteError } from "@/lib/api-errors";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const crop = req.nextUrl.searchParams.get("crop") || "Tomato";
    const state = req.nextUrl.searchParams.get("state") || "Karnataka";
    const today = new Date().toISOString().split("T")[0];

    try {
      const admin = getSupabaseAdmin();
      const { data: cached } = await admin
        .from("mandi_prices")
        .select("*")
        .eq("crop_name", crop)
        .eq("state", state)
        .eq("date", today);

      if (cached && cached.length > 0) return Response.json(cached);
    } catch (e) {
      console.warn("[api/mandi] cache read skipped:", e);
    }

    const apiKey = process.env.DATAGOV_API_KEY?.trim();
    if (!apiKey) {
      return Response.json([
        {
          crop_name: crop,
          market_name: "Demo (set DATAGOV_API_KEY for live data.gov.in)",
          state,
          price_min: 4200,
          price_max: 5100,
          price_modal: 4650,
          date: today,
          source: "demo",
        },
      ]);
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
    }));

    if (prices.length > 0) {
      try {
        const admin = getSupabaseAdmin();
        await admin.from("mandi_prices").insert(prices);
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
