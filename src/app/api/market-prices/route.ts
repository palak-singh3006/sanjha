import { NextResponse } from "next/server";

function hashStringToInt(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function mulFromSeed(seedInt: number, min: number, max: number) {
  // Deterministic pseudo-random factor (no external deps).
  const x = Math.sin(seedInt * 0.0001) * 10000;
  const frac = x - Math.floor(x);
  return min + (max - min) * frac;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat") || "16.45");
  // Accept both `lng` and `lon` for convenience across clients.
  const lng = Number(searchParams.get("lng") || searchParams.get("lon") || "76.45");

  // "Real-time" for demo: vary by minute + location.
  const minuteBucket = Math.floor(Date.now() / 60000);
  const seed = hashStringToInt(`${lat.toFixed(2)}:${lng.toFixed(2)}:${minuteBucket}`);

  const bioEnergy = 4200 * mulFromSeed(seed + 11, 0.85, 1.22);
  const paper = 6800 * mulFromSeed(seed + 23, 0.82, 1.18);
  const fertilizer = 3500 * mulFromSeed(seed + 37, 0.78, 1.25);

  const confidence = mulFromSeed(seed + 99, 0.45, 0.8);

  return NextResponse.json({
    source: "simulated-realtime",
    updatedAt: Date.now(),
    confidence,
    prices: {
      bioEnergyINRPerTon: Math.round(bioEnergy),
      paperINRPerTon: Math.round(paper),
      fertilizerINRPerTon: Math.round(fertilizer),
    },
  });
}

