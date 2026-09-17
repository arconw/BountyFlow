import { z } from "zod";
import { isAddress } from "viem";

export const addressSchema = z
  .string()
  .refine(isAddress)
  .transform((value) => value.toLowerCase() as `0x${string}`);
export const challengeSchema = z.object({ address: addressSchema });
export const verifySchema = z.object({
  signature: z
    .string()
    .regex(/^0x[0-9a-fA-F]+$/)
    .max(4096),
});
