/**
 * Database access layer for Community Crop Intelligence.
 * Server-only — uses service_role key via getSupabaseAdmin().
 *
 * Verified Live Schema:
 * - `public.users` DOES NOT EXIST.
 * - `public.farms` has: id, owner_id (matches auth.users.id), name, area_acres, soil_type, cluster_id.
 * - `farmerId` IS the Supabase Auth UID.
 * - Table name: `public.community_crop_plans` (distinct from legacy crop_plans).
 */
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import type { CropPlan, CropPlanInsert, CropPlanUpdate, FarmOption } from './types';

/** List farms owned by this farmer (owner_id matches Supabase Auth UID) */
export async function listFarmsForFarmer(farmerId: string): Promise<FarmOption[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('farms')
    .select('id, name, area_acres, soil_type, cluster_id')
    .eq('owner_id', farmerId)
    .order('name');

  if (error) throw new Error(error.message);

  return ((data ?? []) as { id: string; name: string; area_acres: number | null; soil_type: string | null; cluster_id?: string | null }[]).map(
    (f) => ({
      ...f,
      acres: f.area_acres, // backward compatibility helper
    }),
  );
}

/** Create a crop plan — farmer_id always set server-side from authenticated Auth UID */
export async function insertCropPlan(
  farmerId: string,
  payload: Omit<CropPlanInsert, 'farmer_id'>,
): Promise<CropPlan> {
  const admin = getSupabaseAdmin();

  // Verify farm ownership: farms.owner_id === farmerId (Auth UID)
  const { data: farm } = await admin
    .from('farms')
    .select('id, area_acres')
    .eq('id', payload.farm_id)
    .eq('owner_id', farmerId)
    .maybeSingle();

  if (!farm) throw new Error('Farm not found or does not belong to this farmer');

  // Guard acreage vs. existing allocations on this farm in community_crop_plans
  if (farm.area_acres != null) {
    const { data: existing } = await admin
      .from('community_crop_plans')
      .select('acreage')
      .eq('farm_id', payload.farm_id);

    const usedAcreage = (existing ?? []).reduce((s, r) => s + Number(r.acreage), 0);
    if (usedAcreage + payload.acreage > Number(farm.area_acres)) {
      throw new Error(
        `Acreage exceeds farm capacity. Farm has ${farm.area_acres} acres, ${usedAcreage.toFixed(2)} already allocated. You can allocate up to ${(Number(farm.area_acres) - usedAcreage).toFixed(2)} more acres.`,
      );
    }
  }

  const { data, error } = await admin
    .from('community_crop_plans')
    .insert({ ...payload, farmer_id: farmerId })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Insert failed');
  return data as CropPlan;
}

/** List all crop plans for a farmer, newest first */
export async function listCropPlans(farmerId: string): Promise<CropPlan[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('community_crop_plans')
    .select('*')
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as CropPlan[];
}

/** Update a crop plan — only if it belongs to this farmer and passes ownership checks */
export async function updateCropPlan(
  id: string,
  farmerId: string,
  patch: CropPlanUpdate,
): Promise<CropPlan> {
  const admin = getSupabaseAdmin();

  // 1. Verify existence and ownership of this plan
  const { data: existingPlan, error: findError } = await admin
    .from('community_crop_plans')
    .select('*')
    .eq('id', id)
    .eq('farmer_id', farmerId)
    .maybeSingle();

  if (findError || !existingPlan) {
    throw new Error('Crop plan not found or you are not authorized to update it');
  }

  const targetFarmId = patch.farm_id || existingPlan.farm_id;
  const targetAcreage = patch.acreage !== undefined ? Number(patch.acreage) : Number(existingPlan.acreage);

  // 2. If farm_id is being updated, verify ownership of the target farm
  if (patch.farm_id && patch.farm_id !== existingPlan.farm_id) {
    const { data: targetFarm } = await admin
      .from('farms')
      .select('id, owner_id')
      .eq('id', patch.farm_id)
      .eq('owner_id', farmerId)
      .maybeSingle();

    if (!targetFarm) {
      throw new Error('Target farm does not belong to this farmer');
    }
  }

  // 3. Verify farm capacity against other plans on this farm
  const { data: farm } = await admin
    .from('farms')
    .select('id, area_acres')
    .eq('id', targetFarmId)
    .maybeSingle();

  if (farm && farm.area_acres != null) {
    const { data: otherPlans } = await admin
      .from('community_crop_plans')
      .select('id, acreage')
      .eq('farm_id', targetFarmId)
      .neq('id', id);

    const usedAcreage = (otherPlans ?? []).reduce((s, r) => s + Number(r.acreage), 0);
    if (usedAcreage + targetAcreage > Number(farm.area_acres)) {
      throw new Error(
        `Acreage exceeds farm capacity. Farm has ${farm.area_acres} acres, ${usedAcreage.toFixed(2)} already allocated by your other plans.`,
      );
    }
  }

  // 4. Safe update — prevent farmer_id spoofing
  const safePatch = { ...patch };
  delete (safePatch as Record<string, unknown>).farmer_id;
  delete (safePatch as Record<string, unknown>).id;

  const { data, error } = await admin
    .from('community_crop_plans')
    .update(safePatch)
    .eq('id', id)
    .eq('farmer_id', farmerId)
    .select()
    .single();

  if (error || !data)
    throw new Error(error?.message ?? 'Update failed — record not found or not authorised');
  return data as CropPlan;
}

/** Delete a crop plan — only if it belongs to this farmer */
export async function deleteCropPlan(id: string, farmerId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('community_crop_plans')
    .delete()
    .eq('id', id)
    .eq('farmer_id', farmerId);

  if (error) throw new Error(error.message);
}

/**
 * Aggregate crop plans for community insight (server-side only).
 * Returns ONLY: crop_name, acreage, farmer_id — no personal data.
 * Never expose the returned rows directly to the client.
 */
export async function aggregateCommunityPlans(
  village: string,
  season: string,
): Promise<{ crop_name: string; acreage: number; farmer_id: string }[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('community_crop_plans')
    .select('crop_name, acreage, farmer_id')
    .eq('village', village)
    .eq('season', season);

  if (error) throw new Error(error.message);
  return (data ?? []) as { crop_name: string; acreage: number; farmer_id: string }[];
}
