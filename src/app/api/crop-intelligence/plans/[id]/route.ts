import { NextRequest } from 'next/server';
import { formatRouteError } from '@/lib/api-errors';
import { cropPlanUpdateSchema, formatZodError } from '@/features/crop-intelligence/validations';
import { updateCropPlan, deleteCropPlan } from '@/features/crop-intelligence/db';
import { getAuthenticatedFarmer } from '@/features/crop-intelligence/auth-helper';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await getAuthenticatedFarmer(req);
    if (!auth) {
      return Response.json({ error: 'Unauthenticated farmer' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = cropPlanUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(formatZodError(parsed.error), { status: 422 });
    }

    const plan = await updateCropPlan(id, auth.farmerId, parsed.data);
    return Response.json({ plan });
  } catch (e) {
    return Response.json(formatRouteError(e), { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await getAuthenticatedFarmer(req);
    if (!auth) {
      return Response.json({ error: 'Unauthenticated farmer' }, { status: 401 });
    }

    await deleteCropPlan(id, auth.farmerId);
    return Response.json({ success: true, id });
  } catch (e) {
    return Response.json(formatRouteError(e), { status: 500 });
  }
}
