import { NextRequest } from "next/server";
import { getServerAuthUser } from "@/lib/auth-helpers";
import { getSupabaseAdminOptional } from "@/lib/supabase-admin";
import { apiSuccess, apiError, handleCatchError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getServerAuthUser(req);
    if (!user) {
      return apiError("Unauthorized", { status: 401, code: "UNAUTHORIZED" });
    }

    const admin = getSupabaseAdminOptional();
    if (!admin) {
      // Demo fallback response
      return apiSuccess({
        user,
        farmerProfile: {
          experienceYears: 12,
          totalLandAcres: 3.5,
          primaryCrops: ["Tomato", "Onion", "Chilli"],
          hasIrrigation: true,
          irrigationSources: ["borewell", "drip"],
          kycStatus: "verified",
          cooperativeName: "Hunasagi Raitha Sangha",
        },
        farms: [
          {
            id: "c1000000-0000-0000-0000-000000000001",
            name: "Gowda South Field",
            acres: 3.5,
            village: "Hunasagi",
            soilType: "loamy",
            irrigationType: "drip",
          },
        ],
        memberships: [
          {
            groupId: "b1000000-0000-0000-0000-000000000001",
            groupName: "Hunasagi Progressive Farmers Cluster",
            role: "member",
            status: "active",
          },
        ],
      });
    }

    // Fetch profile
    const { data: profile } = await admin
      .from("farmer_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // Fetch farms
    const { data: farms } = await admin
      .from("farms")
      .select("id, name, acres, village, district, soil_type, irrigation_type, survey_number, lat, lng")
      .eq("owner_id", user.id);

    // Fetch memberships
    const { data: memberships } = await admin
      .from("group_memberships")
      .select("id, role, status, joined_at, farmer_groups(id, name, code, village)")
      .eq("user_id", user.id);

    return apiSuccess({
      user,
      farmerProfile: profile ?? null,
      farms: farms ?? [],
      memberships: (memberships ?? []).map((m: any) => ({
        id: m.id,
        role: m.role,
        status: m.status,
        groupId: m.farmer_groups?.id,
        groupName: m.farmer_groups?.name,
        groupCode: m.farmer_groups?.code,
      })),
    });
  } catch (e) {
    return handleCatchError(e, "api/auth/me GET");
  }
}
