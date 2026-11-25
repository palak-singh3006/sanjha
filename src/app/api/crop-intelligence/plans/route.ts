import { NextRequest } from 'next/server';
import { formatRouteError } from '@/lib/api-errors';
import { cropPlanBodySchema, formatZodError } from '@/features/crop-intelligence/validations';
import { insertCropPlan, listCropPlans } from '@/features/crop-intelligence/db';
import { getAuthenticatedFarmer } from '@/features/crop-intelligence/auth-helper';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedFarmer(req);
    if (!auth) {
      return Response.json({ error: 'Unauthenticated farmer' }, { status: 401 });
    }

    const plans = await listCropPlans(auth.farmerId);
    return Response.json({ plans, isDemo: auth.isDemo });
  } catch (e) {
    return Response.json(formatRouteError(e), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedFarmer(req);
    if (!auth) {
      return Response.json({ error: 'Unauthenticated farmer' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = cropPlanBodySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(formatZodError(parsed.error), { status: 422 });
    }

    const plan = await insertCropPlan(auth.farmerId, parsed.data);
    return Response.json({ plan }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg.includes('Acreage exceeds') ||
      msg.includes('Farm not found') ||
      msg.includes('does not belong')
    ) {
      return Response.json({ error: msg }, { status: 400 });
    }
    return Response.json(formatRouteError(e), { status: 500 });
  }
}
