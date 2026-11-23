import { z } from "zod";

export const createCropPlanSchema = z.object({
  farmId: z.string().uuid("Invalid farm UUID"),
  cropName: z.string().min(2, "Crop name required").max(80),
  variety: z.string().max(100).optional().nullable(),
  season: z.enum(["Kharif", "Rabi", "Zaid", "Perennial"]).default("Kharif"),
  areaAcres: z.coerce.number().positive("Area must be positive").max(1000),
  sowingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "sowingDate must be YYYY-MM-DD").default(() => new Date().toISOString().split("T")[0]),
  expectedHarvestDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expectedHarvestDate must be YYYY-MM-DD"),
  recommendedHarvestDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "recommendedHarvestDate must be YYYY-MM-DD").optional().nullable(),
  status: z
    .enum(["planning", "sown", "growing", "harvest_ready", "harvested", "failed"])
    .default("growing"),
  estimatedYieldKg: z.coerce.number().nonnegative().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateCropPlanSchema = createCropPlanSchema.partial().extend({
  driScore: z.coerce.number().min(0).max(100).optional(),
  marketPressure: z.coerce.number().min(0).max(100).optional(),
});
