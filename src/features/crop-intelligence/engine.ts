/**
 * Community Crop Intelligence Analytics Engine
 * Pure functions — no DB access, no UI, no side effects.
 * All thresholds are configurable prototype heuristics, NOT official agricultural standards.
 */

import type {
  CropStat,
  CommunityInsight,
  ConcentrationLevel,
} from './types';
import {
  CONCENTRATION_THRESHOLDS,
  PRIVACY_MIN_FARMERS,
} from './types';

export interface RawCropPlanRow {
  crop_name: string;
  acreage: number;
  farmer_id: string;
}

/** Sanitise a single raw row — returns null if invalid */
export function sanitiseRow(row: unknown): RawCropPlanRow | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  const crop = typeof r.crop_name === 'string' ? r.crop_name.trim() : '';
  const acreage = Number(r.acreage);
  const farmer_id = typeof r.farmer_id === 'string' ? r.farmer_id.trim() : '';
  if (!crop || !Number.isFinite(acreage) || acreage <= 0 || !farmer_id) return null;
  return { crop_name: crop.toLowerCase(), acreage, farmer_id };
}

export function getConcentrationLevel(pct: number): ConcentrationLevel {
  if (pct >= CONCENTRATION_THRESHOLDS.high) return 'high';
  if (pct >= CONCENTRATION_THRESHOLDS.moderate) return 'moderate';
  return 'low';
}

export function buildRiskReasons(
  dominant: string | null,
  pct: number,
  level: ConcentrationLevel,
  farmerCount: number,
): string[] {
  if (!dominant || level === 'low') return [];
  const reasons: string[] = [];
  if (level === 'high') {
    reasons.push(
      `${pct.toFixed(1)}% of community acreage is allocated to ${dominant} — this is a high concentration (threshold: ${CONCENTRATION_THRESHOLDS.high}%).`,
    );
    reasons.push(
      'High crop concentration increases systemic risk (pest spread or simultaneous harvest). This indicates planting clustering, not confirmed oversupply, which also depends on district mandi demand.',
    );
  } else {
    reasons.push(
      `${pct.toFixed(1)}% of community acreage is allocated to ${dominant} — moderate concentration (threshold: ${CONCENTRATION_THRESHOLDS.moderate}%).`,
    );
    reasons.push(
      'Moderate concentration suggests emerging clustering around a single crop. Farmers should keep track of mandi arrival trends.',
    );
  }
  if (farmerCount < 10) {
    reasons.push(
      'Small community sample size (< 10 farmers reporting) — percentages may fluctuate sharply as more farmers log their seasonal plans.',
    );
  }
  return reasons;
}

export function buildRecommendations(
  dominant: string | null,
  level: ConcentrationLevel,
  cropStats: CropStat[],
): string[] {
  const recs: string[] = [];

  if (level === 'low') {
    recs.push(
      'Crop diversity across the village is well balanced. Continue regular seasonal planning to maintain soil fertility and market resilience.',
    );
    return recs;
  }

  if (dominant) {
    recs.push(
      `Heavy reliance on ${dominant}: evaluate forward contracts or aggregate collective transport with neighbouring farmers before peak harvest.`,
    );
    recs.push(
      'Consider staggered sowing windows (e.g. 7-14 day intervals) to prevent a glut at the local mandi during harvest time.',
    );
  }

  const minorCrops = cropStats.filter((c) => c.crop_name !== dominant && c.percentage > 0);
  if (minorCrops.length > 0) {
    const list = minorCrops.slice(0, 3).map((c) => `${c.crop_name} (${c.percentage}%)`).join(', ');
    recs.push(
      `Viable diversification observed in your cluster: ${list}. Farmers with suitable soil could consider intercropping or expanding these lines.`,
    );
  } else {
    recs.push(
      'Very few alternative crops are represented. Consult agricultural extension officers (KVK) for climate-resilient pulses or oilseeds suited to your soil.',
    );
  }

  recs.push(
    'Disclaimer: These heuristics reflect reported village acreage. They do not constitute guaranteed agronomic or price forecasts. Always verify soil moisture and local advisory before seed purchase.',
  );

  return recs;
}

/**
 * Main community analysis function.
 * Input: raw rows from DB (only crop_name, acreage, farmer_id — no personal identifiers).
 * Output: fully aggregated CommunityInsight.
 */
export function analyzeCommunity(
  rows: unknown[],
  village: string,
  season: string,
  options: { minPrivacyThreshold?: number } = {},
): CommunityInsight {
  const minPrivacyThreshold = options.minPrivacyThreshold ?? PRIVACY_MIN_FARMERS;

  // Sanitise and filter
  const valid = (Array.isArray(rows) ? rows : [])
    .map(sanitiseRow)
    .filter((r): r is RawCropPlanRow => r !== null);

  const participatingFarmers = new Set(valid.map((r) => r.farmer_id)).size;
  const meets_privacy_threshold = participatingFarmers >= minPrivacyThreshold;

  const totalAcreage = valid.reduce((s, r) => s + r.acreage, 0);

  if (!meets_privacy_threshold || valid.length === 0) {
    return {
      village,
      season,
      total_acreage: Math.round(totalAcreage * 100) / 100,
      participating_farmers: participatingFarmers,
      crop_stats: [],
      dominant_crop: null,
      concentration_level: 'low',
      concentration_pct: 0,
      risk_reasons: [],
      recommendations: [],
      meets_privacy_threshold,
      min_privacy_threshold: minPrivacyThreshold,
    };
  }

  // Aggregate per crop
  const cropMap = new Map<string, { acreage: number; farmers: Set<string> }>();
  for (const row of valid) {
    const existing = cropMap.get(row.crop_name) ?? { acreage: 0, farmers: new Set<string>() };
    existing.acreage += row.acreage;
    existing.farmers.add(row.farmer_id);
    cropMap.set(row.crop_name, existing);
  }

  const crop_stats: CropStat[] = Array.from(cropMap.entries())
    .map(([crop_name, { acreage, farmers }]) => ({
      crop_name,
      total_acreage: Math.round(acreage * 100) / 100,
      farmer_count: farmers.size,
      percentage: totalAcreage > 0 ? Math.round((acreage / totalAcreage) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.total_acreage - a.total_acreage);

  const dominant = crop_stats[0] ?? null;
  const dominant_crop = dominant?.crop_name ?? null;
  const concentration_pct = dominant?.percentage ?? 0;
  const concentration_level = getConcentrationLevel(concentration_pct);

  const risk_reasons = buildRiskReasons(
    dominant_crop,
    concentration_pct,
    concentration_level,
    participatingFarmers,
  );
  const recommendations = buildRecommendations(dominant_crop, concentration_level, crop_stats);

  return {
    village,
    season,
    total_acreage: Math.round(totalAcreage * 100) / 100,
    participating_farmers: participatingFarmers,
    crop_stats,
    dominant_crop,
    concentration_level,
    concentration_pct: Math.round(concentration_pct * 100) / 100,
    risk_reasons,
    recommendations,
    meets_privacy_threshold,
    min_privacy_threshold: minPrivacyThreshold,
  };
}
