"use client";

import { useTranslations } from "next-intl";
import { Check, Code2, LockKeyhole } from "lucide-react";

export function EscrowDiagram() {
  const t = useTranslations();
  return (
    <div
      className="escrow-diagram"
      aria-label={t(
        "post_a_bounty_secure_the_reward_in_escrow_get_the_work_shipped",
      )}
    >
      <div className="escrow-path">
        <div className="escrow-node">
          <Code2 size={21} />
        </div>
        <span className="escrow-line" />
        <div className="escrow-node escrow-lock">
          <LockKeyhole size={22} />
          <span className="escrow-check">
            <Check size={9} strokeWidth={3} />
          </span>
        </div>
        <span className="escrow-line" />
        <div className="escrow-node">
          <Check size={22} />
        </div>
      </div>
      <div className="escrow-labels">
        <span>{t("post_a_bounty")}</span>
        <span>{t("reward_secured")}</span>
        <span>{t("work_shipped")}</span>
      </div>
    </div>
  );
}
