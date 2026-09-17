"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, FlaskConical } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SkillPicker } from "@/components/skills/skill-picker";
import { interfaceLabels } from "@/i18n/interface-labels";
import { useDemo } from "../state/provider";
import type { DemoCreateFields } from "../state/types";

export function DemoCreateForm() {
  const t = useTranslations();
  const { state, begin, transaction } = useDemo();
  const [fields, setFields] = useState<DemoCreateFields>({
    title: "",
    description: "",
    skills: [],
    category: "Development",
    reward: "",
  });
  const [error, setError] = useState(false);
  const insufficient =
    Number(fields.reward) > Number(state.balances[state.role]);
  function update<K extends keyof DemoCreateFields>(
    key: K,
    value: DemoCreateFields[K],
  ) {
    setFields((current) => ({ ...current, [key]: value }));
    setError(false);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      fields.title.trim().length < 8 ||
      fields.description.trim().length < 20 ||
      !/^\d+(\.\d{1,18})?$/.test(fields.reward) ||
      Number(fields.reward) <= 0 ||
      insufficient
    ) {
      setError(true);
      return;
    }
    begin({ action: "create", fields });
  }
  return (
    <form className="create-form" onSubmit={submit}>
      <div className="form-section-label">
        <span>01</span>
        {t("bounty_details")}
      </div>
      <label className="form-field">
        {t("title")}
        <span>{t("keep_it_specific_and_easy_to_understand")}</span>
        <input
          name="title"
          required
          minLength={8}
          maxLength={120}
          value={fields.title}
          onChange={(event) => update("title", event.target.value)}
          placeholder={t("title_placeholder")}
        />
      </label>
      <label className="form-field">
        {t("description")}
        <span>
          {t("give_contributors_the_context_they_need_to_do_their_best_work")}
        </span>
        <textarea
          name="description"
          required
          minLength={20}
          maxLength={6000}
          rows={6}
          value={fields.description}
          onChange={(event) => update("description", event.target.value)}
          placeholder={t(
            "describe_the_task_what_a_great_result_looks_like_and_anything_a_contributor_should_know",
          )}
        />
      </label>
      <SkillPicker
        id="demo-bounty-skills"
        value={fields.skills}
        onChange={(value) => update("skills", value)}
      />
      <label className="form-field">
        {t("category")}
        <select
          value={fields.category}
          onChange={(event) => update("category", event.target.value)}
        >
          {["Development", "Design", "Writing", "Research"].map((category) => (
            <option key={category} value={category}>
              {t(interfaceLabels[category])}
            </option>
          ))}
        </select>
      </label>
      <div className="form-divider" />
      <div className="form-section-label">
        <span>02</span>
        {t("set_the_reward")}
      </div>
      <label className="form-field" htmlFor="demo-reward">
        {t("bounty_reward")}
        <span>{t("a_fair_reward_attracts_great_contributors")}</span>
      </label>
      <div className={`reward-input ${insufficient ? "input-error" : ""}`}>
        <input
          id="demo-reward"
          name="reward"
          type="number"
          inputMode="decimal"
          min="0.0001"
          step="0.0001"
          required
          value={fields.reward}
          onChange={(event) => update("reward", event.target.value)}
          placeholder="0.05"
          aria-invalid={insufficient}
          aria-describedby="demo-reward-hint"
        />
        <span>ETH</span>
      </div>
      <div
        id="demo-reward-hint"
        className={`balance-hint ${insufficient ? "error-text" : ""}`}
      >
        {insufficient ? (
          t("insufficient_balance")
        ) : (
          <>
            {t("demo_virtual_balance")}
            <span>{state.balances[state.role]} ETH</span>
          </>
        )}
      </div>
      {error && (
        <p className="error-text" role="alert">
          {t("demo_invalid_input")}
        </p>
      )}
      <div className="create-submit">
        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={!!transaction || insufficient}
        >
          {fields.reward
            ? t("create_amount", { reward: fields.reward })
            : t("create_bounty")}
          <ArrowRight size={16} />
        </Button>
        <p>
          <FlaskConical size={13} />
          {t("demo_banner")}
        </p>
      </div>
    </form>
  );
}
