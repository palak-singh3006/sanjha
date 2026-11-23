import { NextRequest } from "next/server";
import { getSupabaseAdminOptional } from "@/lib/supabase-admin";
import { apiSuccess, handleCatchError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state") || "Karnataka";
    const admin = getSupabaseAdminOptional();

    if (!admin) {
      return apiSuccess({
        state,
        date: new Date().toISOString().split("T")[0],
        commodities: [
          {
            cropName: "Tomato",
            minPrice: 3100,
            maxPrice: 4800,
            modalPriceAvg: 3816,
            marketCount: 3,
            markets: ["Yadgir APMC", "Raichur APMC", "Yeshwanthpur Bangalore"],
          },
          {
            cropName: "Onion",
            minPrice: 2400,
            maxPrice: 3400,
            modalPriceAvg: 2925,
            marketCount: 2,
            markets: ["Yadgir APMC", "Hubli APMC"],
          },
          {
            cropName: "Chilli",
            minPrice: 16500,
            maxPrice: 24000,
            modalPriceAvg: 19800,
            marketCount: 1,
            markets: ["Byadgi APMC"],
          },
          {
            cropName: "Wheat",
            minPrice: 2800,
            maxPrice: 3400,
            modalPriceAvg: 3100,
            marketCount: 1,
            markets: ["Bijapur APMC"],
          },
        ],
      });
    }

    const { data } = await admin
      .from("mandi_prices")
      .select("crop_name, market_name, price_min, price_max, price_modal, date")
      .eq("state", state)
      .order("date", { ascending: false })
      .limit(100);

    const map = new Map<string, {
      min: number;
      max: number;
      modals: number[];
      markets: Set<string>;
    }>();

    (data || []).forEach((row: any) => {
      const key = row.crop_name;
      const current = map.get(key) || {
        min: Infinity,
        max: -Infinity,
        modals: [],
        markets: new Set<string>(),
      };
      if (row.price_min < current.min) current.min = Number(row.price_min);
      if (row.price_max > current.max) current.max = Number(row.price_max);
      current.modals.push(Number(row.price_modal));
      current.markets.add(row.market_name);
      map.set(key, current);
    });

    const commodities = Array.from(map.entries()).map(([cropName, val]) => ({
      cropName,
      minPrice: val.min,
      maxPrice: val.max,
      modalPriceAvg: Math.round(val.modals.reduce((a, b) => a + b, 0) / (val.modals.length || 1)),
      marketCount: val.markets.size,
      markets: Array.from(val.markets),
    }));

    return apiSuccess({
      state,
      date: new Date().toISOString().split("T")[0],
      commodities,
    });
  } catch (e) {
    return handleCatchError(e, "api/mandi/summary GET");
  }
}
