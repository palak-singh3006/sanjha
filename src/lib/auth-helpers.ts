import { NextRequest } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseAdminOptional } from "@/lib/supabase-admin";

export interface SanjhaUser {
  id: string;
  authId?: string | null;
  role: "farmer" | "buyer" | "coordinator" | "admin";
  fullName: string;
  email?: string | null;
  phone?: string | null;
  preferredLanguage: string;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  isDemo?: boolean;
}

export const DEMO_FARMER_USER: SanjhaUser = {
  id: "a1000000-0000-0000-0000-000000000001",
  authId: null,
  role: "farmer",
  fullName: "Sharanappa Gowda",
  email: "farmer.sharanappa@sanjha.network",
  phone: "+91 98450 12345",
  preferredLanguage: "kn",
  village: "Hunasagi",
  district: "Yadgir",
  state: "Karnataka",
  isDemo: true,
};

export const DEMO_COORDINATOR_USER: SanjhaUser = {
  id: "a1000000-0000-0000-0000-000000000002",
  authId: null,
  role: "coordinator",
  fullName: "Basavaraj Patil",
  email: "coord.patil@sanjha.network",
  phone: "+91 98450 23456",
  preferredLanguage: "kn",
  village: "Hunasagi",
  district: "Yadgir",
  state: "Karnataka",
  isDemo: true,
};

/**
 * Resolves the currently authenticated user from either:
 * 1. Supabase SSR session cookies
 * 2. Supabase Bearer token in Authorization header
 * 3. Explicit x-sanjha-user-id header (for automated testing & inter-service calls)
 * 4. Fallback to demo farmer user when Supabase is unconfigured
 */
export async function getServerAuthUser(req?: Request | NextRequest): Promise<SanjhaUser | null> {
  const admin = getSupabaseAdminOptional();

  // 1. Check custom test/dev header if provided
  if (req) {
    const explicitUserId = req.headers.get("x-sanjha-user-id");
    if (explicitUserId) {
      if (admin) {
        const { data: dbUser } = await admin
          .from("users")
          .select("id, auth_id, role, full_name, email, phone, preferred_language, village, district, state")
          .eq("id", explicitUserId)
          .maybeSingle();

        if (dbUser) {
          return {
            id: dbUser.id,
            authId: dbUser.auth_id,
            role: dbUser.role,
            fullName: dbUser.full_name,
            email: dbUser.email,
            phone: dbUser.phone,
            preferredLanguage: dbUser.preferred_language,
            village: dbUser.village,
            district: dbUser.district,
            state: dbUser.state,
          };
        }
      }
      if (explicitUserId === DEMO_COORDINATOR_USER.id) return DEMO_COORDINATOR_USER;
      return { ...DEMO_FARMER_USER, id: explicitUserId };
    }
  }

  // 2. Check Bearer authorization header
  if (req && admin) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      const { data: { user }, error } = await admin.auth.getUser(token);
      if (!error && user) {
        const { data: dbUser } = await admin
          .from("users")
          .select("id, auth_id, role, full_name, email, phone, preferred_language, village, district, state")
          .eq("auth_id", user.id)
          .maybeSingle();

        if (dbUser) {
          return {
            id: dbUser.id,
            authId: dbUser.auth_id,
            role: dbUser.role,
            fullName: dbUser.full_name,
            email: dbUser.email,
            phone: dbUser.phone,
            preferredLanguage: dbUser.preferred_language,
            village: dbUser.village,
            district: dbUser.district,
            state: dbUser.state,
          };
        }
      }
    }
  }

  // 3. Check SSR Cookies
  try {
    const ssrClient = await createServerSupabase();
    if (ssrClient) {
      const { data: { user } } = await ssrClient.auth.getUser();
      if (user && admin) {
        const { data: dbUser } = await admin
          .from("users")
          .select("id, auth_id, role, full_name, email, phone, preferred_language, village, district, state")
          .eq("auth_id", user.id)
          .maybeSingle();

        if (dbUser) {
          return {
            id: dbUser.id,
            authId: dbUser.auth_id,
            role: dbUser.role,
            fullName: dbUser.full_name,
            email: dbUser.email,
            phone: dbUser.phone,
            preferredLanguage: dbUser.preferred_language,
            village: dbUser.village,
            district: dbUser.district,
            state: dbUser.state,
          };
        }
      }
    }
  } catch {
    // SSR auth unavailable or cookies not accessible
  }

  // 4. Fallback to demo user if Supabase is not fully configured
  if (!admin) {
    return DEMO_FARMER_USER;
  }

  return null;
}
