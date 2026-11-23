import { NextRequest } from "next/server";
import { getSupabaseAdminOptional } from "@/lib/supabase-admin";
import { apiSuccess, apiError, handleCatchError } from "@/lib/api-response";
import { farmerProfileSchema } from "@/lib/validations/farmer";

export async function POST(req: NextRequest) {
  try {
    const admin = getSupabaseAdminOptional();
    const body = await req.json();

    const authId = body.authId;
    if (!authId) {
      return apiError("authId is required to sync user profile", { status: 400 });
    }

    const email = body.email || null;
    const fullName = body.fullName || body.name || email?.split("@")[0] || "Farmer";
    const role = body.role || "farmer";
    const village = body.village || "Hunasagi";
    const preferredLanguage = body.preferredLanguage || "kn";

    if (!admin) {
      return apiSuccess({
        id: "a1000000-0000-0000-0000-000000000001",
        authId,
        fullName,
        email,
        role,
        village,
        preferredLanguage,
        isDemo: true,
      });
    }

    // Upsert user
    const { data: user, error: userError } = await admin
      .from("users")
      .upsert(
        {
          auth_id: authId,
          full_name: fullName,
          email,
          role,
          village,
          preferred_language: preferredLanguage,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "auth_id" },
      )
      .select()
      .single();

    if (userError) {
      return apiError(`Failed to sync user: ${userError.message}`, {
        status: 500,
        details: userError,
      });
    }

    // If farmer, upsert profile
    if (role === "farmer") {
      await admin
        .from("farmer_profiles")
        .upsert(
          {
            user_id: user.id,
            experience_years: body.experienceYears ?? 5,
            total_land_acres: body.totalLandAcres ?? 3.5,
            primary_crops: body.primaryCrops ?? ["Tomato", "Onion"],
            has_irrigation: body.hasIrrigation ?? true,
            kyc_status: "verified",
          },
          { onConflict: "user_id" },
        );
    }

    return apiSuccess({ user });
  } catch (e) {
    return handleCatchError(e, "api/auth/sync POST");
  }
}
