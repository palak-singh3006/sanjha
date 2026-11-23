import { NextRequest } from "next/server";
import { getSupabaseAdminOptional } from "@/lib/supabase-admin";
import { apiSuccess, apiError, handleValidationError, handleCatchError } from "@/lib/api-response";
import { farmerProfileSchema } from "@/lib/validations/farmer";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const village = searchParams.get("village");
    const district = searchParams.get("district");
    const crop = searchParams.get("crop");
    const limit = Math.min(Number(searchParams.get("limit") || "50"), 100);

    const admin = getSupabaseAdminOptional();
    if (!admin) {
      // Demo fallback list
      return apiSuccess([
        {
          id: "a1000000-0000-0000-0000-000000000001",
          fullName: "Sharanappa Gowda",
          phone: "+91 98450 12345",
          email: "farmer.sharanappa@sanjha.network",
          role: "farmer",
          village: "Hunasagi",
          district: "Yadgir",
          experienceYears: 12,
          totalLandAcres: 3.5,
          primaryCrops: ["Tomato", "Onion", "Chilli"],
          kycStatus: "verified",
          cooperativeName: "Hunasagi Raitha Sangha",
        },
        {
          id: "a1000000-0000-0000-0000-000000000004",
          fullName: "Renuka Devi",
          phone: "+91 98450 45678",
          email: "farmer.renuka@sanjha.network",
          role: "farmer",
          village: "Hunasagi",
          district: "Yadgir",
          experienceYears: 8,
          totalLandAcres: 2.0,
          primaryCrops: ["Tomato", "Wheat"],
          kycStatus: "verified",
          cooperativeName: "Hunasagi Raitha Sangha",
        },
      ]);
    }

    let query = admin
      .from("users")
      .select(`
        id, auth_id, full_name, phone, email, role, preferred_language, village, district, state,
        farmer_profiles (
          experience_years, total_land_acres, primary_crops, has_irrigation, irrigation_sources, kyc_status, cooperative_name, upi_id
        )
      `)
      .eq("role", "farmer")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (village) query = query.ilike("village", `%${village}%`);
    if (district) query = query.ilike("district", `%${district}%`);

    const { data, error } = await query;
    if (error) {
      return apiError(`Failed to fetch farmers: ${error.message}`, { status: 500, details: error });
    }

    let results = (data || []).map((u: any) => ({
      id: u.id,
      fullName: u.full_name,
      phone: u.phone,
      email: u.email,
      role: u.role,
      preferredLanguage: u.preferred_language,
      village: u.village,
      district: u.district,
      state: u.state,
      experienceYears: u.farmer_profiles?.experience_years ?? 0,
      totalLandAcres: u.farmer_profiles?.total_land_acres ?? 0,
      primaryCrops: u.farmer_profiles?.primary_crops ?? [],
      hasIrrigation: u.farmer_profiles?.has_irrigation ?? false,
      kycStatus: u.farmer_profiles?.kyc_status ?? "pending",
      cooperativeName: u.farmer_profiles?.cooperative_name,
    }));

    if (crop) {
      const lower = crop.toLowerCase();
      results = results.filter((r: any) =>
        r.primaryCrops.some((c: string) => c.toLowerCase().includes(lower)),
      );
    }

    return apiSuccess(results, { meta: { count: results.length } });
  } catch (e) {
    return handleCatchError(e, "api/farmers GET");
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = farmerProfileSchema.safeParse(json);
    if (!parsed.success) {
      return handleValidationError(parsed.error);
    }

    const val = parsed.data;
    const admin = getSupabaseAdminOptional();
    if (!admin) {
      return apiSuccess({
        id: crypto.randomUUID(),
        ...val,
        isDemo: true,
      }, { status: 201 });
    }

    // 1. Insert user
    const { data: user, error: userError } = await admin
      .from("users")
      .insert({
        full_name: val.fullName,
        phone: val.phone,
        email: val.email,
        role: val.role,
        preferred_language: val.preferredLanguage,
        village: val.village,
        district: val.district,
        state: val.state,
      })
      .select()
      .single();

    if (userError) {
      return apiError(`Failed to create farmer user: ${userError.message}`, {
        status: 500,
        details: userError,
      });
    }

    // 2. Insert farmer profile
    const { data: profile, error: profileError } = await admin
      .from("farmer_profiles")
      .insert({
        user_id: user.id,
        experience_years: val.experienceYears,
        total_land_acres: val.totalLandAcres,
        primary_crops: val.primaryCrops,
        has_irrigation: val.hasIrrigation,
        irrigation_sources: val.irrigationSources,
        kyc_status: val.kycStatus,
        aadhaar_last4: val.aadhaarLast4,
        upi_id: val.upiId,
        annual_income_range: val.annualIncomeRange,
        cooperative_name: val.cooperativeName,
      })
      .select()
      .single();

    if (profileError) {
      return apiError(`Failed to create farmer profile: ${profileError.message}`, {
        status: 500,
        details: profileError,
      });
    }

    return apiSuccess(
      {
        id: user.id,
        fullName: user.full_name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        village: user.village,
        district: user.district,
        state: user.state,
        profile,
      },
      { status: 201 },
    );
  } catch (e) {
    return handleCatchError(e, "api/farmers POST");
  }
}
