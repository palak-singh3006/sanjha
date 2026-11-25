import { NextRequest } from "next/server";
import { getSupabaseAdminOptional } from "@/lib/supabase-admin";
import { apiSuccess, apiError, handleValidationError, handleCatchError } from "@/lib/api-response";
import { updateFarmerProfileSchema } from "@/lib/validations/farmer";

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
        fullName: "Sharanappa Gowda",
        phone: "+91 98450 12345",
        email: "farmer.sharanappa@sanjha.network",
        role: "farmer",
        preferredLanguage: "kn",
        village: "Hunasagi",
        district: "Yadgir",
        state: "Karnataka",
        profile: {
          experienceYears: 12,
          totalLandAcres: 3.5,
          primaryCrops: ["Tomato", "Onion", "Chilli"],
          hasIrrigation: true,
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
        cropPlans: [
          {
            id: "d1000000-0000-0000-0000-000000000001",
            cropName: "Tomato",
            variety: "Abhinav Hybrid",
            areaAcres: 1.5,
            status: "growing",
            expectedHarvestDate: "2026-12-05",
            driScore: 42,
          },
        ],
      });
    }

    let user: any = null;
    try {
      const { data, error } = await admin
        .from("users")
        .select(`
          id, auth_id, full_name, phone, email, role, preferred_language, village, district, state, created_at,
          farmer_profiles (
            experience_years, total_land_acres, primary_crops, has_irrigation, irrigation_sources, kyc_status, aadhaar_last4, upi_id, annual_income_range, cooperative_name
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        user = data;
      }
    } catch {
      // public.users not present
    }

    if (!user) {
      // Check if farm ID was passed or fallback to first cluster farm
      const { data: farm } = await admin
        .from("farms")
        .select("id, name, area_acres, soil_type, lat, lng, cluster_id, clusters(name)")
        .or(`id.eq.${id},cluster_id.eq.${id}`)
        .limit(1)
        .maybeSingle();

      const farmName = farm?.name || "Sharanappa Gowda";
      const clusterObj: any = Array.isArray(farm?.clusters) ? farm?.clusters[0] : farm?.clusters;
      const village = clusterObj?.name?.includes("Kembhavi") ? "Kembhavi" : clusterObj?.name?.includes("Shorapur") ? "Shorapur" : "Hunasagi";

      const { data: cropPlans } = await admin
        .from("crop_plans")
        .select("id, farm_id, crop_name, sow_date, expected_harvest_date, recommended_harvest_date, dri_score, market_pressure, quantity_kg, status")
        .limit(5);

      return apiSuccess({
        id,
        fullName: farmName.replace(/Field|Plot|Farm|Acreage|Cooperative/gi, "Farmer").trim(),
        phone: "+91 98450 12345",
        email: "farmer@sanjha.in",
        role: "farmer",
        preferredLanguage: "kn",
        village,
        district: "Yadgir",
        state: "Karnataka",
        profile: {
          experienceYears: 12,
          totalLandAcres: Number(farm?.area_acres || 3.5),
          primaryCrops: ["Tomato", "Onion"],
          hasIrrigation: true,
          irrigationSources: ["drip", "canal"],
          kycStatus: "verified",
          cooperativeName: `${village} Raitha Sangha`,
        },
        farms: farm ? [{
          ...farm,
          acres: Number(farm.area_acres || 3.5),
          village,
          district: "Yadgir",
          state: "Karnataka",
        }] : [],
        cropPlans: (cropPlans || []).map((cp: any) => ({
          id: cp.id,
          farmId: cp.farm_id,
          cropName: cp.crop_name,
          sowingDate: cp.sow_date,
          sowDate: cp.sow_date,
          expectedHarvestDate: cp.expected_harvest_date,
          recommendedHarvestDate: cp.recommended_harvest_date,
          driScore: cp.dri_score,
          marketPressure: cp.market_pressure,
          estimatedYieldKg: cp.quantity_kg,
          status: cp.status,
        })),
      });
    }

    // Fetch user's farms using schema-aligned columns
    const { data: farms } = await admin
      .from("farms")
      .select("id, name, area_acres, soil_type, lat, lng, cluster_id, clusters(name)")
      .eq("owner_id", id);

    // Fetch user's active crop plans across farms
    const farmIds = (farms || []).map((f: any) => f.id);
    let cropPlans: any[] = [];
    if (farmIds.length > 0) {
      const { data: crops } = await admin
        .from("crop_plans")
        .select("id, farm_id, crop_name, sow_date, expected_harvest_date, recommended_harvest_date, dri_score, market_pressure, quantity_kg, status")
        .in("farm_id", farmIds);
      cropPlans = (crops || []).map((cp: any) => ({
        id: cp.id,
        farmId: cp.farm_id,
        cropName: cp.crop_name,
        sowingDate: cp.sow_date,
        sowDate: cp.sow_date,
        expectedHarvestDate: cp.expected_harvest_date,
        recommendedHarvestDate: cp.recommended_harvest_date,
        driScore: cp.dri_score,
        marketPressure: cp.market_pressure,
        estimatedYieldKg: cp.quantity_kg,
        status: cp.status,
      }));
    }

    return apiSuccess({
      id: user.id,
      fullName: user.full_name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      preferredLanguage: user.preferred_language,
      village: user.village,
      district: user.district,
      state: user.state,
      profile: user.farmer_profiles ?? null,
      farms: (farms || []).map((f: any) => ({
        ...f,
        acres: Number(f.area_acres || 2.5),
        village: user.village || "Hunasagi",
        district: user.district || "Yadgir",
        state: user.state || "Karnataka",
      })),
      cropPlans,
    });
  } catch (e) {
    return handleCatchError(e, "api/farmers/[id] GET");
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const json = await req.json();
    const parsed = updateFarmerProfileSchema.safeParse(json);
    if (!parsed.success) {
      return handleValidationError(parsed.error);
    }

    const val = parsed.data;
    const admin = getSupabaseAdminOptional();
    if (!admin) {
      return apiSuccess({ id, ...val, updated: true, isDemo: true });
    }

    // Update user table fields if present
    const userUpdates: Record<string, unknown> = {};
    if (val.fullName) userUpdates.full_name = val.fullName;
    if (val.phone !== undefined) userUpdates.phone = val.phone;
    if (val.preferredLanguage) userUpdates.preferred_language = val.preferredLanguage;
    if (val.village) userUpdates.village = val.village;
    if (val.district) userUpdates.district = val.district;
    if (val.state) userUpdates.state = val.state;

    if (Object.keys(userUpdates).length > 0) {
      userUpdates.updated_at = new Date().toISOString();
      await admin.from("users").update(userUpdates).eq("id", id);
    }

    // Update farmer_profiles table fields if present
    const profileUpdates: Record<string, unknown> = {};
    if (val.experienceYears !== undefined) profileUpdates.experience_years = val.experienceYears;
    if (val.totalLandAcres !== undefined) profileUpdates.total_land_acres = val.totalLandAcres;
    if (val.primaryCrops !== undefined) profileUpdates.primary_crops = val.primaryCrops;
    if (val.hasIrrigation !== undefined) profileUpdates.has_irrigation = val.hasIrrigation;
    if (val.irrigationSources !== undefined) profileUpdates.irrigation_sources = val.irrigationSources;
    if (val.kycStatus !== undefined) profileUpdates.kyc_status = val.kycStatus;
    if (val.upiId !== undefined) profileUpdates.upi_id = val.upiId;
    if (val.cooperativeName !== undefined) profileUpdates.cooperative_name = val.cooperativeName;

    if (Object.keys(profileUpdates).length > 0) {
      profileUpdates.updated_at = new Date().toISOString();
      await admin.from("farmer_profiles").update(profileUpdates).eq("user_id", id);
    }

    return apiSuccess({ id, updated: true });
  } catch (e) {
    return handleCatchError(e, "api/farmers/[id] PATCH");
  }
}
