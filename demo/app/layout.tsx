import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/geist-mono/400.css";
import "../../src/app/globals.css";
import "../styles/demo.css";
import { DemoProviders } from "../components/providers";

export const metadata: Metadata = {
  title: "BountyBoard — Interactive demo",
  description:
    "Explore BountyFlow: an open-source bounty marketplace with escrow workflows, eight languages, and a polished interface. Safe browser-only demo; no wallet or real funds.",
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <DemoProviders>{children}</DemoProviders>
      </body>
    </html>
  );
}
