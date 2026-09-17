"use client";
import { useRouter } from "next/navigation";
import { useWalletLink } from "./use-wallet-link";
export function useBountyAccess() {
  const { auth, linked } = useWalletLink();
  const router = useRouter();
  function requireAccount() {
    if (auth.authenticated) return true;
    router.push("/login");
    return false;
  }
  function requireWallet() {
    if (!requireAccount()) return false;
    if (!linked || !auth.session?.username) {
      router.push("/profile");
      return false;
    }
    return true;
  }
  return { authenticated: auth.authenticated, requireAccount, requireWallet };
}
