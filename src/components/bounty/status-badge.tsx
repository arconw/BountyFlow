"use client";
import { interfaceLabels } from "@/i18n/interface-labels";
import { useTranslations } from "next-intl";
import type { BountyStatus } from "@/types/bounty";

export function StatusBadge({ status }: { status: BountyStatus }) {
  const t = useTranslations();
  return (
    <span className={`status status-${status.toLowerCase().replace(" ", "-")}`}>
      <span />
      {t(interfaceLabels[status])}
    </span>
  );
}
