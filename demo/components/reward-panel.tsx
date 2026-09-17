"use client";

import {
  ArrowRight,
  FlaskConical,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/bounty/status-badge";
import type { Bounty } from "@/types/bounty";
import { useDemo } from "../state/provider";
import { demoPeople } from "../fixtures/people";

export function DemoRewardPanel({ bounty }: { bounty: Bounty }) {
  const t = useTranslations();
  const { state, transaction, begin } = useDemo();
  const mine = bounty.creatorUserId === demoPeople[state.role].id;
  const action =
    mine && bounty.status === "In progress"
      ? "release"
      : mine && bounty.status === "Open"
        ? "cancel"
        : !mine && bounty.status === "Open"
          ? "accept"
          : null;
  const label =
    action === "release"
      ? t("release_amount", { reward: bounty.reward })
      : action === "cancel"
        ? t("cancel_bounty")
        : action === "accept"
          ? t("accept_bounty")
          : t(
              bounty.status === "Completed"
                ? "bounty_completed"
                : bounty.status === "Cancelled"
                  ? "bounty_cancelled"
                  : "work_in_progress",
            );
  const act = () => {
    if (action) begin({ action, bountyId: bounty.id });
  };
  return (
    <aside className="reward-aside">
      <div className="reward-panel">
        <div className="panel-label">
          <span>{t("bounty_reward")}</span>
          <LockKeyhole size={17} />
        </div>
        <div className="detail-reward">
          {bounty.reward}
          <span>ETH</span>
        </div>
        <div className="escrow-indicator">
          <ShieldCheck size={14} />
          {t(
            bounty.status === "Completed"
              ? "reward_paid_to_contributor"
              : bounty.status === "Cancelled"
                ? "reward_returned_to_creator"
                : "reward_secured_in_escrow",
          )}
        </div>
        <dl className="summary-rows">
          <div>
            <dt>{t("status")}</dt>
            <dd>
              <StatusBadge status={bounty.status} />
            </dd>
          </div>
          <div>
            <dt>{t("creator")}</dt>
            <dd>{bounty.organization}</dd>
          </div>
          {bounty.contributorName && (
            <div>
              <dt>{t("contributor")}</dt>
              <dd>{bounty.contributorName}</dd>
            </div>
          )}
          <div>
            <dt>{t("network")}</dt>
            <dd>
              <FlaskConical size={13} />
              {t("demo_network")}
            </dd>
          </div>
        </dl>
        <Button
          variant={action ? "primary" : "secondary"}
          fullWidth
          disabled={!action || !!transaction}
          onClick={act}
        >
          {label}
          {action && <ArrowRight size={16} />}
        </Button>
        <p className="panel-footnote">{t("demo_role_hint")}</p>
      </div>
      <div className="escrow-explainer">
        <FlaskConical size={18} />
        <div>
          <h3>{t("demo_label")}</h3>
          <p>{t("demo_try_flow")}</p>
        </div>
      </div>
      <div className="mobile-bounty-action">
        <div>
          <small>{t("bounty_reward")}</small>
          <strong>{bounty.reward} ETH</strong>
        </div>
        {action && (
          <Button variant="primary" disabled={!!transaction} onClick={act}>
            {label}
          </Button>
        )}
      </div>
    </aside>
  );
}
