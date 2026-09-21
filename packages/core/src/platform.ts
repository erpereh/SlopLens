import { z } from "zod";

export const PLATFORM_IDS = ["x", "youtube"] as const;

export const platformSchema = z.enum(PLATFORM_IDS);

export type Platform = z.infer<typeof platformSchema>;
