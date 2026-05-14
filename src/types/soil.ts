/**
 * Soil Recovery & Next Crop — shared types for API + engine.
 * Numeric scores 0–100 = depletion or stress intensity (higher = worse for soil health).
 */

export type FarmingMethod =
  | "organic"
  | "mixed"
  | "conventional"
  | "intensive_mono"
  | "waterlogged_practice";

export interface CropNpkProfile {
  crop_name: string;
  nitrogen_draw: number;
  phosphorus_draw: number;
  potassium_draw: number;
  stress_multiplier: number;
}

export interface SoilRecoveryProfile {
  soil_type: string;
  recovery_modifier: number;
  water_retention: number;
  organic_support: number;
}

/** Input to the heuristic engine (no IoT required). */
export interface SoilAnalyzeInput {
  farmId: string;
  previousCrop: string;
  soilType: string;
  farmingMethod: FarmingMethod;
  weeksSinceHarvest: number;
}

/** Deterministic engine output before DB / Gemini. */
export interface SoilEngineResult {
  nitrogen_score: number;
  phosphorus_score: number;
  potassium_score: number;
  stress_score: number;
  recovery_weeks: number;
  recommended_crop: string;
  compost_plan: string;
  green_manure_plan: string;
  rotation_rationale: string;
  /** Transparent intermediate values for debugging / UI “explain” panels */
  meta: {
    crop_profile_key: string;
    soil_profile_key: string;
    time_recovery_fraction: number;
    farming_stress_factor: number;
    waterlogging_stress_factor: number;
    avg_depletion: number;
  };
}

export interface SoilGeminiInsights {
  stress_explanation: string;
  sustainable_next_crops: string;
  intercropping_idea: string;
  recovery_strategies: string;
  low_cost_organic: string;
}

export interface SoilAnalyzeResponse extends SoilEngineResult {
  id: string;
  farm_id: string;
  previous_crop: string;
  soil_type: string;
  farming_method: string;
  weeks_since_harvest: number;
  gemini_advisory: string | null;
  created_at: string;
}
