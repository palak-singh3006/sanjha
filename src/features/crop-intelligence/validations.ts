import { z } from 'zod';
import { SEASONS } from './types';

export const cropPlanBodySchema = z.object({
  farm_id: z.string().uuid('farm_id must be a valid UUID'),
  village: z.string().min(1, 'Village is required').max(120).transform((s) => s.trim()),
  crop_name: z
    .string()
    .min(1, 'Crop name is required')
    .max(80)
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, 'Crop name must not be blank'),
  acreage: z.coerce
    .number({ invalid_type_error: 'Acreage must be a number' })
    .positive('Acreage must be greater than zero')
    .max(10000, 'Acreage seems unrealistically high (max 10,000 acres)'),
  season: z.enum(SEASONS, {
    errorMap: () => ({ message: 'Season must be one of: kharif, rabi, zaid, annual' }),
  }),
  sowing_period: z.string().max(80).optional().nullable(),
  harvest_period: z.string().max(80).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type CropPlanBody = z.infer<typeof cropPlanBodySchema>;

export const cropPlanUpdateSchema = cropPlanBodySchema
  .partial()
  .omit({ farm_id: true })
  .extend({
    farm_id: z.string().uuid().optional(),
  });

export const communityQuerySchema = z.object({
  village: z.string().min(1, 'Village required').max(120).transform((s) => s.trim()),
  season: z.enum(SEASONS, {
    errorMap: () => ({ message: 'Invalid season' }),
  }),
});

export const yieldPredictionSchema = z.object({
  crop: z.string().min(1, 'Crop name required').max(50),
  rainfall_mm: z.coerce.number().min(0).max(5000),
  temperature_c: z.coerce.number().min(-10).max(60),
  nitrogen: z.coerce.number().min(0).max(500).optional(),
  phosphorus: z.coerce.number().min(0).max(500).optional(),
  potassium: z.coerce.number().min(0).max(500).optional(),
  soil_type: z.string().max(50).optional(),
  season: z.string().max(50).optional(),
});

export function formatZodError(err: z.ZodError) {
  return { error: 'Validation failed', issues: err.flatten().fieldErrors };
}
