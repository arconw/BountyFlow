import { z } from "zod";
import { skillSelectionSchema } from "./skill-schema";

export const onchainBountyMetadataSchema = z.object({
  title: z.string().trim().min(8).max(120),
  description: z.string().trim().min(20).max(6000),
  tags: z.array(z.string().trim().min(1).max(40)).max(12),
  category: z.enum(["Development", "Design", "Writing", "Research"]),
});
export const bountyMetadataSchema = onchainBountyMetadataSchema.extend({
  tags: skillSelectionSchema,
});
export const maxMetadataBytes = 12000;
export function metadataFitsContract(value: unknown) {
  return (
    new TextEncoder().encode(JSON.stringify(value)).byteLength <=
    maxMetadataBytes
  );
}
export type BountyMetadata = z.infer<typeof bountyMetadataSchema>;
export const rewardSchema = z
  .string()
  .regex(/^\d+(\.\d{1,4})?$/)
  .refine((value) => Number(value) >= 0.0001 && Number(value) < 1_000_000);
