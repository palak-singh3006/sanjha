import { NextRequest } from 'next/server';
import { formatRouteError } from '@/lib/api-errors';
import { listFarmsForFarmer } from '@/features/crop-intelligence/db';
import { getAuthenticatedFarmer } from '@/features/crop-intelligence/auth-helper';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedFarmer(req);
    if (!auth) {
      return Response.json({ error: 'Unauthenticated farmer' }, { status: 401 });
    }

    const farms = await listFarmsForFarmer(auth.farmerId);
    return Response.json({ farms });
  } catch (e) {
    return Response.json(formatRouteError(e), { status: 500 });
  }
}
