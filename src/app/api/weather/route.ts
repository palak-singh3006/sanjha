import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat") || "16.45";
  const lon = searchParams.get("lon") || "76.45";
  const key = process.env.OPENWEATHERMAP_API_KEY;

  if (!key) {
    return NextResponse.json({
      source: "demo",
      description: "Partly cloudy · humidity rising afternoon",
      tempC: 31,
      rainProbability: 62,
      lat,
      lon,
    });
  }

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`,
  );
  if (!res.ok) {
    return NextResponse.json(
      { error: "weather_upstream", status: res.status },
      { status: 502 },
    );
  }
  const data = (await res.json()) as {
    weather?: { description?: string }[];
    main?: { temp?: number; humidity?: number };
  };
  return NextResponse.json({
    source: "openweathermap",
    description: data.weather?.[0]?.description,
    tempC: data.main?.temp,
    humidity: data.main?.humidity,
    lat,
    lon,
  });
}
