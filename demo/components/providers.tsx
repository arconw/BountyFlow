"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { PreferencesStoreProvider } from "@/components/providers/preferences-store-provider";
import { PreferencesProvider } from "@/components/preferences/preferences-provider";
import { DemoStateProvider } from "../state/provider";
import { DemoShell } from "./shell";

export function DemoProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="bountyflow_demo_theme"
      disableTransitionOnChange
    >
      <PreferencesStoreProvider>
        <PreferencesProvider>
          <DemoStateProvider>
            <DemoShell>{children}</DemoShell>
          </DemoStateProvider>
        </PreferencesProvider>
      </PreferencesStoreProvider>
    </ThemeProvider>
  );
}
