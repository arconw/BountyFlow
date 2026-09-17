import { Text } from "@/i18n/text";
import type { ReactNode } from "react";
import { Header } from "./layout/header";
import { Footer } from "./layout/footer";
import { NetworkBanner } from "./layout/network-banner";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        <Text id="skip_to_content" />
      </a>
      <Header />
      <NetworkBanner />
      <main id="main" className="main-content">
        {children}
      </main>
      <Footer />
    </>
  );
}
