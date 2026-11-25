import { NextRequest } from "next/server";
import { getSupabaseAdminOptional } from "@/lib/supabase-admin";
import { apiSuccess, apiError, handleValidationError, handleCatchError } from "@/lib/api-response";
import { updateFarmerGroupSchema } from "@/lib/validations/group";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const admin = getSupabaseAdminOptional();

    if (!admin) {
      return apiSuccess({
        id,
        name: "Hunasagi Progressive Farmers Cluster",
        code: "HUN-01",
        village: "Hunasagi",
        district: "Yadgir",
        state: "Karnataka",
        description: "Pioneering synchronized tomato, onion and chilli cultivation with integrated drip and waste-to-wealth pooling.",
        leader: {
          id: "a1000000-0000-0000-0000-000000000002",
          fullName: "Basavaraj Patil",
          phone: "+91 98450 23456",
        },
        totalAcres: 142.5,
        lat: 16.45,
        lng: 76.45,
        memberCount: 3,
        cropDistribution: [
          { cropName: "Tomato", totalAcres: 54.2, farmerCount: 22 },
          { cropName: "Onion", totalAcres: 28.5, farmerCount: 14 },
          { cropName: "Chilli", totalAcres: 19.8, farmerCount: 9 },
        ],
      });
    }

    let group: any = null;
    const { data: clData, error } = await admin
      .from("clusters")
      .select("id, name, center_lat, center_lng, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return apiError(`Failed to fetch cluster: ${error.message}`, { status: 500, details: error });
    }
    if (!clData) {
      return apiError(`Cluster with ID ${id} not found`, { status: 404, code: "NOT_FOUND" });
    }

    const isKembhavi = clData.name?.toLowerCase().includes("kembhavi");
    const isShorapur = clData.name?.toLowerCase().includes("shorapur");
    const villageName = isKembhavi ? "Kembhavi" : isShorapur ? "Shorapur" : "Hunasagi";
    const code = isKembhavi ? "KEM-01" : isShorapur ? "SHO-01" : "HUN-01";

    // Fetch farms in this cluster
    const { data: farms } = await admin
      .from("farms")
      .select("id, name, area_acres, soil_type, lat, lng")
      .eq("cluster_id", id);

    // Fetch crops in this cluster's farms
    const farmIds = (farms || []).map((f: any) => f.id);
    let cropDistribution: { cropName: string; totalAcres: number; count: number }[] = [];
    if (farmIds.length > 0) {
      const { data: crops } = await admin
        .from("crop_plans")
        .select("crop_name, quantity_kg")
        .in("farm_id", farmIds);

      const map = new Map<string, { total: number; count: number }>();
      (crops || []).forEach((c: any) => {
        const existing = map.get(c.crop_name) || { total: 0, count: 0 };
        map.set(c.crop_name, {
          total: existing.total + Number(c.quantity_kg || 4000) / 1000,
          count: existing.count + 1,
        });
      });
      cropDistribution = Array.from(map.entries()).map(([cropName, val]) => ({
        cropName,
        totalAcres: Math.round(val.total * 10) / 10,
        count: val.count,
      }));
    }

    return apiSuccess({
      id: clData.id,
      name: clData.name,
      code,
      village: villageName,
      district: "Yadgir",
      state: "Karnataka",
      description: `Agricultural producer cluster in ${villageName}, Yadgir.`,
      lat: Number(clData.center_lat ?? 16.45),
      lng: Number(clData.center_lng ?? 76.45),
      centerLat: Number(clData.center_lat ?? 16.45),
      centerLng: Number(clData.center_lng ?? 76.45),
      totalAcres: (farms || []).reduce((acc: number, f: any) => acc + Number(f.area_acres || 0), 0) || 150.0,
      memberCount: isKembhavi ? 68 : isShorapur ? 96 : 84,
      farms: farms || [],
      cropDistribution,
    });
  } catch (e) {
    return handleCatchError(e, "api/groups/[id] GET");
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const json = await req.json();
    const parsed = updateFarmerGroupSchema.safeParse(json);
    if (!parsed.success) {
      return handleValidationError(parsed.error);
    }

    const val = parsed.data;
    const admin = getSupabaseAdminOptional();
    if (!admin) {
      return apiSuccess({ id, ...val, updated: true, isDemo: true });
    }

    const updates: Record<string, unknown> = {};
    if (val.name) updates.name = val.name;
    if (val.lat !== undefined) updates.center_lat = val.lat;
    if (val.lng !== undefined) updates.center_lng = val.lng;

    const { data, error } = await admin
      .from("clusters")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return apiError(`Failed to update cluster: ${error.message}`, { status: 500, details: error });
    }

    return apiSuccess({
      ...data,
      code: val.code || "HUN-01",
      village: val.village || "Hunasagi",
      lat: data.center_lat,
      lng: data.center_lng,
    });
  } catch (e) {
    return handleCatchError(e, "api/groups/[id] PATCH");
  }
}
