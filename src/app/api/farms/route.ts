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
      return apiSuccess([
        {
          id: "c1000000-0000-0000-0000-000000000001",
          ownerId: "a1000000-0000-0000-0000-000000000001",
          ownerName: "Sharanappa Gowda",
          groupId: "b1000000-0000-0000-0000-000000000001",
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
      ]);
    }

    let query = admin
      .from("farms")
      .select(`
        id, owner_id, group_id, name, acres, village, district, state, soil_type, survey_number, irrigation_type, lat, lng, created_at,
        users (id, full_name, phone)
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (ownerId) query = query.eq("owner_id", ownerId);
    if (groupId) query = query.eq("group_id", groupId);
    if (village) query = query.ilike("village", `%${village}%`);
    if (district) query = query.ilike("district", `%${district}%`);
    if (soilType) query = query.eq("soil_type", soilType);

    const { data, error } = await query;
    if (error) {
      return apiError(`Failed to fetch farms: ${error.message}`, { status: 500, details: error });
    }

    const results = (data || []).map((f: any) => ({
      id: f.id,
      ownerId: f.owner_id,
      ownerName: f.users?.full_name,
      ownerPhone: f.users?.phone,
      groupId: f.group_id,
      name: f.name,
      acres: f.acres,
      village: f.village,
      district: f.district,
      state: f.state,
      soilType: f.soil_type,
      surveyNumber: f.survey_number,
      irrigationType: f.irrigation_type,
      lat: f.lat,
      lng: f.lng,
      createdAt: f.created_at,
    }));

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
        owner_id: ownerId,
        group_id: val.groupId || null,
        name: val.name,
        acres: val.acres,
        village: val.village,
        district: val.district,
        state: val.state,
        soil_type: val.soilType,
        survey_number: val.surveyNumber,
        irrigation_type: val.irrigationType,
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
