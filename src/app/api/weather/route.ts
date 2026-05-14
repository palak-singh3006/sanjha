import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { formatRouteError } from "@/lib/api-errors";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const clusterId = req.nextUrl.searchParams.get("clusterId");
    const lat = req.nextUrl.searchParams.get("lat");
    const lng = req.nextUrl.searchParams.get("lng");

    if (!lat || !lng) {
      return Response.json({ error: "lat and lng required" }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];

    if (clusterId) {
      try {
        const admin = getSupabaseAdmin();
        const { data: cached } = await admin
          .from("weather_cache")
          .select("*")
          .eq("cluster_id", clusterId)
          .eq("date", today)
          .maybeSingle();

        if (cached) return Response.json(cached);
      } catch (e) {
        console.warn("[api/weather] cache read skipped:", e);
      }
    }

    const url =
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${lat}&longitude=${lng}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode` +
      `&timezone=Asia%2FKolkata&forecast_days=7`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data?.daily?.time?.length) {
      return Response.json(
        { error: "Weather API returned an unexpected response", detail: data },
        { status: 502 },
      );
    }

    const todayWeather = {
      cluster_id: clusterId,
      date: today,
      temp_max: data.daily.temperature_2m_max[0],
      rainfall_mm: data.daily.precipitation_sum[0],
      condition: data.daily.weathercode[0] > 60 ? "rainy" : "clear",
    };

    if (clusterId) {
      try {
        const admin = getSupabaseAdmin();
        await admin.from("weather_cache").insert(todayWeather);
      } catch (e) {
        console.warn("[api/weather] cache write skipped:", e);
      }
    }

    return Response.json({
      today: todayWeather,
      forecast: data.daily.time.map((date: string, i: number) => ({
        date,
        temp_max: data.daily.temperature_2m_max[i],
        rainfall_mm: data.daily.precipitation_sum[i],
      })),
    });
  } catch (e) {
    console.error("[api/weather]", e);
    return Response.json(formatRouteError(e), { status: 500 });
  }
}
