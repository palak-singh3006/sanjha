import { NextRequest } from 'next/server';
import { formatRouteError } from '@/lib/api-errors';
import { communityQuerySchema, formatZodError } from '@/features/crop-intelligence/validations';
import { aggregateCommunityPlans } from '@/features/crop-intelligence/db';
import { analyzeCommunity } from '@/features/crop-intelligence/engine';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawVillage = searchParams.get('village');
    const rawSeason = searchParams.get('season');

    // If village not provided, list all available distinct villages
    if (!rawVillage) {
      const admin = getSupabaseAdmin();
      const { data: villageRows } = await admin
        .from('community_crop_plans')
        .select('village')
        .neq('village', '')
        .limit(100);

      const distinctVillages = Array.from(
        new Set((villageRows ?? []).map((r) => r.village).filter(Boolean)),
      );

      // Default clusters available for selection
      const defaultClusters = ['Hunasagi', 'Shorapur', 'Sindagi'];

      const allVillages = Array.from(
        new Set([...distinctVillages, ...defaultClusters]),
      );

      return Response.json({
        villages: allVillages,
        defaultVillage: allVillages[0] ?? 'Hunasagi',
      });
    }

    const parsed = communityQuerySchema.safeParse({
      village: rawVillage,
      season: rawSeason ?? 'kharif',
    });

    if (!parsed.success) {
      return Response.json(formatZodError(parsed.error), { status: 422 });
    }

    const { village, season } = parsed.data;
    const rawRows = await aggregateCommunityPlans(village, season);
    const insight = analyzeCommunity(rawRows, village, season);

    return Response.json({
      insight,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return Response.json(formatRouteError(e), { status: 500 });
  }
}
