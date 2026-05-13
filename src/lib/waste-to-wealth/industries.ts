import type { IndustryType } from "./types";

export interface Industry {
  industryType: IndustryType;
  industryName: string;
  handles: ("stalk" | "husk" | "stubble")[];
  // Demo acceptance thresholds; used for scoring only.
  minResidueTons: number;
  lat: number;
  lng: number;
  // Optional preference weights per residue stream
  preference?: { stalk: number; husk: number; stubble: number };
}

// Demo industries around the current cluster center.
export const industries: Industry[] = [
  {
    industryType: "bio-energy",
    industryName: "Bio-Energy Plant (Biomass → Power)",
    handles: ["stalk"],
    minResidueTons: 0.4,
    lat: 16.455,
    lng: 76.448,
    preference: { stalk: 1.0, husk: 0.25, stubble: 0.3 },
  },
  {
    industryType: "paper-mill",
    industryName: "Paper Mill (Husk → Pulp)",
    handles: ["husk"],
    minResidueTons: 0.3,
    lat: 16.4485,
    lng: 76.46,
    preference: { stalk: 0.2, husk: 1.0, stubble: 0.25 },
  },
  {
    industryType: "organic-fertilizer",
    industryName: "Organic Fertilizer Co. (Stubble → Compost)",
    handles: ["stubble"],
    minResidueTons: 0.2,
    lat: 16.462,
    lng: 76.455,
    preference: { stalk: 0.25, husk: 0.3, stubble: 1.0 },
  },
];

