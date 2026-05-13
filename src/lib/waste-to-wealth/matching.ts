import type { B2BMatch, HarvestResidueBreakdownKg, IndustryType } from "./types";
import { industries } from "./industries";
import { haversineKm } from "./distance";

function clamp(n: number, a = 0, b = 1) {
  return Math.min(b, Math.max(a, n));
}

function residueTonsForIndustry(kind: IndustryType, residues: HarvestResidueBreakdownKg) {
  if (kind === "bio-energy") return residues.stalkKg / 1000;
  if (kind === "paper-mill") return residues.huskKg / 1000;
  return residues.stubbleKg / 1000;
}

function residueKgForIndustry(kind: IndustryType, residues: HarvestResidueBreakdownKg) {
  if (kind === "bio-energy") return residues.stalkKg;
  if (kind === "paper-mill") return residues.huskKg;
  return residues.stubbleKg;
}

export function computeB2BMatches(args: {
  residues: HarvestResidueBreakdownKg;
  geo?: { lat: number; lng: number };
}): B2BMatch[] {
  const { residues, geo } = args;
  const origin = geo ?? { lat: 16.45, lng: 76.45 };

  return industries
    .map((ind) => {
      const distanceKm = haversineKm(origin, { lat: ind.lat, lng: ind.lng });
      const residueTons = residueTonsForIndustry(ind.industryType, residues);
      const residueKg = residueKgForIndustry(ind.industryType, residues);

      // Suitability: handles residue + meets min tonnage
      const handlesSomething = ind.handles.reduce((acc, k) => {
        if (k === "stalk") return acc + residues.stalkKg;
        if (k === "husk") return acc + residues.huskKg;
        return acc + residues.stubbleKg;
      }, 0);
      const handlesShare = Math.min(1, handlesSomething / Math.max(1, residueKg));

      const meetsThreshold = clamp(residueTons / Math.max(0.0001, ind.minResidueTons));
      const proximityScore = 1 - clamp(distanceKm / 20); // 0..1 within 20km

      // Weighted score; designed for demo UX.
      const preference = ind.preference ?? { stalk: 0.33, husk: 0.33, stubble: 0.34 };
      const prefResidueBoost =
        (ind.industryType === "bio-energy" ? preference.stalk : 0) +
        (ind.industryType === "paper-mill" ? preference.husk : 0) +
        (ind.industryType === "organic-fertilizer" ? preference.stubble : 0);
      const suitabilityScore = Math.round(
        100 *
          (0.35 * handlesShare +
            0.45 * meetsThreshold +
            0.2 * (0.5 + 0.5 * prefResidueBoost) * proximityScore),
      );

      const why: string[] = [
        `${ind.industryName}`,
        `Estimated eligible residue: ${residueTons.toFixed(2)} tons`,
      ];
      why.push(distanceKm < 5 ? "Short-range logistics match" : `~${distanceKm.toFixed(1)}km away`);
      if (residueTons >= ind.minResidueTons) why.push("Meets collection threshold");
      else why.push("Below ideal threshold (can be aggregated across farms)");

      return {
        industryType: ind.industryType,
        industryName: ind.industryName,
        distanceKm,
        suitabilityScore: Math.max(0, Math.min(100, suitabilityScore)),
        why,
      };
    })
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore);
}

