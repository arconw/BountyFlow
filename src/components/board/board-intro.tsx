"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EscrowDiagram } from "./escrow-diagram";

export function BoardIntro({ personal }: { personal: boolean }) {
  const t = useTranslations();
  return (
    <section className="board-intro">
      <div>
        <div className="intro-kicker">
          <span className="network-dot" />
          {personal
            ? t("your_contributor_workspace")
            : t("a_little_work_a_real_contribution")}
        </div>
        <h1>
          {personal ? (
            t("your_work_in_one_place")
          ) : (
            <>
              {t("find_work_ship_it")}
              <br />
              {t("get_paid_on_chain")}
            </>
          )}
        </h1>
        <p>
          {personal
            ? t("keep_track_of_the_work_you_create_take_on_and_complete")
            : t(
                "meaningful_tasks_transparent_rewards_built_for_people_who_build",
              )}
        </p>
        <Link href="/create" className="intro-link">
          {personal
            ? t("create_a_new_bounty")
            : t("have_something_that_needs_building")}
          <span>
            {personal ? "" : t("post_a_bounty")}
            <ArrowUpRight size={14} />
          </span>
        </Link>
      </div>
      <EscrowDiagram />
    </section>
  );
}
