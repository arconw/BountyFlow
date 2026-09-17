"use client";

import { useRouteRefresh } from "@/hooks/use-route-refresh";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ArrowDown, Plus } from "lucide-react";
import Link from "next/link";
import type { Bounty } from "@/types/bounty";
import { AnimatedBountyGrid } from "./animated-bounty-grid";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { BoardIntro } from "./board-intro";
import { BoardStats } from "./board-stats";
import { BoardFilters } from "./board-filters";

export function Board({
  personal = false,
  bounties,
}: {
  personal?: boolean;
  bounties: Bounty[];
}) {
  useRouteRefresh(15_000);
  const t = useTranslations();
  const userId = useAuth().session?.userId;
  const defaultTab = personal ? "Created by me" : "All bounties";
  const [tab, setTab] = useState(defaultTab);
  const [search, setSearch] = useState("");
  const [skill, setSkill] = useState("All skills");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "/" &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement) &&
        !document.querySelector("dialog[open]")
      ) {
        event.preventDefault();
        document.querySelector<HTMLInputElement>("#bounty-search")?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const filtered = bounties
    .filter((bounty) => {
      const mine = !!userId && bounty.creatorUserId === userId;
      const accepted = !!userId && bounty.contributorUserId === userId;
      const matchesTab = personal
        ? tab === "Created by me"
          ? mine
          : tab === "Accepted by me"
            ? accepted
            : (mine || accepted) && bounty.status === "Completed"
        : tab === "All bounties" || bounty.status === tab;
      return (
        matchesTab &&
        (skill === "All skills" || bounty.tags.includes(skill)) &&
        `${bounty.title} ${bounty.description} ${bounty.tags.join(" ")} ${bounty.organization}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    })
    .sort((a, b) =>
      sort === "highest"
        ? Number(b.reward) - Number(a.reward)
        : sort === "lowest"
          ? Number(a.reward) - Number(b.reward)
          : b.id - a.id,
    );

  function reset() {
    setTab(defaultTab);
    setSearch("");
    setSkill("All skills");
    setVisibleCount(6);
  }

  return (
    <div className="board-page">
      <BoardIntro personal={personal} />
      <BoardStats personal={personal} bounties={bounties} userId={userId} />
      <section className="bounty-section" aria-label={t("bounties")}>
        <div className="section-heading">
          <h2>{personal ? t("my_bounties") : t("explore_bounties")}</h2>
          <span>
            {personal
              ? t("a_home_for_your_contributions")
              : t("your_next_contribution_starts_here")}
          </span>
        </div>
        <BoardFilters
          personal={personal}
          tab={tab}
          onTab={(value) => {
            setTab(value);
            setVisibleCount(6);
          }}
          search={search}
          onSearch={(value) => {
            setSearch(value);
            setVisibleCount(6);
          }}
          sort={sort}
          onSort={setSort}
          skill={skill}
          onSkill={(value) => {
            setSkill(value);
            setVisibleCount(6);
          }}
          view={view}
          onView={setView}
          count={filtered.length}
        />
        <AnimatedBountyGrid
          bounties={filtered.slice(0, visibleCount)}
          view={view}
          onReset={reset}
        />
        {filtered.length > visibleCount && (
          <div className="load-more">
            <Button onClick={() => setVisibleCount((value) => value + 6)}>
              {t("explore_more_bounties")}
              <ArrowDown size={14} />
            </Button>
            <span>
              {t("showing_bounties", {
                visible: Math.min(visibleCount, filtered.length),
                total: filtered.length,
              })}
            </span>
          </div>
        )}
      </section>
      <div className="board-bottom">
        <div>
          <strong>{t("build_together_move_things_forward")}</strong>
          <p>
            {t(
              "turn_your_project_s_next_step_into_someone_s_next_contribution",
            )}
          </p>
        </div>
        <Link href="/create" className="button button-secondary">
          <Plus size={15} />
          {t("create_a_bounty")}
        </Link>
      </div>
    </div>
  );
}
