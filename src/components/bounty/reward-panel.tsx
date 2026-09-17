"use client";

import { useTranslations } from "next-intl";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import type { Bounty } from "@/types/bounty";
import { appChain } from "@/blockchain/config";
import { useBountyAction } from "@/hooks/use-bounty-action";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";

export function RewardPanel({ bounty }: { bounty: Bounty }) {
  const t = useTranslations();
  const { authenticated, wallet, busy, canRelease, canAccept, canCancel, act } =
    useBountyAction(bounty);
  const actionable = canRelease || canAccept || canCancel;
  const action = canRelease ? "release" : canCancel ? "cancel" : "accept";
  const actionLabel = !authenticated
    ? t("auth_login")
    : !wallet.connected && bounty.onchainId
      ? t("connect_wallet")
      : wallet.wrongNetwork
        ? t("switch_network")
        : canRelease
          ? t("release_amount", { reward: bounty.reward })
          : canCancel
            ? t("cancel_bounty")
            : t("accept_bounty");
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
            <dd>{bounty.organization || t("unregistered_author")}</dd>
          </div>
          {bounty.worker && (
            <div>
              <dt>{t("contributor")}</dt>
              <dd>{bounty.contributorName || t("unregistered_author")}</dd>
            </div>
          )}
          <div>
            <dt>{t("network")}</dt>
            <dd>
              <span className="network-dot" />
              {appChain.name}
            </dd>
          </div>
        </dl>
        {actionable ? (
          <Button
            variant="primary"
            fullWidth
            onClick={() => act(action)}
            disabled={busy}
          >
            {actionLabel}
            <ArrowRight size={16} />
          </Button>
        ) : (
          <Button fullWidth disabled>
            {t(
              bounty.status === "Completed"
                ? "bounty_completed"
                : bounty.status === "Cancelled"
                  ? "bounty_cancelled"
                  : "work_in_progress",
            )}
          </Button>
        )}
        <p className="panel-footnote">
          {t(
            canRelease
              ? "review_the_contribution_before_releasing_the_reward"
              : actionable
                ? "accept_the_task_ship_your_work_earn_the_reward"
                : "browse_open_bounties_to_find_your_next_contribution",
          )}
        </p>
      </div>
      <div className="escrow-explainer">
        <ShieldCheck size={18} />
        <div>
          <h3>{t("work_with_peace_of_mind")}</h3>
          <p>
            {t(
              "rewards_are_held_in_a_smart_contract_and_released_when_the_creator_approves_your_work",
            )}
          </p>
        </div>
      </div>
      <div className="mobile-bounty-action">
        <div>
          <small>{t("bounty_reward")}</small>
          <strong>{bounty.reward} ETH</strong>
        </div>
        {actionable && (
          <Button variant="primary" disabled={busy} onClick={() => act(action)}>
            {actionLabel}
          </Button>
        )}
      </div>
    </aside>
  );
}
