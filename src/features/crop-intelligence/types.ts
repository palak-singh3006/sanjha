export interface CropPlan {
  id: string;
  farmer_id: string;
  farm_id: string;
  village: string;
  crop_name: string;
  acreage: number;
  season: string;
  sowing_period?: string | null;
  harvest_period?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type CropPlanInsert = Omit<CropPlan, 'id' | 'created_at' | 'updated_at'>;
export type CropPlanUpdate = Partial<Omit<CropPlan, 'id' | 'farmer_id' | 'created_at' | 'updated_at'>>;

export interface FarmOption {
  id: string;
  name: string;
  area_acres: number | null;
  acres?: number | null;
  soil_type: string | null;
  cluster_id?: string | null;
}

export interface CropStat {
  crop_name: string;
  total_acreage: number;
  farmer_count: number;
  percentage: number;
}

export type ConcentrationLevel = 'low' | 'moderate' | 'high';

export interface CommunityInsight {
  village: string;
  season: string;
  total_acreage: number;
  participating_farmers: number;
  crop_stats: CropStat[];
  dominant_crop: string | null;
  concentration_level: ConcentrationLevel;
  concentration_pct: number;
  risk_reasons: string[];
  recommendations: string[];
  meets_privacy_threshold: boolean;
  min_privacy_threshold: number;
}

export const SEASONS = ['kharif', 'rabi', 'zaid', 'annual'] as const;
export type Season = typeof SEASONS[number];

export const SEASON_LABELS: Record<Season, string> = {
  kharif: 'Kharif (Monsoon / Autumn)',
  rabi: 'Rabi (Winter / Spring)',
  zaid: 'Zaid (Summer)',
  annual: 'Annual / Perennial',
};

export const CONCENTRATION_THRESHOLDS = {
  moderate: 30,
  high: 50,
} as const;

export const PRIVACY_MIN_FARMERS = 5;

export interface YieldPredictionRequest {
  crop: string;
  rainfall_mm: number;
  temperature_c: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  soil_type?: string;
  season?: string;
}

export interface YieldPredictionResult {
  crop: string;
  predicted_yield_kg_per_acre: number;
  model_type?: string;
  dataset_type?: string;
  unit: string;
  disclaimer: string;
  features_used?: Record<string, unknown>;
  source?: string;
}
