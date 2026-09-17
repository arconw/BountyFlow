"use client";

import { useTranslations } from "next-intl";
import { SearchX } from "lucide-react";
import { Button } from "./button";

export function EmptyState({ onReset }: { onReset: () => void }) {
  const t = useTranslations();
  return (
    <div className="empty-state">
      <SearchX size={28} />
      <h3>{t("no_bounties_found")}</h3>
      <p>
        {t("try_a_different_search_or_clear_your_filters_to_see_more_work")}
      </p>
      <Button onClick={onReset}>{t("clear_filters")}</Button>
    </div>
  );
}
