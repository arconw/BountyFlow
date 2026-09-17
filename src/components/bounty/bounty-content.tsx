"use client";

import { interfaceLabels } from "@/i18n/interface-labels";
import { useTranslations } from "next-intl";
import type { Bounty } from "@/types/bounty";
import { StatusBadge } from "./status-badge";
import { BountyAge } from "./bounty-age";
import { explorerLink } from "@/blockchain/config";
import { ArrowUpRight } from "lucide-react";

export function BountyContent({ bounty }: { bounty: Bounty }) {
  const t = useTranslations();
  const transactionUrl = bounty.transactionHash
    ? explorerLink("tx", bounty.transactionHash)
    : undefined;
  return (
    <article className="bounty-content">
      <div className="detail-heading">
        <div className="detail-labels">
          <StatusBadge status={bounty.status} />
          <span className="mono">#{bounty.id}</span>
          <span>
            {bounty.onchainId
              ? t(interfaceLabels[bounty.category])
              : bounty.category}
          </span>
        </div>
        <h1>{bounty.title}</h1>
        <p className="detail-lead">{bounty.description}</p>
        <div className="creator-byline">
          <span className={`avatar ${bounty.color}`}>{bounty.initial}</span>
          <span>
            {t("posted_by")}{" "}
            <strong>{bounty.organization || t("unregistered_author")}</strong>
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
      {bounty.transactionHash && (
        <section className="detail-section transaction-hash">
          <h2>{t("last_transaction")}</h2>
          <span className="mono" title={bounty.transactionHash}>
            {bounty.transactionHash.slice(0, 10)}…
            {bounty.transactionHash.slice(-8)}
          </span>
          {transactionUrl && (
            <a href={transactionUrl} target="_blank" rel="noopener noreferrer">
              {t("view_transaction")}
              <ArrowUpRight size={14} />
            </a>
          )}
        </section>
      )}
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
