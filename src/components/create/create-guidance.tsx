"use client";

import { useTranslations } from "next-intl";
import { Lightbulb, ShieldCheck } from "lucide-react";
import { createGuidance } from "@/content/create";

export function CreateGuidance() {
  const t = useTranslations();
  return (
    <aside className="create-guidance">
      <div className="guidance-heading">
        <Lightbulb size={18} />
        <h2>{t("a_great_bounty_starts_here")}</h2>
      </div>
      {createGuidance.map((item, index) => (
        <div className="guidance-item" key={t(item.title)}>
          <span>{index + 1}</span>
          <div>
            <h3>{t(item.title)}</h3>
            <p>{t(item.description)}</p>
          </div>
        </div>
      ))}
      <div className="guidance-security">
        <ShieldCheck size={20} />
        <h3>{t("your_reward_stays_secure")}</h3>
        <p>
          {t(
            "funds_stay_in_escrow_until_you_review_the_work_and_release_the_reward_to_the_contributor",
          )}
        </p>
      </div>
    </aside>
  );
}
