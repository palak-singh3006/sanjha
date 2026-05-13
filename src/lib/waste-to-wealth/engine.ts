import type {
  CropKey,
  HarvestLogInput,
  HarvestResidueBreakdownKg,
  MarketPricesINRPerTon,
  PotentialSecondaryIncome,
  ResidueSplit,
  HarvestLogInput as HarvestLogInputT,
} from "./types";
import { residueModels } from "./residue-models";

function normalizeSplit(split: ResidueSplit): ResidueSplit {
  const s = split.stalk + split.husk + split.stubble;
  if (!Number.isFinite(s) || s <= 0) return { stalk: 0.4, husk: 0.3, stubble: 0.3 };
  return {
    stalk: split.stalk / s,
    husk: split.husk / s,
    stubble: split.stubble / s,
  };
}

export function computeResiduesKg(input: HarvestLogInputT): HarvestResidueBreakdownKg {
  const model = residueModels[input.crop] ?? residueModels.other;
  const split = normalizeSplit(model.split);
  const totalResidueKg = Math.max(0, input.harvestedKg * model.residueYieldRatio);
  const stalkKg = totalResidueKg * split.stalk;
  const huskKg = totalResidueKg * split.husk;
  const stubbleKg = totalResidueKg * split.stubble;
  return { stalkKg, huskKg, stubbleKg, totalResidueKg };
}

/**
 * Predict secondary income from residues using:
 * - crop-specific residue ratios
 * - market prices (INR/ton) for recovered streams
 */
export function computePotentialSecondaryIncome(args: {
  input: HarvestLogInput;
  residues: HarvestResidueBreakdownKg;
  prices: MarketPricesINRPerTon;
}): PotentialSecondaryIncome {
  const { residues, prices } = args;

  // Convert kg => tons (metric)
  const stalkTons = residues.stalkKg / 1000;
  const huskTons = residues.huskKg / 1000;
  const stubbleTons = residues.stubbleKg / 1000;

  const stalkINR = stalkTons * prices.bioEnergy;
  const huskINR = huskTons * prices.paper;
  const stubbleINR = stubbleTons * prices.fertilizer;

  // Eco-credit: emissions avoided vs waste burning (demo factors).
  // - We assume unmanaged residues would be burned (or landfilled) at an effective
  //   emission factor, and diversion reduces those emissions.
  const avoidedKgCO2ePerKgResidue = 1.45; // demo heuristic
  const ecoCreditSavedKgCO2e = residues.totalResidueKg * avoidedKgCO2ePerKgResidue;

  const potentialIncomeINR = stalkINR + huskINR + stubbleINR;
  const confidence = Math.max(0.1, Math.min(0.98, 0.35 + prices.confidence * 0.55));

  return {
    potentialIncomeINR,
    breakdownINR: { stalkINR, huskINR, stubbleINR },
    ecoCreditSavedKgCO2e,
    confidence,
  };
}

export function cropFromLabel(label: string): CropKey {
  const s = (label || "").toLowerCase();
  if (s.includes("tomato")) return "tomato";
  if (s.includes("onion")) return "onion";
  if (s.includes("chilli")) return "chilli";
  if (s.includes("rice")) return "rice";
  if (s.includes("wheat")) return "wheat";
  return "other";
}

