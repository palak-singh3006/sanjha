/**
 * SANJHA Community Crop Intelligence — Unit & Integration Test Suite
 * Executable directly with Node.js test runner:
 * node --experimental-strip-types --test src/features/crop-intelligence/__tests__/engine.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeCommunity,
  sanitiseRow,
  getConcentrationLevel,
  buildRiskReasons,
  buildRecommendations,
} from '../engine';
import {
  cropPlanBodySchema,
  communityQuerySchema,
  yieldPredictionSchema,
} from '../validations';
import {
  CONCENTRATION_THRESHOLDS,
  PRIVACY_MIN_FARMERS,
} from '../types';

test('1. sanitiseRow — handles valid, invalid, negative, and zero acreage', () => {
  // Valid row
  const r1 = sanitiseRow({ crop_name: ' Tomato ', acreage: '4.5', farmer_id: 'farmer-1' });
  assert.deepEqual(r1, { crop_name: 'tomato', acreage: 4.5, farmer_id: 'farmer-1' });

  // Zero acreage
  assert.equal(sanitiseRow({ crop_name: 'tomato', acreage: 0, farmer_id: 'farmer-1' }), null);

  // Negative acreage
  assert.equal(sanitiseRow({ crop_name: 'tomato', acreage: -5, farmer_id: 'farmer-1' }), null);

  // Missing crop name
  assert.equal(sanitiseRow({ crop_name: '   ', acreage: 2, farmer_id: 'farmer-1' }), null);

  // Missing farmer_id
  assert.equal(sanitiseRow({ crop_name: 'tomato', acreage: 2, farmer_id: '' }), null);

  // Non-numeric acreage
  assert.equal(sanitiseRow({ crop_name: 'tomato', acreage: 'abc', farmer_id: 'farmer-1' }), null);

  // Non-object input
  assert.equal(sanitiseRow(null), null);
  assert.equal(sanitiseRow(undefined), null);
  assert.equal(sanitiseRow('some string'), null);
});

test('2. getConcentrationLevel — validates all configurable thresholds', () => {
  // Low: below moderate threshold (30%)
  assert.equal(getConcentrationLevel(0), 'low');
  assert.equal(getConcentrationLevel(15.5), 'low');
  assert.equal(getConcentrationLevel(29.9), 'low');

  // Moderate: 30% to below 50%
  assert.equal(getConcentrationLevel(30.0), 'moderate');
  assert.equal(getConcentrationLevel(42.5), 'moderate');
  assert.equal(getConcentrationLevel(49.99), 'moderate');

  // High: 50% or above
  assert.equal(getConcentrationLevel(50.0), 'high');
  assert.equal(getConcentrationLevel(78.5), 'high');
  assert.equal(getConcentrationLevel(100.0), 'high');
});

test('3. Privacy threshold enforcement — less than 5 farmers hides distribution', () => {
  // Only 3 distinct farmers
  const sample3 = [
    { crop_name: 'tomato', acreage: 5, farmer_id: 'farmer-1' },
    { crop_name: 'onion', acreage: 3, farmer_id: 'farmer-2' },
    { crop_name: 'tomato', acreage: 2, farmer_id: 'farmer-3' },
  ];

  const result3 = analyzeCommunity(sample3, 'Hunasagi', 'kharif');
  assert.equal(result3.participating_farmers, 3);
  assert.equal(result3.meets_privacy_threshold, false);
  assert.equal(result3.crop_stats.length, 0, 'Crop stats must be empty when under privacy threshold');
  assert.equal(result3.dominant_crop, null);
  assert.equal(result3.total_acreage, 10);
});

test('4. Full community analysis — 5+ farmers with High Concentration (>= 50%)', () => {
  // 6 distinct farmers, tomato has 35 acres out of 50 acres (70% = High)
  const rows = [
    { crop_name: 'tomato', acreage: 10, farmer_id: 'f1' },
    { crop_name: 'tomato', acreage: 15, farmer_id: 'f2' },
    { crop_name: 'tomato', acreage: 10, farmer_id: 'f3' },
    { crop_name: 'onion', acreage: 8, farmer_id: 'f4' },
    { crop_name: 'chilli', acreage: 5, farmer_id: 'f5' },
    { crop_name: 'pulses', acreage: 2, farmer_id: 'f6' },
  ];

  const insight = analyzeCommunity(rows, 'Hunasagi', 'kharif');

  assert.equal(insight.meets_privacy_threshold, true);
  assert.equal(insight.participating_farmers, 6);
  assert.equal(insight.total_acreage, 50);
  assert.equal(insight.dominant_crop, 'tomato');
  assert.equal(insight.concentration_pct, 70);
  assert.equal(insight.concentration_level, 'high');

  // Check crop stats breakdown
  const tomatoStat = insight.crop_stats.find((c) => c.crop_name === 'tomato');
  assert.ok(tomatoStat);
  assert.equal(tomatoStat?.total_acreage, 35);
  assert.equal(tomatoStat?.percentage, 70);
  assert.equal(tomatoStat?.farmer_count, 3);

  // Verify explainable risk reasons & recommendations
  assert.ok(insight.risk_reasons.length > 0);
  assert.ok(insight.risk_reasons.some((r) => r.includes('high concentration')));
  assert.ok(insight.recommendations.some((r) => r.includes('staggered sowing')));
});

test('5. Moderate concentration — 30% to 49%', () => {
  const rows = [
    { crop_name: 'tomato', acreage: 4, farmer_id: 'f1' },
    { crop_name: 'onion', acreage: 2, farmer_id: 'f2' },
    { crop_name: 'chilli', acreage: 2, farmer_id: 'f3' },
    { crop_name: 'rice', acreage: 1, farmer_id: 'f4' },
    { crop_name: 'wheat', acreage: 1, farmer_id: 'f5' },
  ]; // Total 10 acres, tomato = 4 acres = 40%

  const insight = analyzeCommunity(rows, 'Shorapur', 'rabi');
  assert.equal(insight.dominant_crop, 'tomato');
  assert.equal(insight.concentration_pct, 40);
  assert.equal(insight.concentration_level, 'moderate');
});

test('6. Balanced / Low concentration — below 30%', () => {
  const rows = [
    { crop_name: 'tomato', acreage: 2, farmer_id: 'f1' },
    { crop_name: 'onion', acreage: 2, farmer_id: 'f2' },
    { crop_name: 'chilli', acreage: 2, farmer_id: 'f3' },
    { crop_name: 'rice', acreage: 2, farmer_id: 'f4' },
    { crop_name: 'wheat', acreage: 2, farmer_id: 'f5' },
  ]; // Total 10 acres, each crop = 20% (< 30%)

  const insight = analyzeCommunity(rows, 'Sindagi', 'kharif');
  assert.equal(insight.concentration_level, 'low');
  assert.ok(insight.recommendations.some((r) => r.includes('healthy') || r.includes('balanced')));
});

test('7. Multiple crops on same farm and multiple farms per farmer', () => {
  const rows = [
    { crop_name: 'tomato', acreage: 2, farmer_id: 'f1' },
    { crop_name: 'onion', acreage: 1, farmer_id: 'f1' }, // f1 growing 2 crops
    { crop_name: 'tomato', acreage: 3, farmer_id: 'f2' },
    { crop_name: 'chilli', acreage: 2, farmer_id: 'f3' },
    { crop_name: 'pulses', acreage: 2, farmer_id: 'f4' },
    { crop_name: 'wheat', acreage: 2, farmer_id: 'f5' },
  ];

  const insight = analyzeCommunity(rows, 'Hunasagi', 'kharif');
  assert.equal(insight.participating_farmers, 5, 'Distinct farmer count must be 5');
  assert.equal(insight.total_acreage, 12);
});

test('8. Zod Validation Schemas — Input form & API validation', () => {
  // Valid crop plan body
  const validBody = cropPlanBodySchema.safeParse({
    farm_id: '123e4567-e89b-12d3-a456-426614174000',
    village: 'Hunasagi',
    crop_name: 'Tomato',
    acreage: '3.5',
    season: 'kharif',
  });
  assert.ok(validBody.success);

  // Invalid UUID farm_id
  const invalidFarmId = cropPlanBodySchema.safeParse({
    farm_id: 'not-a-uuid',
    village: 'Hunasagi',
    crop_name: 'Tomato',
    acreage: 3.5,
    season: 'kharif',
  });
  assert.equal(invalidFarmId.success, false);

  // Negative acreage rejected
  const negAcreage = cropPlanBodySchema.safeParse({
    farm_id: '123e4567-e89b-12d3-a456-426614174000',
    village: 'Hunasagi',
    crop_name: 'Tomato',
    acreage: -2,
    season: 'kharif',
  });
  assert.equal(negAcreage.success, false);

  // Empty crop name rejected
  const emptyCrop = cropPlanBodySchema.safeParse({
    farm_id: '123e4567-e89b-12d3-a456-426614174000',
    village: 'Hunasagi',
    crop_name: '   ',
    acreage: 2,
    season: 'kharif',
  });
  assert.equal(emptyCrop.success, false);

  // Invalid season rejected
  const invalidSeason = cropPlanBodySchema.safeParse({
    farm_id: '123e4567-e89b-12d3-a456-426614174000',
    village: 'Hunasagi',
    crop_name: 'Tomato',
    acreage: 2,
    season: 'winter_magic',
  });
  assert.equal(invalidSeason.success, false);
});

test('10. Helper functions and threshold constants verification', () => {
  assert.equal(CONCENTRATION_THRESHOLDS.moderate, 30);
  assert.equal(CONCENTRATION_THRESHOLDS.high, 50);
  assert.equal(PRIVACY_MIN_FARMERS, 5);

  const reasons = buildRiskReasons('tomato', 65, 'high', 8);
  assert.ok(reasons.length >= 2);

  const recs = buildRecommendations('tomato', 'high', [
    { crop_name: 'tomato', total_acreage: 20, farmer_count: 5, percentage: 65 },
    { crop_name: 'onion', total_acreage: 10, farmer_count: 3, percentage: 35 },
  ]);
  assert.ok(recs.length >= 3);

  const queryCheck = communityQuerySchema.safeParse({ village: 'Hunasagi', season: 'kharif' });
  assert.ok(queryCheck.success);

  const yieldCheck = yieldPredictionSchema.safeParse({ crop: 'tomato', rainfall_mm: 500, temperature_c: 25 });
  assert.ok(yieldCheck.success);
});
