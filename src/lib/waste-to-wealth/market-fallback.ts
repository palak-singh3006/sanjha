import type { MarketPricesINRPerTon } from "./types";

// INR / ton fallback (demo). Real-time comes from `/api/market-prices`.
export const fallbackMarketPrices: MarketPricesINRPerTon = {
  bioEnergy: 4200,
  paper: 6800,
  fertilizer: 3500,
  updatedAt: Date.now(),
  source: "fallback",
  confidence: 0.55,
};

