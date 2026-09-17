"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import type { Bounty } from "@/types/bounty";
import { StatusBadge } from "./status-badge";
import { BountyAge } from "./bounty-age";
import { usePointerGlow } from "@/components/ui/use-pointer-glow";

export function BountyCard({ bounty }: { bounty: Bounty }) {
  const t = useTranslations();
  const onPointerMove = usePointerGlow();
  return (
    <Link
      href={`/bounty/${bounty.id}`}
      className="bounty-card"
      onPointerMove={onPointerMove}
    >
      <div className="card-top">
        <StatusBadge status={bounty.status} />
        <span className="mono bounty-id">#{bounty.id}</span>
      </div>
      <h3>{bounty.title}</h3>
      <p className="card-description">{bounty.description}</p>
      <div className="tags">
        {bounty.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="card-reward">
        <div>
          <span className="reward-label">{t("bounty_reward")}</span>
          <strong>
            {bounty.reward}
            <span> ETH</span>
          </strong>
        </div>
        <span className="secured">
          <LockKeyhole size={12} />
          {bounty.status === "Completed"
            ? t("paid_out")
            : bounty.status === "Cancelled"
              ? t("returned")
              : t("in_escrow")}
        </span>
      </div>
      <div className="card-footer">
        <span className={`avatar ${bounty.color}`}>{bounty.initial}</span>
        <span className="organization">
          {bounty.organization || t("unregistered_author")}
        </span>
        <span className="age">
          <BountyAge createdAt={bounty.createdAt} fallback={bounty.age} />
        </span>
        <ArrowUpRight size={15} className="card-arrow" />
      </div>
    </Link>
  );
}
