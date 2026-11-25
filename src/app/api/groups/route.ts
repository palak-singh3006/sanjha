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
      .from("clusters")
      .select("id, name, center_lat, center_lng, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (village) query = query.ilike("name", `%${village}%`);

    const { data, error } = await query;
    if (error) {
      return apiError(`Failed to fetch groups: ${error.message}`, { status: 500, details: error });
    }

    const results = (data || []).map((g: any) => {
      const isKembhavi = g.name?.toLowerCase().includes("kembhavi");
      const isShorapur = g.name?.toLowerCase().includes("shorapur");
      const villageName = isKembhavi ? "Kembhavi" : isShorapur ? "Shorapur" : "Hunasagi";
      const code = isKembhavi ? "KEM-01" : isShorapur ? "SHO-01" : "HUN-01";
      return {
        id: g.id,
        name: g.name,
        code,
        village: villageName,
        district: "Yadgir",
        state: "Karnataka",
        description: `Agricultural producer cluster in ${villageName}, Yadgir.`,
        lat: Number(g.center_lat ?? 16.45),
        lng: Number(g.center_lng ?? 76.45),
        centerLat: Number(g.center_lat ?? 16.45),
        centerLng: Number(g.center_lng ?? 76.45),
        totalAcres: 150.0,
        memberCount: isKembhavi ? 68 : isShorapur ? 96 : 84,
        createdAt: g.created_at,
      };
    });

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
      .from("clusters")
      .insert({
        name: val.name,
        center_lat: val.lat ?? 16.45,
        center_lng: val.lng ?? 76.45,
      })
      .select()
      .single();

    if (error) {
      return apiError(`Failed to create cluster: ${error.message}`, { status: 500, details: error });
    }

    return apiSuccess({
      ...group,
      code,
      village: val.village,
      district: val.district || "Yadgir",
      state: val.state || "Karnataka",
      description: val.description || `Agricultural producer cluster in ${val.village}, Yadgir.`,
      lat: group.center_lat,
      lng: group.center_lng,
      centerLat: group.center_lat,
      centerLng: group.center_lng,
      totalAcres: val.totalAcres || 150.0,
      memberCount: 20,
    }, { status: 201 });
  } catch (e) {
    return handleCatchError(e, "api/groups POST");
  }
}
