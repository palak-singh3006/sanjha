export const clusterStats = {
  village: "Hunasagi Cluster",
  district: "Yadgir, Karnataka",
  farmers: 842,
  activeCrops: 11,
  tomatoSaturation: 78,
  suggestedCrop: "Onion (export corridor demand +12%)",
  aiLine:
    "140 farmers already growing tomatoes. Consider onions or chilli for higher cluster profit.",
};

export const cropDistribution = [
  { name: "Tomato", value: 38, fill: "#ef4444" },
  { name: "Onion", value: 18, fill: "#a78bfa" },
  { name: "Chilli", value: 14, fill: "#f97316" },
  { name: "Toor", value: 12, fill: "#22c55e" },
  { name: "Other", value: 18, fill: "#38bdf8" },
];

export const harvestRows = [
  {
    farm: "Plot A — Shivappa",
    risk: 72,
    weather: "Rain 65% tomorrow PM",
    marketPressure: 58,
    date: "Harvest in 2 days",
    confidence: 0.86,
  },
  {
    farm: "Plot C — Radha",
    risk: 41,
    weather: "Dry window 48h",
    marketPressure: 44,
    date: "Harvest in 5 days",
    confidence: 0.79,
  },
  {
    farm: "Plot F — Basavaraj",
    risk: 63,
    weather: "Wind advisory",
    marketPressure: 61,
    date: "Harvest today",
    confidence: 0.91,
  },
];

export const listings = [
  {
    id: "1",
    crop: "Cherry Tomato",
    farmer: "Radha K.",
    qty: 1200,
    min: 42,
    bids: 5,
    trust: 96,
  },
  {
    id: "2",
    crop: "Byadgi Chilli",
    farmer: "Shivappa",
    qty: 800,
    min: 118,
    bids: 12,
    trust: 92,
  },
  {
    id: "3",
    crop: "Desi Onion",
    farmer: "Co-op Lot 4",
    qty: 4200,
    min: 28,
    bids: 3,
    trust: 88,
  },
];

export const communityPosts = [
  {
    id: "p1",
    title: "Tomato leaf curl — what worked in Kolar",
    crop: "Tomato",
    region: "Kolar",
    upvotes: 214,
    success: 78,
    validations: 36,
    excerpt: "Neem oil 5% + sticky traps + remove infected leaves early...",
  },
  {
    id: "p2",
    title: "False smut in paddy after unseasonal rain",
    crop: "Rice",
    region: "Raichur",
    upvotes: 156,
    success: 64,
    validations: 22,
    excerpt: "Propiconazole schedule we used + drainage trenches...",
  },
];

export const wastePool = {
  qtyTons: 2.4,
  valueINR: 186000,
  threshold: 2.0,
  buyersUnlocked: 3,
  message: "Cluster crossed 2 tons organic waste. Buyer unlocked.",
};

export const adminStats = {
  farmers: 12840,
  crops: 37,
  wasteTons: 942,
  profitLift: 23,
  topVillages: [
    { name: "Hunasagi", score: 96 },
    { name: "Shorapur", score: 91 },
    { name: "Sindagi", score: 88 },
  ],
};

export const mapFarms = [
  { id: 1, name: "Shivappa", lat: 16.45, lng: 76.45, crop: "Tomato", risk: "high" },
  { id: 2, name: "Radha", lat: 16.452, lng: 76.448, crop: "Onion", risk: "low" },
  { id: 3, name: "Basavaraj", lat: 16.448, lng: 76.452, crop: "Chilli", risk: "med" },
  { id: 4, name: "Co-op 4", lat: 16.451, lng: 76.446, crop: "Tomato", risk: "high" },
];
