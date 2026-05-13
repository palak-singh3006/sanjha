/** Heuristic NPK depletion estimates — demo logic, future-ready for IoT. */

export type SoilType = "clay" | "loam" | "sandy" | "black";
export type FarmMethod = "organic" | "mixed" | "conventional";

export interface SoilInputs {
  previousCrop: string;
  soilType: SoilType;
  method: FarmMethod;
  weeksSinceHarvest: number;
}

export interface SoilReport {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  stress: number;
  recoveryWeeks: number;
  compostSuggestion: string;
  greenManure: string;
  legume: string;
  shortRecoveryCrops: string[];
  nextCrop: string;
  profitBand: string;
}

const cropDemand: Record<string, { n: number; p: number; k: number }> = {
  tomato: { n: 0.72, p: 0.55, k: 0.68 },
  onion: { n: 0.5, p: 0.45, k: 0.55 },
  chilli: { n: 0.65, p: 0.5, k: 0.7 },
  rice: { n: 0.85, p: 0.45, k: 0.55 },
  wheat: { n: 0.55, p: 0.5, k: 0.45 },
  default: { n: 0.6, p: 0.5, k: 0.55 },
};

function clamp(n: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, n));
}

export function estimateSoilReport(input: SoilInputs): SoilReport {
  const key = input.previousCrop.toLowerCase();
  const base = cropDemand[key] ?? cropDemand.default;
  const soilMul =
    input.soilType === "sandy" ? 1.15 : input.soilType === "clay" ? 0.92 : 1;
  const methodMul =
    input.method === "organic" ? 0.88 : input.method === "conventional" ? 1.08 : 1;
  const weeks = Math.max(1, input.weeksSinceHarvest);
  const naturalRecovery = Math.min(35, weeks * 2.2);

  const nitrogen = clamp(100 * base.n * soilMul * methodMul - naturalRecovery);
  const phosphorus = clamp(100 * base.p * soilMul * methodMul - naturalRecovery * 0.7);
  const potassium = clamp(100 * base.k * soilMul * methodMul - naturalRecovery * 0.8);
  const stress = clamp((nitrogen + phosphorus + potassium) / 3.2 + (weeks < 3 ? 12 : 0));

  const recoveryWeeks = Math.max(4, Math.round(14 - weeks * 0.35));

  const shortRecoveryCrops = ["Moong Dal", "Cowpea", "Sunhemp"];

  let nextCrop = "Cowpea → Onion rotation";
  if (key.includes("tomato")) nextCrop = "Legume cover → Chilli (contracted demand up)";
  if (key.includes("rice")) nextCrop = "Moong Dal → Wheat (N fix + premium wheat)";

  return {
    nitrogen,
    phosphorus,
    potassium,
    stress,
    recoveryWeeks,
    compostSuggestion: "5–7 t/ac FYM or 2 t vermicompost before next sowing",
    greenManure: "Dhaincha / Sunhemp 45-day bury before transplant",
    legume: "Moong intercrop on field borders to fix N",
    shortRecoveryCrops,
    nextCrop,
    profitBand: "₹18k–₹32k / acre uplift vs mono-cropping (cluster pricing)",
  };
}
