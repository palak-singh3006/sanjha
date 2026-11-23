import { z } from "zod";

export const createFarmerGroupSchema = z.object({
  name: z.string().min(3, "Group name must be at least 3 characters").max(150),
  code: z.string().min(2).max(20).optional(),
  village: z.string().min(2).max(100).default("Hunasagi"),
  district: z.string().min(2).max(100).default("Yadgir"),
  state: z.string().min(2).max(100).default("Karnataka"),
  description: z.string().max(1000).optional().nullable(),
  leaderId: z.string().uuid("Invalid leader UUID").optional().nullable(),
  lat: z.coerce.number().min(-90).max(90).default(16.45),
  lng: z.coerce.number().min(-180).max(180).default(76.45),
  totalAcres: z.coerce.number().nonnegative().default(0),
});

export const updateFarmerGroupSchema = createFarmerGroupSchema.partial();

export const addGroupMemberSchema = z.object({
  userId: z.string().uuid("Invalid user UUID"),
  role: z.enum(["member", "lead", "coordinator"]).default("member"),
  status: z.enum(["pending", "active", "inactive"]).default("active"),
});

export const updateGroupMemberSchema = z.object({
  role: z.enum(["member", "lead", "coordinator"]).optional(),
  status: z.enum(["pending", "active", "inactive"]).optional(),
});
