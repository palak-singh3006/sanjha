// SANJHA Automated Backend API Test Suite
// Self-contained: spawns Next.js production server, tests all endpoints, and cleans up.

import { spawn } from "node:child_process";

const PORT = 3009;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ FAIL: ${name}`);
    console.error(`  Error: ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/api/auth/me`);
      if (res.status === 200) return true;
    } catch {
      // wait a bit
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server did not start at ${url} within ${timeoutMs}ms`);
}

async function main() {
  console.log(`\nStarting Next.js server on port ${PORT}...`);
  const server = spawn("node", ["./node_modules/.bin/next", "start", "-p", String(PORT)], {
    stdio: "inherit",
    env: { ...process.env, PORT: String(PORT) },
  });

  server.on("error", (err) => {
    console.error("Failed to start Next.js server:", err);
    process.exit(1);
  });

  try {
    await waitForServer(BASE_URL);
    console.log(`\n=== SANJHA Backend Core Test Suite (${BASE_URL}) ===\n`);

    // 1. Auth Me
    await test("GET /api/auth/me returns current profile and farms", async () => {
      const res = await fetch(`${BASE_URL}/api/auth/me`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.success === true, "Expected json.success to be true");
      assert(json.data.user !== undefined, "Expected data.user in response");
      assert(json.data.farms !== undefined, "Expected data.farms array");
    });

    // 2. Farmers List
    await test("GET /api/farmers returns list of registered farmers", async () => {
      const res = await fetch(`${BASE_URL}/api/farmers?village=Hunasagi`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.success === true, "Expected success true");
      assert(Array.isArray(json.data), "Expected data to be an array");
      assert(json.data.length > 0, "Expected at least 1 farmer");
      assert(json.data[0].fullName !== undefined, "Expected fullName");
    });

    // 3. Farmer Validation Failure
    await test("POST /api/farmers fails validation on invalid data", async () => {
      const res = await fetch(`${BASE_URL}/api/farmers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: "A" }),
      });
      assert(res.status === 400, `Expected 400, got ${res.status}`);
      const json = await res.json();
      assert(json.success === false, "Expected success to be false");
      assert(json.code === "VALIDATION_ERROR", "Expected code VALIDATION_ERROR");
    });

    // 4. Farmer Creation Success
    await test("POST /api/farmers succeeds with valid profile", async () => {
      const res = await fetch(`${BASE_URL}/api/farmers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Mallikarjun Biradar",
          phone: "+91 98450 99999",
          village: "Hunasagi",
          district: "Yadgir",
          state: "Karnataka",
          experienceYears: 15,
          totalLandAcres: 4.5,
          primaryCrops: ["Tomato", "Chilli"],
          hasIrrigation: true,
        }),
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      const json = await res.json();
      assert(json.success === true, "Expected success true");
      assert(json.data.id !== undefined, "Expected created farmer ID");
    });

    // 5. Farmer Details
    await test("GET /api/farmers/[id] returns farmer details with crops", async () => {
      const res = await fetch(`${BASE_URL}/api/farmers/a1000000-0000-0000-0000-000000000001`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.success === true, "Expected success true");
      assert(json.data.fullName === "Sharanappa Gowda", `Unexpected name: ${json.data.fullName}`);
      assert(Array.isArray(json.data.farms), "Expected farms array");
    });

    // 6. Farms List & Create
    await test("POST /api/farms creates a farm with geo & soil coordinates", async () => {
      const res = await fetch(`${BASE_URL}/api/farms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sanjha-user-id": "a1000000-0000-0000-0000-000000000001",
        },
        body: JSON.stringify({
          name: "North Canal Plot",
          acres: 2.5,
          village: "Hunasagi",
          district: "Yadgir",
          state: "Karnataka",
          soilType: "loamy",
          irrigationType: "drip",
          lat: 16.455,
          lng: 76.452,
        }),
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      const json = await res.json();
      assert(json.success === true, "Expected success true");
      assert(json.data.id !== undefined, "Expected farm ID");
    });

    await test("GET /api/farms returns farm list", async () => {
      const res = await fetch(`${BASE_URL}/api/farms`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.success === true, "Expected success true");
      assert(Array.isArray(json.data), "Expected data to be array");
      assert(json.data.length > 0, "Expected at least 1 farm");
    });

    // 7. Crop Plans List & Create
    await test("POST /api/crop-plans creates a crop plan with sowing and harvest dates", async () => {
      const res = await fetch(`${BASE_URL}/api/crop-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmId: "c1000000-0000-0000-0000-000000000001",
          cropName: "Tomato",
          variety: "Arka Rakshak F1",
          season: "Kharif",
          areaAcres: 1.2,
          sowingDate: "2026-09-20",
          expectedHarvestDate: "2026-12-08",
          status: "growing",
        }),
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      const json = await res.json();
      assert(json.success === true, "Expected success true");
      assert(json.data.id !== undefined, "Expected plan ID");
    });

    await test("GET /api/crop-plans returns active plans with DRI metadata", async () => {
      const res = await fetch(`${BASE_URL}/api/crop-plans?crop=Tomato`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.success === true, "Expected success true");
      assert(json.data.length > 0, "Expected crop plans");
    });

    // 8. Farmer Groups & Members
    await test("GET /api/groups returns farmer clusters", async () => {
      const res = await fetch(`${BASE_URL}/api/groups`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.success === true, "Expected success true");
      assert(json.data.length > 0, "Expected at least 1 group");
      assert(json.data[0].code === "HUN-01", `Expected HUN-01, got ${json.data[0].code}`);
    });

    await test("GET /api/groups/[id]/members returns cluster roster", async () => {
      const res = await fetch(`${BASE_URL}/api/groups/b1000000-0000-0000-0000-000000000001/members`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.success === true, "Expected success true");
      assert(json.data.length >= 2, "Expected at least 2 members");
    });

    // 9. Mandi Prices & Trends
    await test("GET /api/mandi returns APMC price benchmarks", async () => {
      const res = await fetch(`${BASE_URL}/api/mandi?crop=Tomato&state=Karnataka`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(Array.isArray(json), "Expected array of mandi prices");
      assert(json[0].price_modal > 0, "Expected positive modal price");
    });

    await test("GET /api/mandi/summary returns commodity market trends", async () => {
      const res = await fetch(`${BASE_URL}/api/mandi/summary?state=Karnataka`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.success === true, "Expected success true");
      assert(Array.isArray(json.data.commodities), "Expected commodities array");
    });

    // 10. Marketplace Listings & Bids
    await test("GET /api/listings returns open crop listings", async () => {
      const res = await fetch(`${BASE_URL}/api/listings`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(Array.isArray(json), "Expected array of listings");
      assert(json.length > 0, "Expected at least 1 open listing");
    });

    await test("POST /api/listings validates input and creates listing", async () => {
      const res = await fetch(`${BASE_URL}/api/listings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropName: "Byadgi Chilli",
          quantityKg: 1000,
          qualityGrade: "A",
          minPrice: 120,
          availableDate: "2026-12-15",
          locationText: "Byadgi APMC Yard",
        }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.crop_name === "Byadgi Chilli", "Expected crop name in response");
    });

    // 11. Delay-Risk Index (DRI) Calculation
    await test("POST /api/dri computes harvest delay risk verdict", async () => {
      const res = await fetch(`${BASE_URL}/api/dri`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmId: "c1000000-0000-0000-0000-000000000001",
          cropName: "Tomato",
          clusterId: "HUN-01",
          expectedHarvestDate: "2026-12-05",
          soilType: "loamy",
          cropPlanId: "d1000000-0000-0000-0000-000000000001",
        }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(typeof json.dri === "number", "Expected numeric dri score");
      assert(json.recommendedDate !== undefined, "Expected recommendedDate");
      assert(typeof json.verdict === "string", "Expected verdict string");
    });

    // 12. Dashboard Summary API
    await test("GET /api/dashboard/summary delivers comprehensive aggregated stats", async () => {
      const res = await fetch(`${BASE_URL}/api/dashboard/summary?clusterId=HUN-01`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(json.success === true, "Expected success true");
      assert(json.data.cluster !== undefined, "Expected cluster info");
      assert(json.data.cropDistribution !== undefined, "Expected cropDistribution");
      assert(json.data.upcomingHarvests !== undefined, "Expected upcomingHarvests");
      assert(json.data.wasteToWealth !== undefined, "Expected wasteToWealth stats");
      assert(json.data.weather !== undefined, "Expected weather stats");
    });

    // 13. Knowledge Posts
    await test("GET /api/knowledge returns community knowledge posts", async () => {
      const res = await fetch(`${BASE_URL}/api/knowledge?crop=Tomato`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      const json = await res.json();
      assert(Array.isArray(json), "Expected array of posts");
      assert(json.length > 0, "Expected knowledge posts");
    });

    console.log(`\n========================================`);
    console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);
  } finally {
    server.kill();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test runner fatal error:", err);
  process.exit(1);
});
