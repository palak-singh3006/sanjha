# SANJHA Backend API Contracts & Integration Guide

This document defines the REST API contracts, database schema, Row-Level Security (RLS) model, validation schemas, and integration points for the **Frontend Developer** and **AI/ML Developer**.

---

## 1. Authentication & Session Architecture

The SANJHA backend supports three authentication tiers:
1. **Supabase SSR Sessions**: Standard cookie-based auth managed via `@supabase/ssr` when users log in on web/PWA.
2. **Bearer JWT**: Sent in `Authorization: Bearer <access_token>` for native apps, API clients, and AI agents.
3. **Resilient Local / Offline Demo Mode**: When Supabase credentials are not supplied in `.env.local`, the backend transparently serves verified deterministic mock data (e.g. for village Hunasagi, Yadgir cluster) without throwing 500 errors.

### `GET /api/auth/me`
Fetches the currently authenticated farmer or coordinator, their detailed agronomic profile, owned farms, and cluster memberships.
- **Headers**: Optional `Authorization: Bearer <token>` or session cookies
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "a1000000-0000-0000-0000-000000000001",
      "fullName": "Sharanappa Gowda",
      "email": "farmer.sharanappa@sanjha.network",
      "phone": "+91 98450 12345",
      "role": "farmer",
      "preferredLanguage": "kn",
      "village": "Hunasagi",
      "district": "Yadgir",
      "state": "Karnataka"
    },
    "farmerProfile": {
      "experienceYears": 12,
      "totalLandAcres": 3.5,
      "primaryCrops": ["Tomato", "Onion", "Chilli"],
      "hasIrrigation": true,
      "irrigationSources": ["borewell", "drip"],
      "kycStatus": "verified",
      "cooperativeName": "Hunasagi Raitha Sangha"
    },
    "farms": [
      {
        "id": "c1000000-0000-0000-0000-000000000001",
        "name": "Gowda South Field",
        "acres": 3.5,
        "village": "Hunasagi",
        "soilType": "loamy",
        "irrigationType": "drip",
        "lat": 16.452,
        "lng": 76.448
      }
    ],
    "memberships": [
      {
        "groupId": "b1000000-0000-0000-0000-000000000001",
        "groupName": "Hunasagi Progressive Farmers Cluster",
        "groupCode": "HUN-01",
        "role": "member",
        "status": "active"
      }
    ]
  }
}
```

### `POST /api/auth/sync`
Syncs or initializes a user's record in `public.users` and `public.farmer_profiles` upon Supabase Auth signup.
- **Request Body**:
```json
{
  "authId": "uuid",
  "fullName": "Sharanappa Gowda",
  "email": "farmer.sharanappa@sanjha.network",
  "role": "farmer",
  "preferredLanguage": "kn",
  "village": "Hunasagi"
}
```
- **Response `200 OK`**: `{ "success": true, "data": { "user": { ... } } }`

---

## 2. Farmer Profiles API

### `GET /api/farmers`
Query registered farmers.
- **Query Parameters**:
  - `village`: Filter by village name (e.g. `Hunasagi`)
  - `district`: Filter by district (e.g. `Yadgir`)
  - `crop`: Filter by crop name (e.g. `Tomato`)
  - `limit`: Number of records (default 50, max 100)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "a1000000-0000-0000-0000-000000000001",
      "fullName": "Sharanappa Gowda",
      "phone": "+91 98450 12345",
      "role": "farmer",
      "village": "Hunasagi",
      "district": "Yadgir",
      "state": "Karnataka",
      "experienceYears": 12,
      "totalLandAcres": 3.5,
      "primaryCrops": ["Tomato", "Onion", "Chilli"],
      "hasIrrigation": true,
      "kycStatus": "verified",
      "cooperativeName": "Hunasagi Raitha Sangha"
    }
  ],
  "meta": { "count": 1 }
}
```

### `POST /api/farmers`
Register a new farmer profile.
- **Request Body**:
```json
{
  "fullName": "Mallikarjun Biradar",
  "phone": "+91 98450 99999",
  "village": "Hunasagi",
  "district": "Yadgir",
  "state": "Karnataka",
  "experienceYears": 15,
  "totalLandAcres": 4.5,
  "primaryCrops": ["Tomato", "Chilli"],
  "hasIrrigation": true,
  "irrigationSources": ["borewell", "drip"],
  "kycStatus": "verified"
}
```
- **Validation**:
  - `fullName`: 2-120 characters
  - `phone`: Valid Indian phone format with optional +91
  - `experienceYears`: 0-80
  - `totalLandAcres`: positive number

### `GET /api/farmers/[id]`
Returns detailed profile for a specific farmer including their farm parcels and crop plans.

### `PATCH /api/farmers/[id]`
Updates farmer personal details or agronomic profile attributes.

---

## 3. Farms API

### `GET /api/farms`
List farm plots.
- **Query Parameters**: `ownerId`, `groupId`, `village`, `district`, `soilType`, `limit`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "c1000000-0000-0000-0000-000000000001",
      "ownerId": "a1000000-0000-0000-0000-000000000001",
      "ownerName": "Sharanappa Gowda",
      "groupId": "b1000000-0000-0000-0000-000000000001",
      "name": "Gowda South Field",
      "acres": 3.5,
      "village": "Hunasagi",
      "district": "Yadgir",
      "state": "Karnataka",
      "soilType": "loamy",
      "surveyNumber": "SY-142/B",
      "irrigationType": "drip",
      "lat": 16.452,
      "lng": 76.448
    }
  ]
}
```

### `POST /api/farms`
Create a new farm plot.
- **Request Body**:
```json
{
  "name": "North Canal Plot",
  "acres": 2.5,
  "village": "Hunasagi",
  "district": "Yadgir",
  "state": "Karnataka",
  "soilType": "loamy",
  "irrigationType": "drip",
  "surveyNumber": "SY-145/2",
  "lat": 16.455,
  "lng": 76.452
}
```

### `GET /api/farms/[id]`
Returns farm plot details, active crops, owner info, and recent soil health history.

### `PATCH /api/farms/[id]`
Updates farm parcel details (acreage, irrigation, survey number).

### `DELETE /api/farms/[id]`
Deletes a farm parcel.

---

## 4. Crop Plans & Harvest Risk (DRI) API

### `GET /api/crop-plans`
List crop plans across farms in a cluster or farmer's holding.
- **Query Parameters**: `farmId`, `cropName`, `status`, `season`, `limit`
- **Status Enum**: `planning`, `sown`, `growing`, `harvest_ready`, `harvested`, `failed`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "d1000000-0000-0000-0000-000000000001",
      "farmId": "c1000000-0000-0000-0000-000000000001",
      "farmName": "Gowda South Field",
      "cropName": "Tomato",
      "variety": "Abhinav Hybrid",
      "season": "Kharif",
      "areaAcres": 1.5,
      "sowingDate": "2026-09-24",
      "expectedHarvestDate": "2026-12-05",
      "recommendedHarvestDate": "2026-12-07",
      "status": "growing",
      "driScore": 42,
      "marketPressure": 68,
      "estimatedYieldKg": 6200
    }
  ]
}
```

### `POST /api/crop-plans`
Creates a crop plan for a farm plot.
- **Request Body**:
```json
{
  "farmId": "c1000000-0000-0000-0000-000000000001",
  "cropName": "Tomato",
  "variety": "Saaho F1",
  "season": "Kharif",
  "areaAcres": 1.5,
  "sowingDate": "2026-09-20",
  "expectedHarvestDate": "2026-12-08",
  "status": "growing"
}
```

### `POST /api/dri` (Delay-Risk Index Calculation)
Analyzes weather conditions, cluster peer market pressure, and soil characteristics to compute optimal harvest scheduling.
- **Request Body**:
```json
{
  "farmId": "c1000000-0000-0000-0000-000000000001",
  "cropName": "Tomato",
  "clusterId": "HUN-01",
  "expectedHarvestDate": "2026-12-05",
  "soilType": "loamy",
  "cropPlanId": "d1000000-0000-0000-0000-000000000001"
}
```
- **Response `200 OK`**:
```json
{
  "dri": 42,
  "marketPressure": 68,
  "weatherScore": 25,
  "recommendedDate": "2026-12-07",
  "delayDays": 2,
  "verdict": "Can wait a few days"
}
```

---

## 5. Farmer Groups & Memberships API

### `GET /api/groups`
List farmer clusters / FPOs.
- **Query Parameters**: `village`, `district`, `limit`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "b1000000-0000-0000-0000-000000000001",
      "name": "Hunasagi Progressive Farmers Cluster",
      "code": "HUN-01",
      "village": "Hunasagi",
      "district": "Yadgir",
      "state": "Karnataka",
      "description": "Pioneering synchronized tomato, onion and chilli cultivation with integrated drip and waste-to-wealth pooling.",
      "leaderName": "Basavaraj Patil",
      "totalAcres": 142.5,
      "memberCount": 3
    }
  ]
}
```

### `POST /api/groups`
Create a new farmer cluster.
- **Request Body**:
```json
{
  "name": "Kembhavi Raitha Okkuta",
  "code": "KEM-01",
  "village": "Kembhavi",
  "district": "Yadgir",
  "state": "Karnataka",
  "description": "Cluster focusing on red gram and cotton residue pooling.",
  "totalAcres": 85.0
}
```

### `GET /api/groups/[id]/members`
List members in a cluster with roles and status.

### `POST /api/groups/[id]/members`
Add a farmer to a cluster (`role`: `member`, `lead`, `coordinator`).

---

## 6. Market Data & APMC Benchmarks API

### `GET /api/mandi`
Returns live Agmarknet / APMC mandi prices for crops in Karnataka / India. Caches responses in `public.mandi_prices`.
- **Query Parameters**: `crop` (e.g. `Tomato`), `state` (e.g. `Karnataka`)
- **Response `200 OK`**:
```json
[
  {
    "crop_name": "Tomato",
    "market_name": "Yadgir APMC",
    "state": "Karnataka",
    "price_min": 3100,
    "price_max": 3900,
    "price_modal": 3500,
    "date": "2026-11-23",
    "source": "agmarknet"
  }
]
```

### `GET /api/mandi/summary`
Returns market intelligence summary: min/max/modal spread, commodity price averages, and market coverage.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "state": "Karnataka",
    "date": "2026-11-23",
    "commodities": [
      {
        "cropName": "Tomato",
        "minPrice": 3100,
        "maxPrice": 4800,
        "modalPriceAvg": 3816,
        "marketCount": 3,
        "markets": ["Yadgir APMC", "Raichur APMC", "Yeshwanthpur Bangalore"]
      }
    ]
  }
}
```

---

## 7. Dashboard Summary API

### `GET /api/dashboard/summary`
Aggregates high-level metrics for the main app dashboard and village coordinator view.
- **Query Parameters**: `clusterId` (e.g. `HUN-01`), `village` (e.g. `Hunasagi`)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "cluster": {
      "id": "b1000000-0000-0000-0000-000000000001",
      "name": "Hunasagi Progressive Farmers Cluster",
      "code": "HUN-01",
      "village": "Hunasagi",
      "district": "Yadgir, Karnataka",
      "farmersCount": 842,
      "activeCropsCount": 11,
      "tomatoSaturation": 78,
      "suggestedCrop": "Onion (export corridor demand +12%)",
      "aiAdvisory": "78% of acreage is currently under tomato. Consider staggering harvest or diversifying to onion."
    },
    "cropDistribution": [
      { "name": "Tomato", "value": 38, "fill": "#ef4444" },
      { "name": "Onion", "value": 18, "fill": "#a78bfa" }
    ],
    "upcomingHarvests": [
      {
        "farm": "Plot A — Shivappa",
        "crop": "Tomato",
        "risk": 72,
        "weather": "Rain 65% tomorrow PM",
        "expectedDate": "Harvest in 2 days"
      }
    ],
    "demandSupplyTrends": [
      { "week": "W1", "demand": 42, "supply": 38 },
      { "week": "W2", "demand": 48, "supply": 55 }
    ],
    "marketplace": {
      "openListingsCount": 2,
      "pendingBidsCount": 1
    },
    "wasteToWealth": {
      "pooledBiomassTons": 2.4,
      "potentialIncomeINR": 186000,
      "carbonOffsetKgCO2e": 4800,
      "activeBuyersCount": 3
    },
    "weather": {
      "tempMax": 33.5,
      "tempMin": 22.0,
      "rainfallMm": 0.0,
      "condition": "clear"
    }
  }
}
```

---

## 8. TypeScript Client Helpers (`src/lib/http/api.ts`)

Frontend developers can directly import typed functions:
```ts
import {
  apiGetMe,
  apiFarmers,
  apiFarmer,
  apiFarms,
  apiCreateFarm,
  apiCropPlans,
  apiCreateCropPlan,
  apiGroups,
  apiGroup,
  apiGroupMembers,
  apiDashboardSummary,
  apiMandiSummary,
  apiListings,
  apiCreateListing,
  apiPlaceBid,
  apiDri
} from "@/lib/http/api";
```
