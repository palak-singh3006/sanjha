import { z } from "zod";

export const mandiRecordSchema = z.object({
  crop_name: z.string().min(2).max(100),
  market_name: z.string().min(2).max(150),
  district: z.string().max(100).optional().nullable(),
  state: z.string().min(2).max(100).default("Karnataka"),
  price_min: z.coerce.number().positive(),
  price_max: z.coerce.number().positive(),
  price_modal: z.coerce.number().positive(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .default(() => new Date().toISOString().split("T")[0]),
  source: z.string().default("agmarknet"),
});

export const batchMandiRecordsSchema = z.array(mandiRecordSchema);
