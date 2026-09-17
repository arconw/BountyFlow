"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

import { ThemeToggle } from "@/components/preferences/theme-toggle";
import { MainNav } from "./main-nav";

export function Brand() {
  const t = useTranslations();
  return (
    <Link href="/" className="brand" aria-label={t("bountyboard_home")}>
      <span className="brand-mark">
        <span />
        <span />
        <span />
      </span>
      BountyBoard<span className="brand-beta">beta</span>
    </Link>
  );
}

export function Header() {
  const t = useTranslations();
  const auth = useAuth();
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <MainNav />
        <div className="header-actions">
          <ThemeToggle />
          <Link
            href={auth.authenticated ? "/create" : "/login"}
            className="header-create"
          >
            <Plus size={16} />
            <span>{t("create_bounty")}</span>
          </Link>
          <Link
            href={auth.authenticated ? "/profile" : "/login"}
            className="button button-secondary account-button"
          >
            {auth.authenticated
              ? auth.session?.username || t("profile")
              : t("auth_login")}
          </Link>
        </div>
      </div>
    </header>
  );
}
