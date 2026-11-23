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

    const { data: group, error } = await admin
      .from("farmer_groups")
      .select(`
        id, name, code, village, district, state, description, leader_id, lat, lng, total_acres, created_at,
        users (id, full_name, phone, village)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return apiError(`Failed to fetch group: ${error.message}`, { status: 500, details: error });
    }
    if (!group) {
      return apiError(`Group with ID ${id} not found`, { status: 404, code: "NOT_FOUND" });
    }

    // Fetch members count
    const { count: memberCount } = await admin
      .from("group_memberships")
      .select("*", { count: "exact", head: true })
      .eq("group_id", id)
      .eq("status", "active");

    // Fetch farms in this group
    const { data: farms } = await admin
      .from("farms")
      .select("id, name, acres, village, soil_type, owner_id")
      .eq("group_id", id);

    // Fetch crops in this group's farms
    const farmIds = (farms || []).map((f: any) => f.id);
    let cropDistribution: { cropName: string; totalAcres: number; count: number }[] = [];
    if (farmIds.length > 0) {
      const { data: crops } = await admin
        .from("crop_plans")
        .select("crop_name, area_acres")
        .in("farm_id", farmIds)
        .eq("status", "growing");

      const map = new Map<string, { totalAcres: number; count: number }>();
      (crops || []).forEach((c: any) => {
        const existing = map.get(c.crop_name) || { totalAcres: 0, count: 0 };
        existing.totalAcres += Number(c.area_acres || 0);
        existing.count += 1;
        map.set(c.crop_name, existing);
      });

      cropDistribution = Array.from(map.entries()).map(([cropName, val]) => ({
        cropName,
        totalAcres: Math.round(val.totalAcres * 10) / 10,
        count: val.count,
      }));
    }

    return apiSuccess({
      ...group,
      leader: group.users,
      memberCount: memberCount ?? 0,
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

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (val.name) updates.name = val.name;
    if (val.code) updates.code = val.code;
    if (val.village) updates.village = val.village;
    if (val.district) updates.district = val.district;
    if (val.state) updates.state = val.state;
    if (val.description !== undefined) updates.description = val.description;
    if (val.leaderId !== undefined) updates.leader_id = val.leaderId;
    if (val.lat !== undefined) updates.lat = val.lat;
    if (val.lng !== undefined) updates.lng = val.lng;
    if (val.totalAcres !== undefined) updates.total_acres = val.totalAcres;

    const { data, error } = await admin
      .from("farmer_groups")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return apiError(`Failed to update group: ${error.message}`, { status: 500, details: error });
    }

    return apiSuccess(data);
  } catch (e) {
    return handleCatchError(e, "api/groups/[id] PATCH");
  }
}
