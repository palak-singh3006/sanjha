import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type SyncStatus = "synced" | "pending" | "offline";

export interface SanjhaDB extends DBSchema {
  posts: {
    key: string;
    value: {
      id: string;
      title: string;
      body: string;
      crop: string;
      region: string;
      cachedAt: number;
    };
  };
  listings: {
    key: string;
    value: {
      id: string;
      crop: string;
      qtyKg: number;
      minPrice: number;
      status: "queued" | "synced";
      createdAt: number;
    };
  };
  advisory: {
    key: string;
    value: { key: string; text: string; lang: string; cachedAt: number };
  };
  harvestLogs: {
    key: string;
    value: {
      id: string;
      crop: string;
      harvestedKg: number;
      harvestedAt: number;
      farmLabel?: string;
      geo?: { lat: number; lng: number };

      residueBreakdownKg: {
        stalkKg: number;
        huskKg: number;
        stubbleKg: number;
        totalResidueKg: number;
      };

      marketPricesINRPerTon: {
        bioEnergy: number;
        paper: number;
        fertilizer: number;
        updatedAt: number;
        source: string;
        confidence: number;
      };

      potentialIncomeINR: number;
      breakdownINR: { stalkINR: number; huskINR: number; stubbleINR: number };
      ecoCreditSavedKgCO2e: number;
      confidence: number;
      createdAt: number;
    };
  };

  collectionLots: {
    key: string;
    value: {
      lotId: string;
      createdAt: number;
      industryType: string;
      industryName: string;
      harvestLogIds: string[];
      residueBreakdownKg: {
        stalkKg: number;
        huskKg: number;
        stubbleKg: number;
        totalResidueKg: number;
      };
      geo?: { lat: number; lng: number };
      qrPayload: string;
      stages: { stage: string; at: number; note?: string }[];
    };
  };
}

const DB_NAME = "sanjha-offline";
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<SanjhaDB>> | null = null;

export function getOfflineDB() {
  if (typeof indexedDB === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB<SanjhaDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("posts")) {
          db.createObjectStore("posts", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("listings")) {
          db.createObjectStore("listings", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("advisory")) {
          db.createObjectStore("advisory", { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains("harvestLogs")) {
          db.createObjectStore("harvestLogs", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("collectionLots")) {
          db.createObjectStore("collectionLots", { keyPath: "lotId" });
        }
      },
    });
  }
  return dbPromise;
}

export async function cacheAdvisory(key: string, text: string, lang: string) {
  const db = await getOfflineDB();
  if (!db) return;
  await db.put("advisory", { key, text, lang, cachedAt: Date.now() });
}

export async function getCachedAdvisory(key: string) {
  const db = await getOfflineDB();
  if (!db) return null;
  return db.get("advisory", key);
}

export async function queueListingDraft(entry: SanjhaDB["listings"]["value"]) {
  const db = await getOfflineDB();
  if (!db) return;
  await db.put("listings", entry);
}

export async function getQueuedListings() {
  const db = await getOfflineDB();
  if (!db) return [];
  return db.getAll("listings");
}

export async function addHarvestLog(entry: SanjhaDB["harvestLogs"]["value"]) {
  const db = await getOfflineDB();
  if (!db) return;
  await db.put("harvestLogs", entry);
}

export async function getHarvestLogs() {
  const db = await getOfflineDB();
  if (!db) return [];
  return db.getAll("harvestLogs");
}

export async function addCollectionLot(entry: SanjhaDB["collectionLots"]["value"]) {
  const db = await getOfflineDB();
  if (!db) return;
  await db.put("collectionLots", entry);
}

export async function getCollectionLots() {
  const db = await getOfflineDB();
  if (!db) return [];
  return db.getAll("collectionLots");
}

export async function updateCollectionLotStage(lotId: string, update: { stage: string; at: number; note?: string }) {
  const db = await getOfflineDB();
  if (!db) return;
  const existing = await db.get("collectionLots", lotId);
  if (!existing) return;
  existing.stages = [...(existing.stages ?? []), update];
  await db.put("collectionLots", existing);
}
