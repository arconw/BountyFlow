import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { getAccountAuth } from "./account-auth";
import { walletLinks } from "../services/wallet-links";
import { ApiError } from "../http/errors";

export const currentAccount = cache(async () => {
  const current = await getAccountAuth().api.getSession({
    headers: await headers(),
  });
  return current?.user.emailVerified ? current : null;
});

export async function requireCurrentAccount() {
  const current = await currentAccount();
  if (!current) throw new ApiError("AUTH_REQUIRED", 401);
  return current;
}

export async function accountSession() {
  const current = await currentAccount();
  if (!current) return null;
  return {
    userId: current.user.id,
    email: current.user.email,
    name: current.user.name,
    username: current.user.username,
    twoFactorEnabled: current.user.twoFactorEnabled,
    wallets: await walletLinks.list(current.user.id),
  };
}
export type AccountSession = Awaited<ReturnType<typeof accountSession>>;
