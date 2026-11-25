import { NextRequest } from "next/server";
import { getSupabaseAdminOptional } from "@/lib/supabase-admin";
import { getServerAuthUser } from "@/lib/auth-helpers";
import { apiSuccess, apiError, handleValidationError, handleCatchError } from "@/lib/api-response";
import { createFarmSchema } from "@/lib/validations/farm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get("ownerId");
    const groupId = searchParams.get("groupId");
    const village = searchParams.get("village");
    const district = searchParams.get("district");
    const soilType = searchParams.get("soilType");
    const limit = Math.min(Number(searchParams.get("limit") || "50"), 100);

    const admin = getSupabaseAdminOptional();
    if (!admin) {
      const allFarms = [
        {
          id: "c1000000-0000-0000-0000-000000000001",
          ownerId: "a1000000-0000-0000-0000-000000000001",
          ownerName: "Sharanappa Gowda",
          groupId: "b1000000-0000-0000-0000-000000000001",
          clusterCode: "HUN-01",
          name: "Gowda South Field",
          acres: 3.5,
          village: "Hunasagi",
          district: "Yadgir",
          state: "Karnataka",
          soilType: "loamy",
          surveyNumber: "SY-142/B",
          irrigationType: "drip",
          lat: 16.452,
          lng: 76.448,
        },
        {
          id: "c1000000-0000-0000-0000-000000000002",
          ownerId: "a1000000-0000-0000-0000-000000000004",
          ownerName: "Renuka Devi",
          groupId: "b1000000-0000-0000-0000-000000000001",
          clusterCode: "HUN-01",
          name: "Renuka Krishna Valley Farm",
          acres: 2.0,
          village: "Hunasagi",
          district: "Yadgir",
          state: "Karnataka",
          soilType: "clay",
          surveyNumber: "SY-89/1",
          irrigationType: "canal_drip",
          lat: 16.458,
          lng: 76.453,
        },
        {
          id: "c1000000-0000-0000-0000-000000000003",
          ownerId: "a1000000-0000-0000-0000-000000000002",
          ownerName: "Basavaraj Patil",
          groupId: "b1000000-0000-0000-0000-000000000001",
          clusterCode: "HUN-01",
          name: "Basavaraj Canal Plot",
          acres: 4.2,
          village: "Hunasagi",
          district: "Yadgir",
          state: "Karnataka",
          soilType: "loamy",
          surveyNumber: "SY-210/C",
          irrigationType: "canal",
          lat: 16.446,
          lng: 76.456,
        },
        {
          id: "c1000000-0000-0000-0000-000000000004",
          ownerId: "a1000000-0000-0000-0000-000000000001",
          ownerName: "Sharanappa Gowda",
          groupId: "b1000000-0000-0000-0000-000000000001",
          clusterCode: "HUN-01",
          name: "Sanjha Co-op Tomato Plot",
          acres: 5.0,
          village: "Hunasagi",
          district: "Yadgir",
          state: "Karnataka",
          soilType: "black",
          surveyNumber: "SY-55/A",
          irrigationType: "drip",
          lat: 16.451,
          lng: 76.442,
        },
        {
          id: "c1000000-0000-0000-0000-000000000005",
          ownerId: "a1000000-0000-0000-0000-000000000005",
          ownerName: "Hanumantappa Pujari",
          groupId: "b1000000-0000-0000-0000-000000000002",
          clusterCode: "KEM-01",
          name: "Patil Cotton Acreage",
          acres: 4.8,
          village: "Kembhavi",
          district: "Yadgir",
          state: "Karnataka",
          soilType: "black",
          surveyNumber: "SY-78/2",
          irrigationType: "borewell",
          lat: 16.665,
          lng: 76.561,
        },
        {
          id: "c1000000-0000-0000-0000-000000000006",
          ownerId: "a1000000-0000-0000-0000-000000000006",
          ownerName: "Kembhavi Raitha Sangha",
          groupId: "b1000000-0000-0000-0000-000000000002",
          clusterCode: "KEM-01",
          name: "Kembhavi Pulse Cooperative",
          acres: 6.0,
          village: "Kembhavi",
          district: "Yadgir",
          state: "Karnataka",
          soilType: "loamy",
          surveyNumber: "SY-104/1",
          irrigationType: "rainfed_drip",
          lat: 16.669,
          lng: 76.568,
        },
        {
          id: "c1000000-0000-0000-0000-000000000007",
          ownerId: "a1000000-0000-0000-0000-000000000007",
          ownerName: "Mallikarjun Biradar",
          groupId: "b1000000-0000-0000-0000-000000000002",
          clusterCode: "KEM-01",
          name: "Mallikarjun Red Gram Plot",
          acres: 3.2,
          village: "Kembhavi",
          district: "Yadgir",
          state: "Karnataka",
          soilType: "red",
          surveyNumber: "SY-33/B",
          irrigationType: "rainfed",
          lat: 16.660,
          lng: 76.556,
        },
        {
          id: "c1000000-0000-0000-0000-000000000008",
          ownerId: "a1000000-0000-0000-0000-000000000008",
          ownerName: "Venkatesh Nayak",
          groupId: "b1000000-0000-0000-0000-000000000003",
          clusterCode: "SHO-01",
          name: "Shorapur Basin Paddy Farm",
          acres: 5.5,
          village: "Shorapur",
          district: "Yadgir",
          state: "Karnataka",
          soilType: "clay",
          surveyNumber: "SY-12/A",
          irrigationType: "canal",
          lat: 16.522,
          lng: 76.755,
        },
        {
          id: "c1000000-0000-0000-0000-000000000009",
          ownerId: "a1000000-0000-0000-0000-000000000009",
          ownerName: "Raja Venkatappa FPO",
          groupId: "b1000000-0000-0000-0000-000000000003",
          clusterCode: "SHO-01",
          name: "Raja Venkatappa Canal Plot",
          acres: 4.0,
          village: "Shorapur",
          district: "Yadgir",
          state: "Karnataka",
          soilType: "loamy",
          surveyNumber: "SY-91/C",
          irrigationType: "canal_drip",
          lat: 16.518,
          lng: 76.762,
        },
      ];

      let filtered = allFarms;
      if (village) filtered = filtered.filter((f) => f.village.toLowerCase().includes(village.toLowerCase()));
      if (groupId) filtered = filtered.filter((f) => f.groupId === groupId);
      if (soilType) filtered = filtered.filter((f) => f.soilType === soilType);
      return apiSuccess(filtered);
    }

    let query = admin
      .from("farms")
      .select(`
        id, cluster_id, name, area_acres, soil_type, lat, lng, created_at,
        clusters (id, name, center_lat, center_lng)
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (groupId) query = query.eq("cluster_id", groupId);
    if (soilType) query = query.eq("soil_type", soilType);

    const { data, error } = await query;
    if (error) {
      return apiError(`Failed to fetch farms: ${error.message}`, { status: 500, details: error });
    }

    const results = (data || []).map((f: any) => {
      const isKembhavi = f.clusters?.name?.toLowerCase().includes("kembhavi");
      const isShorapur = f.clusters?.name?.toLowerCase().includes("shorapur");
      const village = isKembhavi ? "Kembhavi" : isShorapur ? "Shorapur" : "Hunasagi";
      const clusterCode = isKembhavi ? "KEM-01" : isShorapur ? "SHO-01" : "HUN-01";
      return {
        id: f.id,
        name: f.name,
        acres: Number(f.area_acres || 2.5),
        areaAcres: Number(f.area_acres || 2.5),
        clusterId: f.cluster_id,
        clusterCode,
        clusterName: f.clusters?.name,
        village,
        district: "Yadgir",
        state: "Karnataka",
        soilType: f.soil_type || "loamy",
        lat: Number(f.lat ?? f.clusters?.center_lat ?? 16.45),
        lng: Number(f.lng ?? f.clusters?.center_lng ?? 76.45),
        createdAt: f.created_at,
      };
    });

    return apiSuccess(results, { meta: { count: results.length } });
  } catch (e) {
    return handleCatchError(e, "api/farms GET");
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = createFarmSchema.safeParse(json);
    if (!parsed.success) {
      return handleValidationError(parsed.error);
    }

    const val = parsed.data;
    const authUser = await getServerAuthUser(req);

    const ownerId = val.ownerId || authUser?.id;
    if (!ownerId) {
      return apiError("ownerId is required or you must be logged in", { status: 401 });
    }

    const admin = getSupabaseAdminOptional();
    if (!admin) {
      return apiSuccess({
        id: crypto.randomUUID(),
        ownerId,
        ...val,
        isDemo: true,
      }, { status: 201 });
    }

    const { data: farm, error } = await admin
      .from("farms")
      .insert({
        cluster_id: val.groupId || null,
        name: val.name,
        area_acres: val.acres,
        soil_type: val.soilType,
        lat: val.lat,
        lng: val.lng,
      })
      .select()
      .single();

    if (error) {
      return apiError(`Failed to create farm: ${error.message}`, { status: 500, details: error });
    }

    return apiSuccess(farm, { status: 201 });
  } catch (e) {
    return handleCatchError(e, "api/farms POST");
  }
}
