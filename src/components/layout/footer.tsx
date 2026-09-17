"use client";

import { useTranslations } from "next-intl";
import { LockKeyhole } from "lucide-react";

export function Footer() {
  const t = useTranslations();
  return (
    <footer className="site-footer">
      <div>
        <span className="footer-brand">BountyBoard</span>
        <span>{t("good_work_fair_rewards")}</span>
      </div>
      <span className="footer-security">
        <LockKeyhole size={13} />
        {t("built_for_trust_secured_on_chain")}
      </span>
    </footer>
  );
}
