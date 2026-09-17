"use client";
import { useRouteRefresh } from "@/hooks/use-route-refresh";
import type { Bounty } from "@/types/bounty";
import { BountyContent } from "./bounty-content";
import { RewardPanel } from "./reward-panel";
export function BountyDetail({ bounty }: { bounty: Bounty }) {
  useRouteRefresh(15_000);
  return (
    <div className="detail-layout">
      <BountyContent bounty={bounty} />
      <RewardPanel bounty={bounty} />
    </div>
  );
}
