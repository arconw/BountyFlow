"use client";
import { useAuth } from "@/hooks/use-auth";
import { interfaceLabels } from "@/i18n/interface-labels";

import { useTranslations } from "next-intl";
import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MainNav() {
  const t = useTranslations();
  const { authenticated } = useAuth();
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const active =
    pathname === "/" || pathname.startsWith("/bounty/")
      ? "/"
      : pathname === "/my-bounties" || pathname === "/profile"
        ? pathname
        : null;

  useLayoutEffect(() => {
    const nav = navRef.current;
    const indicator = indicatorRef.current;
    if (!nav || !indicator) return;

    const measure = () => {
      const link = nav.querySelector<HTMLAnchorElement>(
        '[aria-current="page"]',
      );
      indicator.dataset.visible = String(!!link);
      if (!link) return;
      indicator.style.setProperty("--nav-offset", `${link.offsetLeft}px`);
      indicator.style.setProperty("--nav-width", `${link.offsetWidth}px`);
      if (indicator.dataset.ready !== "true") {
        indicator.getBoundingClientRect();
        indicator.dataset.ready = "true";
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    nav.querySelectorAll("a").forEach((link) => observer.observe(link));
    return () => observer.disconnect();
  }, [active, authenticated]);

  return (
    <nav ref={navRef} className="main-nav" aria-label={t("main_navigation")}>
      {[
        { href: "/", label: "Bounties" },
        ...(authenticated
          ? [
              { href: "/my-bounties", label: "My bounties" },
              { href: "/profile", label: "Profile" },
            ]
          : []),
      ].map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={active === item.href ? "active" : ""}
          aria-current={active === item.href ? "page" : undefined}
        >
          {t(interfaceLabels[item.label])}
        </Link>
      ))}
      <span ref={indicatorRef} className="nav-indicator" aria-hidden="true" />
    </nav>
  );
}
