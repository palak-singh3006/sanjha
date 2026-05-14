/**
 * Soil heuristic engine — nutrient depletion, stress, recovery timeline, rotation.
 * All formulas are transparent heuristics (not agronomic lab models). Tune with experts.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CropNpkProfile,
  FarmingMethod,
  SoilAnalyzeInput,
  SoilEngineResult,
  SoilRecoveryProfile,
} from "@/types/soil";

const DEFAULT_CROPS: Record<string, CropNpkProfile> = {
  tomato: {
    crop_name: "tomato",
    nitrogen_draw: 72,
    phosphorus_draw: 48,
    potassium_draw: 78,
    stress_multiplier: 1.05,
  },
  onion: {
    crop_name: "onion",
    nitrogen_draw: 55,
    phosphorus_draw: 42,
    potassium_draw: 50,
    stress_multiplier: 1,
  },
  paddy: {
    crop_name: "paddy",
    nitrogen_draw: 62,
    phosphorus_draw: 38,
    potassium_draw: 45,
    stress_multiplier: 1.18,
  },
  rice: {
    crop_name: "rice",
    nitrogen_draw: 62,
    phosphorus_draw: 38,
    potassium_draw: 45,
    stress_multiplier: 1.18,
  },
  wheat: {
    crop_name: "wheat",
    nitrogen_draw: 58,
    phosphorus_draw: 52,
    potassium_draw: 48,
    stress_multiplier: 0.95,
  },
  maize: {
    crop_name: "maize",
    nitrogen_draw: 68,
    phosphorus_draw: 45,
    potassium_draw: 52,
    stress_multiplier: 1.02,
  },
  potato: {
    crop_name: "potato",
    nitrogen_draw: 65,
    phosphorus_draw: 55,
    potassium_draw: 70,
    stress_multiplier: 1.08,
  },
  chilli: {
    crop_name: "chilli",
    nitrogen_draw: 70,
    phosphorus_draw: 46,
    potassium_draw: 65,
    stress_multiplier: 1.06,
  },
  pulses: {
    crop_name: "pulses",
    nitrogen_draw: 35,
    phosphorus_draw: 38,
    potassium_draw: 32,
    stress_multiplier: 0.88,
  },
  legume: {
    crop_name: "legume",
    nitrogen_draw: 35,
    phosphorus_draw: 38,
    potassium_draw: 32,
    stress_multiplier: 0.88,
  },
  cotton: {
    crop_name: "cotton",
    nitrogen_draw: 75,
    phosphorus_draw: 50,
    potassium_draw: 72,
    stress_multiplier: 1.12,
  },
  sugarcane: {
    crop_name: "sugarcane",
    nitrogen_draw: 80,
    phosphorus_draw: 45,
    potassium_draw: 85,
    stress_multiplier: 1.15,
  },
  sunflower: {
    crop_name: "sunflower",
    nitrogen_draw: 58,
    phosphorus_draw: 48,
    potassium_draw: 55,
    stress_multiplier: 1.0,
  },
  mustard: {
    crop_name: "mustard",
    nitrogen_draw: 52,
    phosphorus_draw: 44,
    potassium_draw: 48,
    stress_multiplier: 0.98,
  },
  sorghum: {
    crop_name: "sorghum",
    nitrogen_draw: 55,
    phosphorus_draw: 42,
    potassium_draw: 48,
    stress_multiplier: 0.96,
  },
  vegetables: {
    crop_name: "vegetables",
    nitrogen_draw: 62,
    phosphorus_draw: 46,
    potassium_draw: 58,
    stress_multiplier: 1.02,
  },
  default: {
    crop_name: "default",
    nitrogen_draw: 60,
    phosphorus_draw: 45,
    potassium_draw: 55,
    stress_multiplier: 1,
  },
};

const DEFAULT_SOILS: Record<string, SoilRecoveryProfile> = {
  loamy: {
    soil_type: "loamy",
    recovery_modifier: 0.92,
    water_retention: 0.55,
    organic_support: 0.72,
  },
  clay: {
    soil_type: "clay",
    recovery_modifier: 1.12,
    water_retention: 0.78,
    organic_support: 0.65,
  },
  sandy: {
    soil_type: "sandy",
    recovery_modifier: 1.05,
    water_retention: 0.28,
    organic_support: 0.45,
  },
  red: {
    soil_type: "red",
    recovery_modifier: 1.0,
    water_retention: 0.42,
    organic_support: 0.58,
  },
  black: {
    soil_type: "black",
    recovery_modifier: 0.88,
    water_retention: 0.62,
    organic_support: 0.8,
  },
  default: {
    soil_type: "default",
    recovery_modifier: 1.0,
    water_retention: 0.5,
    organic_support: 0.55,
  },
};

/** Next-crop suggestions: avoid repeating heavy feeders where possible. */
const ROTATION: Record<string, { primary: string; alternates: string[]; reason: string }> = {
  tomato: {
    primary: "pulses",
    alternates: ["onion", "wheat", "green gram"],
    reason: "Legumes fix nitrogen after a heavy K/N crop like tomato.",
  },
  onion: {
    primary: "wheat",
    alternates: ["tomato", "maize"],
    reason: "Cereal or moderate feeder after bulb phase.",
  },
  paddy: {
    primary: "pulses",
    alternates: ["wheat", "sunflower"],
    reason: "Break anaerobic/waterlogged cycle; legumes improve organic matter.",
  },
  rice: {
    primary: "pulses",
    alternates: ["wheat", "sunflower"],
    reason: "Same rotation logic as paddy.",
  },
  wheat: {
    primary: "maize",
    alternates: ["tomato", "cotton"],
    reason: "Alternate cereal with a different rooting depth / residue type.",
  },
  maize: {
    primary: "pulses",
    alternates: ["wheat", "vegetables"],
    reason: "Restore nitrogen after maize.",
  },
  potato: {
    primary: "wheat",
    alternates: ["pulses", "onion"],
    reason: "Avoid immediate solanaceous follow (tomato/potato back-to-back).",
  },
  chilli: {
    primary: "pulses",
    alternates: ["onion", "wheat"],
    reason: "Legume break after high-demand spice crop.",
  },
  cotton: {
    primary: "pulses",
    alternates: ["wheat", "sorghum"],
    reason: "Heavy feeder — legume or deep-root break.",
  },
  sugarcane: {
    primary: "pulses",
    alternates: ["wheat", "mustard"],
    reason: "Very heavy draw — prioritize nitrogen-building crop.",
  },
  default: {
    primary: "pulses",
    alternates: ["wheat", "mixed vegetables"],
    reason: "General safe rotation toward nitrogen fixation and diversity.",
  },
};

function normalizeCropKey(raw: string): string {
  const k = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (DEFAULT_CROPS[k]) return k;
  const lower = raw.toLowerCase();
  if (/\b(pulse|legume|dal|gram)\b/.test(lower)) {
    return "pulses";
  }
  return "default";
}

function normalizeSoilKey(raw: string): string {
  const k = raw.trim().toLowerCase();
  return DEFAULT_SOILS[k] ? k : "default";
}

async function fetchCropProfile(
  admin: SupabaseClient,
  cropKey: string
): Promise<CropNpkProfile> {
  const { data } = await admin
    .from("crop_npk_profiles")
    .select("*")
    .ilike("crop_name", cropKey)
    .maybeSingle();

  if (data) {
    return data as CropNpkProfile;
  }
  return DEFAULT_CROPS[cropKey] ?? DEFAULT_CROPS.default;
}

async function fetchSoilProfile(
  admin: SupabaseClient,
  soilKey: string
): Promise<SoilRecoveryProfile> {
  const { data } = await admin
    .from("soil_recovery_profiles")
    .select("*")
    .ilike("soil_type", soilKey)
    .maybeSingle();

  if (data) {
    return data as SoilRecoveryProfile;
  }
  return DEFAULT_SOILS[soilKey] ?? DEFAULT_SOILS.default;
}

/**
 * Time-based partial recovery: soil does not stay at “day zero” depletion forever.
 * Linear cap: up to ~38% reduction in *displayed* depletion after ~26 weeks with no new crop.
 * (Transparent simplification — replace with field trials if available.)
 */
function timeRecoveryFraction(weeksSinceHarvest: number): number {
  const capWeeks = 26;
  const maxReduction = 0.38;
  return Math.min(weeksSinceHarvest / capWeeks, 1) * maxReduction;
}

function farmingStressFactor(method: FarmingMethod): number {
  switch (method) {
    case "organic":
      return 0.82;
    case "mixed":
      return 0.95;
    case "conventional":
      return 1.0;
    case "intensive_mono":
      return 1.14;
    case "waterlogged_practice":
      return 1.12;
    default:
      return 1;
  }
}

/**
 * Waterlogging stress stacks when paddy/rice + high retention soil + waterlogged practice.
 */
function waterloggingStressFactor(
  cropKey: string,
  soil: SoilRecoveryProfile,
  method: FarmingMethod
): number {
  const riceLike = cropKey === "paddy" || cropKey === "rice";
  let f = 1;
  if (riceLike && soil.water_retention >= 0.65) {
    f *= 1.08;
  }
  if (riceLike && method === "waterlogged_practice") {
    f *= 1.12;
  }
  return f;
}

function organicRecoveryBoost(method: FarmingMethod, soil: SoilRecoveryProfile): number {
  if (method !== "organic") return 1;
  return 0.88 + soil.organic_support * 0.08;
}

function buildCompostPlan(
  soil: SoilRecoveryProfile,
  avgDepletion: number,
  method: FarmingMethod
): string {
  const tonsHint =
    avgDepletion > 70 ? "4–6 t/ac" : avgDepletion > 45 ? "2–4 t/ac" : "1–2 t/ac";
  const base =
    method === "organic"
      ? "Continue farm compost + crop residue mulch."
      : "Start composting crop residue; split application pre-sowing and at knee-high stage.";
  return `${base} Target well-decomposed compost ~${tonsHint} equivalent (local measure), mixed with topsoil in furrows. Soil organic support index ${soil.organic_support.toFixed(
    2
  )} — ${soil.soil_type} benefits from gradual organic build-up.`;
}

function buildGreenManurePlan(cropKey: string, soil: SoilRecoveryProfile): string {
  const legume =
    soil.water_retention > 0.6
      ? "Sesbania / sunn hemp (tolerate wetter cycles)"
      : "Dhaincha / sunn hemp / mung as short-duration green manure";
  const avoid =
    cropKey === "paddy" || cropKey === "rice"
      ? "Ensure drainage before incorporating to reduce anaerobic stress."
      : "Incorporate at flowering before pod set for maximum biomass-N.";
  return `${legume}. ${avoid} Till lightly to keep soil structure on ${soil.soil_type}.`;
}

export async function runSoilAnalysis(
  admin: SupabaseClient,
  input: SoilAnalyzeInput
): Promise<SoilEngineResult> {
  const cropKey = normalizeCropKey(input.previousCrop);
  const soilKey = normalizeSoilKey(input.soilType);

  const crop = await fetchCropProfile(admin, cropKey);
  const soil = await fetchSoilProfile(admin, soilKey);

  const tRec = timeRecoveryFraction(input.weeksSinceHarvest);
  const organicBoost = organicRecoveryBoost(input.farmingMethod, soil);

  /**
   * Depletion scores (0–100): raw draw from crop profile, reduced by time recovery
   * and slightly helped if organic farming (faster biological rebound assumption).
   */
  const scale = (raw: number) =>
    Math.min(
      100,
      Math.max(0, raw * (1 - tRec) * (input.farmingMethod === "organic" ? 0.94 : 1))
    );

  const nitrogen_score = scale(crop.nitrogen_draw);
  const phosphorus_score = scale(crop.phosphorus_draw);
  const potassium_score = scale(crop.potassium_draw);

  const avgDepletion = (nitrogen_score + phosphorus_score + potassium_score) / 3;

  const imbalance =
    Math.max(nitrogen_score, phosphorus_score, potassium_score) -
    Math.min(nitrogen_score, phosphorus_score, potassium_score);

  const farmStress = farmingStressFactor(input.farmingMethod);
  const wlStress = waterloggingStressFactor(cropKey, soil, input.farmingMethod);

  /**
   * Stress 0–100: average depletion contributes ~60%; imbalance up to +15;
   * crop stress_multiplier; farming + waterlogging multipliers (capped).
   */
  let stress_score =
    avgDepletion * 0.62 +
    Math.min(imbalance * 0.22, 15) +
    (crop.stress_multiplier - 1) * 18;
  stress_score *= farmStress * wlStress;
  stress_score = Math.min(100, Math.max(0, stress_score));

  /**
   * Recovery weeks: baseline rises with stress and soil recovery_modifier;
   * organic + high organic_support shortens timeline.
   */
  const baseWeeks = 10;
  const recovery_weeks = Math.min(
    52,
    Math.max(
      4,
      baseWeeks *
        soil.recovery_modifier *
        (0.55 + stress_score / 130) *
        (1 / organicBoost)
    )
  );

  const rot = ROTATION[cropKey] ?? ROTATION.default;
  const recommended_crop = rot.primary;
  const rotation_rationale = rot.reason;

  const compost_plan = buildCompostPlan(soil, avgDepletion, input.farmingMethod);
  const green_manure_plan = buildGreenManurePlan(cropKey, soil);

  return {
    nitrogen_score: Math.round(nitrogen_score * 10) / 10,
    phosphorus_score: Math.round(phosphorus_score * 10) / 10,
    potassium_score: Math.round(potassium_score * 10) / 10,
    stress_score: Math.round(stress_score * 10) / 10,
    recovery_weeks: Math.round(recovery_weeks * 10) / 10,
    recommended_crop,
    compost_plan,
    green_manure_plan,
    rotation_rationale,
    meta: {
      crop_profile_key: cropKey,
      soil_profile_key: soilKey,
      time_recovery_fraction: Math.round(tRec * 1000) / 1000,
      farming_stress_factor: Math.round(farmStress * 1000) / 1000,
      waterlogging_stress_factor: Math.round(wlStress * 1000) / 1000,
      avg_depletion: Math.round(avgDepletion * 10) / 10,
    },
  };
}

export function staticRecommendationBlurb(
  cropKey: string,
  soilKey: string
): { headline: string; bullets: string[] } {
  const rot = ROTATION[normalizeCropKey(cropKey)] ?? ROTATION.default;
  const soil = DEFAULT_SOILS[normalizeSoilKey(soilKey)] ?? DEFAULT_SOILS.default;
  return {
    headline: `After ${cropKey} on ${soilKey} soil, favour ${rot.primary} next.`,
    bullets: [
      rot.reason,
      `Alternates: ${rot.alternates.join(", ")}.`,
      `Soil modifier: recovery_modifier=${soil.recovery_modifier}, water_retention=${soil.water_retention}.`,
      "IoT sensors (future) can replace heuristic scores row-by-row in soil_sensor_readings.",
    ],
  };
}
