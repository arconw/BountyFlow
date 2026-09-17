"use client";
import { interfaceLabels } from "@/i18n/interface-labels";

import { useTranslations } from "next-intl";
import { LayoutGrid, List, Search, SlidersHorizontal } from "lucide-react";
import { boardTabs, personalTabs, skillFilters } from "@/content/board";

type Props = {
  personal: boolean;
  tab: string;
  onTab: (value: string) => void;
  search: string;
  onSearch: (value: string) => void;
  sort: string;
  onSort: (value: string) => void;
  skill: string;
  onSkill: (value: string) => void;
  view: "grid" | "list";
  onView: (value: "grid" | "list") => void;
  count: number;
};

export function BoardFilters({
  personal,
  tab,
  onTab,
  search,
  onSearch,
  sort,
  onSort,
  skill,
  onSkill,
  view,
  onView,
  count,
}: Props) {
  const t = useTranslations();
  return (
    <div className="board-controls">
      <div className="board-toolbar">
        <div className="tabs" role="group" aria-label={t("bounty_status")}>
          {(personal ? personalTabs : boardTabs).map((value) => (
            <button
              key={value}
              className={tab === value ? "selected" : ""}
              aria-pressed={tab === value}
              onClick={() => onTab(value)}
            >
              {t(interfaceLabels[value])}
              {tab === value && <span className="tab-count">{count}</span>}
            </button>
          ))}
        </div>
        <div className="search-box">
          <Search size={15} />
          <input
            id="bounty-search"
            aria-label={t("search_bounties")}
            placeholder={t("search_bounties_hint")}
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
          <kbd>/</kbd>
        </div>
      </div>
      <div className="board-subtoolbar">
        <div className="filter-left">
          <label className="select-control">
            <SlidersHorizontal size={14} />
            <select
              aria-label={t("filter_by_skill")}
              value={skill}
              onChange={(event) => onSkill(event.target.value)}
            >
              {skillFilters.map((filter) => (
                <option key={filter} value={filter}>
                  {filter === "All skills" ? t("all_skills") : filter}
                </option>
              ))}
            </select>
          </label>
          <span className="results-count" aria-live="polite">
            {t("bounty_count", { count })}
          </span>
        </div>
        <div className="filter-right">
          <label className="sort-control">
            {t("sort_by")}
            <select
              aria-label={t("sort_bounties")}
              value={sort}
              onChange={(event) => onSort(event.target.value)}
            >
              <option value="newest">{t("newest_first")}</option>
              <option value="highest">{t("highest_reward")}</option>
              <option value="lowest">{t("lowest_reward")}</option>
            </select>
          </label>
          <div className="view-toggle">
            <button
              aria-label={t("grid_view")}
              aria-pressed={view === "grid"}
              className={view === "grid" ? "selected" : ""}
              onClick={() => onView("grid")}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              aria-label={t("list_view")}
              aria-pressed={view === "list"}
              className={view === "list" ? "selected" : ""}
              onClick={() => onView("list")}
            >
              <List size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
