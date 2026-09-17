"use client";

import { useState } from "react";
import { Check, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { maxSelectedSkills, skillCatalog } from "@/content/skills";

export function SkillPicker({
  id,
  value,
  onChange,
  invalid = false,
}: {
  id: string;
  value: string[];
  onChange: (values: string[]) => void;
  invalid?: boolean;
}) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const matches = skillCatalog.filter((skill) =>
    skill.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function toggle(skill: string) {
    onChange(
      value.includes(skill)
        ? value.filter((selected) => selected !== skill)
        : [...value, skill],
    );
  }

  return (
    <fieldset className="skill-picker" aria-describedby={`${id}-hint`}>
      <legend>{t("skills_tools")}</legend>
      <p id={`${id}-hint`} className="skill-picker-hint">
        {t("choose_catalog_skills")}
      </p>
      {value.length > 0 && (
        <div className="skill-selection">
          {value.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => toggle(skill)}
              aria-label={`${t("remove_skill")}: ${skill}`}
            >
              {skill}
              <X size={13} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
      <div className="skill-search">
        <Search size={16} aria-hidden="true" />
        <input
          id={id}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search_skills")}
          aria-label={t("search_skills")}
          aria-invalid={invalid}
          autoComplete="off"
        />
      </div>
      <div
        className="skill-options"
        role="group"
        aria-label={t("available_skills")}
      >
        {matches.map((skill) => (
          <button
            key={skill}
            type="button"
            aria-pressed={value.includes(skill)}
            disabled={
              value.length >= maxSelectedSkills && !value.includes(skill)
            }
            onClick={() => toggle(skill)}
          >
            {value.includes(skill) && <Check size={13} aria-hidden="true" />}
            {skill}
          </button>
        ))}
        {!matches.length && <p>{t("no_matching_skills")}</p>}
      </div>
      <span className="skill-picker-count" role="status">
        {t("selected_skills_count", { count: value.length })}
      </span>
    </fieldset>
  );
}
