"use client";
import type { AccountSession } from "@/server/auth/current-account";
import { AccountProvider } from "./account-provider";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { createWagmiConfig } from "@/blockchain/wagmi";
import { WalletProvider } from "./wallet-provider";
import { TransactionProvider } from "./transaction-provider";
import { ThemeProvider } from "next-themes";
import { createQueryClient } from "@/blockchain/query-client";
import { PreferencesStoreProvider } from "./preferences-store-provider";
import { PreferencesProvider } from "@/components/preferences/preferences-provider";

export function AppProviders({
  children,
  session,
}: {
  children: ReactNode;
  session: AccountSession;
}) {
  const [queryClient] = useState(createQueryClient);
  const [wagmiConfig] = useState(createWagmiConfig);
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          enableSystem
          storageKey="bountyboard_theme"
        >
          <AccountProvider session={session}>
            <PreferencesStoreProvider>
              <PreferencesProvider>
                <WalletProvider>
                  <TransactionProvider>{children}</TransactionProvider>
                </WalletProvider>
              </PreferencesProvider>
            </PreferencesStoreProvider>
          </AccountProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
