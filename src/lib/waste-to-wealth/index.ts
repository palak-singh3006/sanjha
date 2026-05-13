export type {
  CropKey,
  ResidueType,
  IndustryType,
  ResidueSplit,
  HarvestLogInput,
  HarvestResidueBreakdownKg,
  PotentialSecondaryIncome,
  B2BMatch,
  CollectionLot,
  CollectionStage,
  CollectionStageEvent,
} from "./types";

export { residueModels } from "./residue-models";
export { computeResiduesKg, computePotentialSecondaryIncome, cropFromLabel } from "./engine";
export { computeB2BMatches } from "./matching";
export { fallbackMarketPrices } from "./market-fallback";
export { fetchMarketPrices } from "./fetch-market-prices";
export { makeQrPayload, parseQrPayload } from "./qr";

