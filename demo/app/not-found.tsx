"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function DemoNotFound() {
  const t = useTranslations();
  return (
    <div className="demo-missing">
      <h1>{t("demo_page_missing")}</h1>
      <Link href="/" className="button button-primary">
        {t("back_to_bounties")}
      </Link>
    </div>
  );
}
