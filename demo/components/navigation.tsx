"use client";

import { useLayoutEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", key: "bounties" },
  { href: "/my-bounties/", key: "my_bounties" },
  { href: "/profile/", key: "profile" },
];

export function DemoNavigation() {
  const t = useTranslations();
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const normalized = pathname.replace(/\/$/, "") || "/";
  const active = normalized.startsWith("/bounty/") ? "/" : normalized;

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
  }, [active]);

  return (
    <nav ref={navRef} className="main-nav" aria-label={t("main_navigation")}>
      {links.map(({ href, key }) => (
        <Link
          key={href}
          href={href}
          className={
            active === (href.replace(/\/$/, "") || "/") ? "active" : ""
          }
          aria-current={
            active === (href.replace(/\/$/, "") || "/") ? "page" : undefined
          }
        >
          {t(key)}
        </Link>
      ))}
      <span ref={indicatorRef} className="nav-indicator" aria-hidden="true" />
    </nav>
  );
}
