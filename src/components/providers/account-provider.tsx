"use client";
import { useRouteRefresh } from "@/hooks/use-route-refresh";
import { createContext, useContext, type ReactNode } from "react";
import type { AccountSession } from "@/server/auth/current-account";
const AccountContext = createContext<{ session: AccountSession } | null>(null);
export function AccountProvider({
  session,
  children,
}: {
  session: AccountSession;
  children: ReactNode;
}) {
  useRouteRefresh();
  return (
    <AccountContext.Provider value={{ session }}>
      {children}
    </AccountContext.Provider>
  );
}
export function useAccountSession() {
  const account = useContext(AccountContext);
  if (!account) throw new Error("AccountProvider is required");
  return account.session;
}
