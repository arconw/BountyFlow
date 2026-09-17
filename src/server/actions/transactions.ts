"use server";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireCurrentAccount } from "../auth/current-account";
import { walletLinks } from "../services/wallet-links";
import { bounties } from "../services/bounties";
import { addressSchema } from "../schemas/auth";
import { actionResult } from "./result";
import { rateLimitAccount } from "../http/rate-limit";
export async function authorizeTransaction(value: unknown) {
  return actionResult(async () => {
    const current = await requireCurrentAccount();
    const address = addressSchema.parse(value);
    return (
      !!current.user.username &&
      (await walletLinks.list(current.user.id)).some(
        (wallet) => wallet.address === address,
      )
    );
  });
}
export async function confirmTransaction(value: unknown) {
  return actionResult(async () => {
    const current = await requireCurrentAccount();
    rateLimitAccount(current.user.id, "sync", 60);
    const hash = z
      .string()
      .regex(/^0x[0-9a-fA-F]{64}$/)
      .parse(value);
    const result = await bounties.confirm(hash as `0x${string}`);
    revalidateTag("bounties", { expire: 0 });
    revalidatePath("/", "layout");
    return result;
  });
}
