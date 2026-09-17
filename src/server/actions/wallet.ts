"use server";
import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireCurrentAccount } from "../auth/current-account";
import { accountOrigin } from "../auth/runtime-config";
import { challengeSchema, verifySchema } from "../schemas/auth";
import { walletLinks } from "../services/wallet-links";
import { challengeCookieName } from "../services/wallet-link-service";
import { actionResult } from "./result";
import { rateLimitAccount } from "../http/rate-limit";
export async function challengeWallet(value: unknown) {
  return actionResult(async () => {
    const current = await requireCurrentAccount();
    rateLimitAccount(current.user.id, "wallet");
    const { address } = challengeSchema.parse(value);
    const origin = new URL(accountOrigin());
    const result = await walletLinks.challenge(
      current.user.id,
      address,
      origin,
    );
    (await cookies()).set(challengeCookieName, result.handle, {
      httpOnly: true,
      sameSite: "lax",
      secure: origin.protocol === "https:",
      path: "/",
      maxAge: 300,
    });
    return { message: result.message };
  });
}
export async function verifyWallet(value: unknown) {
  return actionResult(async () => {
    const current = await requireCurrentAccount();
    rateLimitAccount(current.user.id, "wallet");
    const { signature } = verifySchema.parse(value);
    const jar = await cookies();
    await walletLinks.verify(
      current.user.id,
      jar.get(challengeCookieName)?.value,
      signature as `0x${string}`,
    );
    jar.delete(challengeCookieName);
    revalidateTag("bounties", { expire: 0 });
    revalidatePath("/", "layout");
    return true;
  });
}
