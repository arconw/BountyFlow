"use client";

import { useTranslations } from "next-intl";
import { StatusBadge } from "@/components/bounty/status-badge";
import { BountyAge } from "@/components/bounty/bounty-age";
import { interfaceLabels } from "@/i18n/interface-labels";
import type { Bounty } from "@/types/bounty";

export function DemoBountyContent({ bounty }: { bounty: Bounty }) {
  const t = useTranslations();
  return (
    <article className="bounty-content">
      <div className="detail-heading">
        <div className="detail-labels">
          <StatusBadge status={bounty.status} />
          <span className="mono">#{bounty.id}</span>
          <span>{t(interfaceLabels[bounty.category])}</span>
        </div>
        <h1>{bounty.title}</h1>
        <p className="detail-lead">{bounty.description}</p>
        <div className="creator-byline">
          <span className={`avatar ${bounty.color}`}>{bounty.initial}</span>
          <span>
            {t("posted_by")} <strong>{bounty.organization}</strong>
          </span>
          <span className="byline-age">
            <BountyAge createdAt={bounty.createdAt} fallback={bounty.age} />
          </span>
        </div>
      </div>
      <section className="detail-section">
        <h2>{t("skills_tools")}</h2>
        <div className="tags detail-tags">
          {bounty.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </section>
      <div className="contribution-note">
        <span className="network-dot" />
        <p>
          {t("a_small_contribution_can_make_a_big_difference")}
          <br />
          <span>
            {t("keep_your_work_focused_well_documented_and_easy_to_review")}
          </span>
        </p>
      </div>
    </article>
  );
}
