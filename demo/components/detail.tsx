"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { DemoBountyContent } from "./bounty-content";
import { useDemo } from "../state/provider";
import { DemoRewardPanel } from "./reward-panel";
import { DemoActivityList } from "./activity-list";

export function DemoDetail({ id }: { id: number }) {
  const t = useTranslations();
  const { state } = useDemo();
  const bounty = state.bounties.find((item) => item.id === id);
  return (
    <div className="detail-page">
      <Link href="/" className="back-link">
        <ArrowLeft size={15} />
        {t("back_to_bounties")}
      </Link>
      {bounty ? (
        <>
          <div className="detail-layout">
            <DemoBountyContent bounty={bounty} />
            <DemoRewardPanel bounty={bounty} />
          </div>
          <DemoActivityList bountyId={id} />
        </>
      ) : (
        <div className="demo-missing">
          <h1>{t("demo_page_missing")}</h1>
          <p>{t("demo_local_notice")}</p>
          <Link href="/" className="button button-primary">
            {t("back_to_bounties")}
          </Link>
        </div>
      )}
    </div>
  );
}
