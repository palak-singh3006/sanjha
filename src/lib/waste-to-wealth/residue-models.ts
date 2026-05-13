import type { CropKey, ResidueModel } from "./types";

// Crop-specific residue yield + split into stalk/husk/stubble.
// Values are demo-ready heuristics; replace with agronomy calibration later.
export const residueModels: Record<CropKey, ResidueModel> = {
  tomato: {
    residueYieldRatio: 1.25,
    split: { stalk: 0.6, husk: 0.2, stubble: 0.2 },
  },
  onion: {
    residueYieldRatio: 1.35,
    split: { stalk: 0.25, husk: 0.55, stubble: 0.2 },
  },
  chilli: {
    residueYieldRatio: 1.3,
    split: { stalk: 0.55, husk: 0.25, stubble: 0.2 },
  },
  rice: {
    residueYieldRatio: 1.6,
    split: { stalk: 0.3, husk: 0.1, stubble: 0.6 },
  },
  wheat: {
    residueYieldRatio: 1.55,
    split: { stalk: 0.2, husk: 0.15, stubble: 0.65 },
  },
  other: {
    residueYieldRatio: 1.35,
    split: { stalk: 0.45, husk: 0.25, stubble: 0.3 },
  },
};

