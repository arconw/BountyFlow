"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { BoardIntro } from "@/components/board/board-intro";
import { BoardStats } from "@/components/board/board-stats";
import { BoardFilters } from "@/components/board/board-filters";
import { AnimatedBountyGrid } from "@/components/board/animated-bounty-grid";
import { Button } from "@/components/ui/button";
import { useDemo } from "../state/provider";
import { demoPeople } from "../fixtures/people";

export function DemoBoard({ personal = false }: { personal?: boolean }) {
  const t = useTranslations();
  const { state } = useDemo();
  const userId = demoPeople[state.role].id;
  const defaultTab = personal ? "Created by me" : "All bounties";
  const [tab, setTab] = useState(defaultTab);
  const [search, setSearch] = useState("");
  const [skill, setSkill] = useState("All skills");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [visibleCount, setVisibleCount] = useState(6);
  const [matching, setMatching] = useState(false);

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

  const filtered = state.bounties
    .filter((bounty) => {
      const mine = bounty.creatorUserId === userId;
      const accepted = bounty.contributorUserId === userId;
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
        (!matching ||
          state.profiles[state.role].skills.some((value) =>
            bounty.tags.includes(value),
          )) &&
        `${bounty.title} ${bounty.description} ${bounty.tags.join(" ")} ${bounty.organization}`
          .toLowerCase()
          .includes(search.toLowerCase().trim())
      );
    })
    .sort((a, b) =>
      sort === "highest"
        ? Number(b.reward) - Number(a.reward)
        : sort === "lowest"
          ? Number(a.reward) - Number(b.reward)
          : b.id - a.id,
    );

  function resetFilters() {
    setTab(defaultTab);
    setSearch("");
    setSkill("All skills");
    setMatching(false);
    setVisibleCount(6);
  }

  return (
    <div className="board-page">
      <BoardIntro personal={personal} />
      <BoardStats
        personal={personal}
        bounties={state.bounties}
        userId={userId}
      />
      <section className="bounty-section" aria-label={t("bounties")}>
        <div className="section-heading">
          <h2>{t(personal ? "my_bounties" : "explore_bounties")}</h2>
          <span>
            {t(
              personal
                ? "a_home_for_your_contributions"
                : "your_next_contribution_starts_here",
            )}
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
        <div className="demo-match-row">
          <button
            className={`demo-match ${matching ? "is-active" : ""}`}
            aria-pressed={matching}
            onClick={() => {
              setMatching(!matching);
              setVisibleCount(6);
            }}
          >
            <Sparkles size={14} />
            {t("demo_matching_skills")}
          </button>
          <span>{t("demo_role_hint")}</span>
        </div>
        <AnimatedBountyGrid
          bounties={filtered.slice(0, visibleCount)}
          view={view}
          onReset={resetFilters}
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
          <p>{t("demo_try_flow")}</p>
        </div>
        <Link href="/create/" className="button button-secondary">
          <Plus size={15} />
          {t("create_a_bounty")}
        </Link>
      </div>
    </div>
  );
}
