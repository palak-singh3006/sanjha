import { NextRequest } from "next/server";
import { getSupabaseAdminOptional } from "@/lib/supabase-admin";
import { getServerAuthUser } from "@/lib/auth-helpers";
import { apiSuccess, apiError, handleValidationError, handleCatchError } from "@/lib/api-response";
import { createFarmerGroupSchema } from "@/lib/validations/group";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const village = searchParams.get("village");
    const district = searchParams.get("district");
    const limit = Math.min(Number(searchParams.get("limit") || "50"), 100);

    const admin = getSupabaseAdminOptional();
    if (!admin) {
      const allGroups = [
        {
          id: "b1000000-0000-0000-0000-000000000001",
          name: "Hunasagi Progressive Farmers Cluster",
          code: "HUN-01",
          village: "Hunasagi",
          district: "Yadgir",
          state: "Karnataka",
          description: "Pioneering synchronized tomato, onion and chilli cultivation with integrated drip and waste-to-wealth pooling.",
          leaderName: "Basavaraj Patil",
          totalAcres: 142.5,
          lat: 16.45,
          lng: 76.45,
          memberCount: 84,
        },
        {
          id: "b1000000-0000-0000-0000-000000000002",
          name: "Kembhavi Integrated Pulses & Cotton Cluster",
          code: "KEM-01",
          village: "Kembhavi",
          district: "Yadgir",
          state: "Karnataka",
          description: "Cooperative red gram, bengal gram and Bt cotton cluster with shared farmgate sorting and APMC forward contracts.",
          leaderName: "Mallikarjun Biradar",
          totalAcres: 198.0,
          lat: 16.664,
          lng: 76.562,
          memberCount: 68,
        },
        {
          id: "b1000000-0000-0000-0000-000000000003",
          name: "Shorapur Krishna Basin Paddy Cluster",
          code: "SHO-01",
          village: "Shorapur",
          district: "Yadgir",
          state: "Karnataka",
          description: "Krishna canal command area cooperative focused on premium Sona Masoori paddy and groundnut rotation.",
          leaderName: "Venkatesh Nayak",
          totalAcres: 245.0,
          lat: 16.520,
          lng: 76.758,
          memberCount: 96,
        },
      ];

      let filtered = allGroups;
      if (village) filtered = filtered.filter((g) => g.village.toLowerCase().includes(village.toLowerCase()));
      if (district) filtered = filtered.filter((g) => g.district.toLowerCase().includes(district.toLowerCase()));
      return apiSuccess(filtered);
    }

    let query = admin
      .from("farmer_groups")
      .select(`
        id, name, code, village, district, state, description, leader_id, lat, lng, total_acres, created_at,
        users (id, full_name, phone),
        group_memberships (count)
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (village) query = query.ilike("village", `%${village}%`);
    if (district) query = query.ilike("district", `%${district}%`);

    let { data, error } = await query;
    if (error) {
      // Fallback to `clusters` table if `farmer_groups` does not exist
      try {
        let clQuery = admin
          .from("clusters")
          .select("id, name, code, village, district, state, description, lat, lng, total_acres, created_at")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (village) clQuery = clQuery.ilike("village", `%${village}%`);
        if (district) clQuery = clQuery.ilike("district", `%${district}%`);

        const clRes = await clQuery;
        if (!clRes.error && clRes.data) {
          data = clRes.data as any;
          error = null;
        }
      } catch {
        // Continue to error return below
      }
    }

    if (error) {
      return apiError(`Failed to fetch groups: ${error.message}`, { status: 500, details: error });
    }

    const results = (data || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      code: g.code,
      village: g.village,
      district: g.district,
      state: g.state,
      description: g.description,
      leaderId: g.leader_id,
      leaderName: g.users?.full_name,
      leaderPhone: g.users?.phone,
      lat: g.lat,
      lng: g.lng,
      totalAcres: g.total_acres,
      memberCount: g.group_memberships?.[0]?.count ?? 0,
      createdAt: g.created_at,
    }));

    return apiSuccess(results, { meta: { count: results.length } });
  } catch (e) {
    return handleCatchError(e, "api/groups GET");
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = createFarmerGroupSchema.safeParse(json);
    if (!parsed.success) {
      return handleValidationError(parsed.error);
    }

    const val = parsed.data;
    const authUser = await getServerAuthUser(req);
    const leaderId = val.leaderId || authUser?.id || null;

    const admin = getSupabaseAdminOptional();
    if (!admin) {
      return apiSuccess({
        id: crypto.randomUUID(),
        ...val,
        leaderId,
        isDemo: true,
      }, { status: 201 });
    }

    const code = val.code || `${val.village.substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;

    const { data: group, error } = await admin
      .from("farmer_groups")
      .insert({
        name: val.name,
        code,
        village: val.village,
        district: val.district,
        state: val.state,
        description: val.description,
        leader_id: leaderId,
        lat: val.lat,
        lng: val.lng,
        total_acres: val.totalAcres,
      })
      .select()
      .single();

    if (error) {
      return apiError(`Failed to create group: ${error.message}`, { status: 500, details: error });
    }

    // Auto-add leader as coordinator in group_memberships
    if (leaderId) {
      await admin.from("group_memberships").insert({
        group_id: group.id,
        user_id: leaderId,
        role: "coordinator",
        status: "active",
      });
    }

    return apiSuccess(group, { status: 201 });
  } catch (e) {
    return handleCatchError(e, "api/groups POST");
  }
}
