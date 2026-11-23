/**
 * Typed wrappers around `/api/*` — use from Client Components.
 */

const jsonHeaders = { "Content-Type": "application/json" };

export async function apiWeather(params: { lat: string; lng: string; clusterId?: string | null }) {
  const q = new URLSearchParams({ lat: params.lat, lng: params.lng });
  if (params.clusterId) q.set("clusterId", params.clusterId);
  const res = await fetch(`/api/weather?${q}`);
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  return res.json();
}

export async function apiMandi(crop?: string, state?: string) {
  const q = new URLSearchParams();
  if (crop) q.set("crop", crop);
  if (state) q.set("state", state);
  const res = await fetch(`/api/mandi?${q}`);
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  return res.json();
}

export async function apiDri(body: {
  farmId: string;
  cropName: string;
  clusterId: string;
  expectedHarvestDate: string;
  soilType: string;
  cropPlanId: string;
}) {
  const res = await fetch("/api/dri", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiCopilot(body: {
  text: string;
  lang?: string;
  farmContext?: { crop?: string; soil?: string; district?: string; weather?: string };
}) {
  const res = await fetch("/api/copilot", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ reply: string; replyEn: string }>;
}

export async function apiListings(crop?: string) {
  const q = crop ? `?crop=${encodeURIComponent(crop)}` : "";
  const res = await fetch(`/api/listings${q}`);
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  return res.json();
}

export async function apiCreateListing(body: Record<string, unknown>) {
  const res = await fetch("/api/listings", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  return res.json();
}

export async function apiPlaceBid(body: {
  listingId: string;
  buyerId: string;
  pricePerKg: number;
  message?: string;
}) {
  const res = await fetch("/api/bids", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  return res.json();
}

export async function apiAcceptBid(body: { bidId: string; listingId: string }) {
  const res = await fetch("/api/bids", {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiKnowledge(params?: { crop?: string; region?: string; pest?: string }) {
  const q = new URLSearchParams();
  if (params?.crop) q.set("crop", params.crop);
  if (params?.region) q.set("region", params.region);
  if (params?.pest) q.set("pest", params.pest);
  const res = await fetch(`/api/knowledge?${q}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiCreateKnowledgePost(body: Record<string, unknown>) {
  const res = await fetch("/api/knowledge", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  return res.json();
}


// -----------------------------------------------------------------------------
// SANJHA Core Backend Typed Client Helpers
// -----------------------------------------------------------------------------

export async function apiGetMe() {
  const res = await fetch("/api/auth/me");
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  return res.json();
}

export async function apiFarmers(params?: { village?: string; district?: string; crop?: string }) {
  const q = new URLSearchParams();
  if (params?.village) q.set("village", params.village);
  if (params?.district) q.set("district", params.district);
  if (params?.crop) q.set("crop", params.crop);
  const res = await fetch(`/api/farmers?${q}`);
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  return res.json();
}

export async function apiFarmer(id: string) {
  const res = await fetch(`/api/farmers/${id}`);
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  return res.json();
}

export async function apiFarms(params?: { ownerId?: string; groupId?: string; village?: string }) {
  const q = new URLSearchParams();
  if (params?.ownerId) q.set("ownerId", params.ownerId);
  if (params?.groupId) q.set("groupId", params.groupId);
  if (params?.village) q.set("village", params.village);
  const res = await fetch(`/api/farms?${q}`);
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  return res.json();
}

export async function apiFarm(id: string) {
  const res = await fetch(`/api/farms/${id}`);
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  return res.json();
}

export async function apiCreateFarm(body: Record<string, unknown>) {
  const res = await fetch("/api/farms", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  return res.json();
}

export async function apiCropPlans(params?: { farmId?: string; cropName?: string; status?: string }) {
  const q = new URLSearchParams();
  if (params?.farmId) q.set("farmId", params.farmId);
  if (params?.cropName) q.set("cropName", params.cropName);
  if (params?.status) q.set("status", params.status);
  const res = await fetch(`/api/crop-plans?${q}`);
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  return res.json();
}

export async function apiCropPlan(id: string) {
  const res = await fetch(`/api/crop-plans/${id}`);
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  return res.json();
}

export async function apiCreateCropPlan(body: Record<string, unknown>) {
  const res = await fetch("/api/crop-plans", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  return res.json();
}

export async function apiGroups(params?: { village?: string; district?: string }) {
  const q = new URLSearchParams();
  if (params?.village) q.set("village", params.village);
  if (params?.district) q.set("district", params.district);
  const res = await fetch(`/api/groups?${q}`);
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  return res.json();
}

export async function apiGroup(id: string) {
  const res = await fetch(`/api/groups/${id}`);
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  return res.json();
}

export async function apiGroupMembers(id: string) {
  const res = await fetch(`/api/groups/${id}/members`);
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  return res.json();
}

export async function apiDashboardSummary(clusterId?: string) {
  const q = clusterId ? `?clusterId=${encodeURIComponent(clusterId)}` : "";
  const res = await fetch(`/api/dashboard/summary${q}`);
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  return res.json();
}

export async function apiMandiSummary(state?: string) {
  const q = state ? `?state=${encodeURIComponent(state)}` : "";
  const res = await fetch(`/api/mandi/summary${q}`);
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  return res.json();
}
