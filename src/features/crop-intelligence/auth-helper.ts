import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export interface AuthContext {
  farmerId: string;
  isDemo?: boolean;
}

/**
 * Resolves the authenticated farmer ID directly from Supabase Auth UID.
 *
 * Live schema verification:
 * - `public.users` DOES NOT EXIST.
 * - `farms.owner_id` references `auth.users.id` directly.
 * - `farmerId` IS the Supabase Auth UID (`user.id`).
 *
 * PRODUCTION SECURITY:
 * - Exclusively reads verified Supabase SSR session via `createClient().auth.getUser()`.
 * - Headers, demo fallbacks, and user-supplied IDs are strictly rejected in production.
 *
 * NON-PRODUCTION (dev/offline):
 * - If Supabase session is absent in development, safely falls back to a dev mock or local farm owner.
 */
export async function getAuthenticatedFarmer(req: NextRequest): Promise<AuthContext | null> {
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Primary: Verified Supabase SSR Cookie Session (Required in production)
  try {
    const supabase = await createClient();
    if (supabase) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!userError && user?.id) {
        return { farmerId: user.id, isDemo: false };
      }
    }
  } catch (err) {
    if (isProduction) {
      console.error('[auth-helper] Production auth verification failed:', err);
      return null;
    }
  }

  // IN PRODUCTION: Stop here. Never trust headers or mock fallbacks.
  if (isProduction) {
    return null;
  }

  // =========================================================================
  // DEVELOPMENT / LOCAL TEST ENVIRONMENT ONLY (NODE_ENV !== 'production')
  // =========================================================================

  // Optional dev header for automated testing if explicitly enabled
  if (process.env.ENABLE_DEV_AUTH_BYPASS === 'true') {
    const devFarmerId = req.headers.get('x-dev-farmer-id');
    if (devFarmerId && /^[0-9a-f-]{36}$/i.test(devFarmerId)) {
      return { farmerId: devFarmerId, isDemo: true };
    }
  }

  // Safe development fallback: find any existing farm's owner_id in local DB
  try {
    const admin = getSupabaseAdmin();
    const { data: sampleFarm } = await admin
      .from('farms')
      .select('owner_id')
      .limit(1)
      .maybeSingle();

    if (sampleFarm?.owner_id) {
      return {
        farmerId: sampleFarm.owner_id,
        isDemo: true,
      };
    }
  } catch {
    // DB not reachable in dev
  }

  // Ultimate local dev offline mock ID
  return {
    farmerId: '00000000-0000-0000-0000-000000000001',
    isDemo: true,
  };
}
