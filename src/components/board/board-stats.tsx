"use client";

import { useTranslations } from "next-intl";
import { CircleCheck, Layers, LockKeyhole } from "lucide-react";
import { formatEther, parseEther } from "viem";
import type { Bounty } from "@/types/bounty";

export function BoardStats({
  personal,
  bounties,
  userId,
}: {
  personal: boolean;
  bounties: Bounty[];
  userId?: string;
}) {
  const t = useTranslations();
  const mine = bounties.filter(
    (bounty) => !!userId && bounty.creatorUserId === userId,
  );
  const accepted = bounties.filter(
    (bounty) => !!userId && bounty.contributorUserId === userId,
  );
  const completed = (personal ? accepted : bounties).filter(
    (bounty) => bounty.status === "Completed",
  );
  const locked = bounties.filter(
    (bounty) => bounty.status === "Open" || bounty.status === "In progress",
  );
  const reward = formatEther(
    (personal ? completed : locked).reduce(
      (sum, bounty) => sum + parseEther(bounty.reward),
      0n,
    ),
  );
  const stats = [
    {
      label: personal ? "created_by_you" : "open_bounties",
      value: personal
        ? mine.length
        : bounties.filter((bounty) => bounty.status === "Open").length,
      detail: personal
        ? "your_contributions_to_the_ecosystem"
        : "your_next_contribution",
      icon: <Layers size={16} />,
    },
    {
      label: personal ? "rewards_earned" : "rewards_in_escrow",
      value: reward,
      unit: "ETH",
      detail: personal ? "from_completed_work" : "secured_by_smart_contracts",
      icon: <LockKeyhole size={15} />,
    },
    {
      label: "bounties_completed",
      value: completed.length,
      detail: "good_work_rewarded",
      icon: <CircleCheck size={16} />,
    },
  ];
  return (
    <section className="board-stats" aria-label={t("marketplace_statistics")}>
      {stats.map((stat) => (
        <div className="stat" key={stat.label}>
          <div className="stat-heading">
            <span>{t(stat.label)}</span>
            {stat.icon}
          </div>
          <div className="stat-bottom">
            <strong>
              {stat.value}
              {stat.unit && <span>{stat.unit}</span>}
            </strong>
            <span className="stat-detail">{t(stat.detail)}</span>
          </div>
        </div>
      ))}
    </section>
  );
}
