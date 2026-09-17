"use client";
import { useRouter } from "next/navigation";
import { accountClient } from "@/lib/auth/client";
import { useAccountSession } from "@/components/providers/account-provider";
import { refreshAccount } from "@/server/actions/security";
export function useAuth() {
  const session = useAccountSession();
  const router = useRouter();
  const refresh = async () => {
    const result = await refreshAccount();
    if (result.error) throw new Error(result.error);
    router.refresh();
  };
  const signOut = async () => {
    const result = await accountClient.signOut();
    if (result.error) throw new Error(result.error.code);
    router.replace("/login");
    router.refresh();
  };
  return { authenticated: !!session, session, signOut, refresh };
}
