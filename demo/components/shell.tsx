"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { Plus, Code2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/preferences/theme-toggle";
import { DemoNavigation } from "./navigation";
import { DemoBanner } from "./demo-banner";
import { DemoTransactionDialog } from "./transaction-dialog";
import { useDemo } from "../state/provider";
import { demoPeople } from "../fixtures/people";

export function DemoShell({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const { state } = useDemo();
  useEffect(() => {
    document.title = `BountyBoard — ${t("demo_label")}`;
  }, [t]);
  return (
    <>
      <a className="skip-link" href="#main">
        {t("skip_to_content")}
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand" aria-label={t("bountyboard_home")}>
            <span className="brand-mark">
              <span />
              <span />
              <span />
            </span>
            BountyBoard<span className="brand-beta">{t("demo_label")}</span>
          </Link>
          <DemoNavigation />
          <div className="header-actions">
            <ThemeToggle />
            <Link href="/create/" className="header-create">
              <Plus size={16} />
              <span>{t("create_bounty")}</span>
            </Link>
            <Link
              href="/profile/"
              className="button button-secondary account-button demo-account"
            >
              {demoPeople[state.role].username}
            </Link>
          </div>
        </div>
      </header>
      <DemoBanner />
      <main id="main" className="main-content">
        {children}
      </main>
      <footer className="site-footer">
        <div>
          <span className="footer-brand">BountyBoard</span>
          <span>{t("demo_local_notice")}</span>
        </div>
        <a
          href="https://github.com/arconw/BountyFlow"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-security"
        >
          <Code2 size={14} />
          {t("demo_review_code")}
        </a>
      </footer>
      <DemoTransactionDialog />
    </>
  );
}
