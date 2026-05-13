import type { MarketPricesINRPerTon } from "./types";
import { fallbackMarketPrices } from "./market-fallback";

export async function fetchMarketPrices(args: { lat: number; lng: number }): Promise<MarketPricesINRPerTon> {
  try {
    const res = await fetch(`/api/market-prices?lat=${encodeURIComponent(args.lat)}&lon=${encodeURIComponent(args.lng)}`);
    if (!res.ok) throw new Error(`market-prices status ${res.status}`);
    const data = (await res.json()) as {
      source?: string;
      updatedAt?: number;
      confidence?: number;
      prices?: {
        bioEnergyINRPerTon?: number;
        paperINRPerTon?: number;
        fertilizerINRPerTon?: number;
      };
    };

    const now = Date.now();
    return {
      bioEnergy: Number(data.prices?.bioEnergyINRPerTon ?? fallbackMarketPrices.bioEnergy),
      paper: Number(data.prices?.paperINRPerTon ?? fallbackMarketPrices.paper),
      fertilizer: Number(data.prices?.fertilizerINRPerTon ?? fallbackMarketPrices.fertilizer),
      updatedAt: data.updatedAt ?? now,
      source: data.source ?? fallbackMarketPrices.source,
      confidence: Number(data.confidence ?? fallbackMarketPrices.confidence),
    };
  } catch {
    return fallbackMarketPrices;
  }
}

