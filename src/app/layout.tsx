import { accountSession } from "@/server/auth/current-account";
import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/geist-mono/400.css";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "BountyBoard — Good work. Fair rewards.",
  description:
    "Find meaningful work and earn on-chain. A developer bounty marketplace with ETH escrow, account security, and multilingual profiles.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await accountSession();
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders session={session}>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
