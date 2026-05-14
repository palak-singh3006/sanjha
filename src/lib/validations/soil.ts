import { z } from "zod";

export const farmingMethodSchema = z.enum([
  "organic",
  "mixed",
  "conventional",
  "intensive_mono",
  "waterlogged_practice",
]);

/** POST /api/soil/analyze */
export const soilAnalyzeBodySchema = z.object({
  farmId: z.string().uuid("farmId must be a valid UUID"),
  previousCrop: z
    .string()
    .min(1, "previousCrop required")
    .max(80)
    .transform((s) => s.trim()),
  soilType: z
    .string()
    .min(1, "soilType required")
    .max(40)
    .transform((s) => s.trim().toLowerCase()),
  farmingMethod: farmingMethodSchema,
  weeksSinceHarvest: z.coerce
    .number()
    .int()
    .min(0, "weeksSinceHarvest cannot be negative")
    .max(520, "weeksSinceHarvest unrealistically high"),
  /** When true (default), call Gemini for farmer-friendly advisory text if GEMINI_API_KEY is set */
  useAi: z.boolean().optional().default(true),
});

/** GET /api/soil/history */
export const soilHistoryQuerySchema = z.object({
  farmId: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
});

/** GET /api/soil/recommendations — useAi: omit or true = Gemini on; 0/false = off */
export const soilRecommendationsQuerySchema = z.object({
  crop: z.string().min(1).max(80).transform((s) => s.trim().toLowerCase()),
  soil: z.string().min(1).max(40).transform((s) => s.trim().toLowerCase()),
  useAi: z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined || v === "") return true;
      const x = v.toLowerCase();
      if (x === "0" || x === "false" || x === "no") return false;
      return true;
    }),
});

/** POST /api/soil/sensor-ingest */
export const soilSensorIngestBodySchema = z.object({
  farmId: z.string().uuid(),
  nitrogen: z.number().finite().optional(),
  phosphorus: z.number().finite().optional(),
  potassium: z.number().finite().optional(),
  moisture: z.number().finite().optional(),
  ph: z.number().min(0).max(14).optional(),
});

export function formatZodError(err: z.ZodError) {
  return {
    error: "Validation failed",
    issues: err.flatten().fieldErrors,
  };
}
