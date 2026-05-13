export type CropKey = "tomato" | "onion" | "chilli" | "rice" | "wheat" | "other";
export type ResidueType = "stalk" | "husk" | "stubble";
export type IndustryType = "bio-energy" | "paper-mill" | "organic-fertilizer";

export interface ResidueSplit {
  stalk: number; // share of residue mass
  husk: number; // share of residue mass
  stubble: number; // share of residue mass
}

export interface ResidueModel {
  /**
   * Overall residue yield ratio relative to harvested edible weight.
   * Example: 1.4 => residue mass ~ 1.4 * harvestedKg.
   */
  residueYieldRatio: number;
  split: ResidueSplit;
}

export interface MarketPricesINRPerTon {
  bioEnergy: number;
  paper: number;
  fertilizer: number;
  updatedAt: number;
  source: string;
  confidence: number; // 0..1
}

export interface HarvestLogInput {
  crop: CropKey;
  harvestedKg: number;
  harvestedAt?: number;
  geo?: { lat: number; lng: number };
  farmLabel?: string;
}

export interface HarvestResidueBreakdownKg {
  stalkKg: number;
  huskKg: number;
  stubbleKg: number;
  totalResidueKg: number;
}

export interface PotentialSecondaryIncome {
  potentialIncomeINR: number;
  breakdownINR: {
    stalkINR: number;
    huskINR: number;
    stubbleINR: number;
  };
  ecoCreditSavedKgCO2e: number;
  confidence: number; // 0..1
}

export interface B2BMatch {
  industryType: IndustryType;
  industryName: string;
  distanceKm: number;
  suitabilityScore: number; // 0..100
  why: string[];
}

export type CollectionStage = "created" | "collected" | "packed" | "in-transit" | "delivered";

export interface CollectionStageEvent {
  stage: CollectionStage;
  at: number;
  note?: string;
}

export interface CollectionLot {
  lotId: string;
  createdAt: number;
  industryType: IndustryType;
  industryName: string;
  harvestLogIds: string[];
  residueBreakdownKg: HarvestResidueBreakdownKg;
  geo?: { lat: number; lng: number };
  qrPayload: string;
  stages: CollectionStageEvent[];
}

