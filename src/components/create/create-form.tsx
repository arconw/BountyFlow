"use client";

import { useTranslations } from "next-intl";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { createPlaceholders } from "@/content/create";
import { appChain } from "@/blockchain/config";
import { useCreateBounty } from "@/hooks/use-create-bounty";
import { interfaceLabels } from "@/i18n/interface-labels";
import { Button } from "@/components/ui/button";
import { SkillPicker } from "@/components/skills/skill-picker";
import { TransactionSummary } from "./transaction-summary";

export function CreateForm() {
  const t = useTranslations();
  const {
    fields,
    update,
    submit,
    error,
    insufficient,
    wallet,
    busy,
    authenticated,
  } = useCreateBounty();
  return (
    <form className="create-form" onSubmit={submit} noValidate>
      <div className="form-section-label">
        <span>01</span>
        {t("bounty_details")}
      </div>
      <label className="form-field">
        {t("title")}
        <span>{t("keep_it_specific_and_easy_to_understand")}</span>
        <input
          name="title"
          aria-invalid={error === "invalid_title"}
          aria-describedby={
            error === "invalid_title" ? "create-feedback" : undefined
          }
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
          aria-invalid={
            error === "invalid_description" || error === "metadata_too_large"
          }
          aria-describedby={
            error === "invalid_description" || error === "metadata_too_large"
              ? "create-feedback"
              : undefined
          }
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
        id="bounty-skills"
        value={fields.skills}
        onChange={(skills) => update("skills", skills)}
        invalid={error === "invalid_skills"}
      />
      <label className="form-field">
        {t("category")}
        <select
          value={fields.category}
          onChange={(event) => update("category", event.target.value)}
        >
          {["Development", "Design", "Writing", "Research"].map((value) => (
            <option key={value} value={value}>
              {t(interfaceLabels[value])}
            </option>
          ))}
        </select>
      </label>
      <div className="form-divider" />
      <div className="form-section-label">
        <span>02</span>
        {t("set_the_reward")}
      </div>
      <label className="form-field" htmlFor="reward">
        {t("bounty_reward")}
        <span>{t("a_fair_reward_attracts_great_contributors")}</span>
      </label>
      <div className={`reward-input ${insufficient ? "input-error" : ""}`}>
        <input
          id="reward"
          name="reward"
          type="number"
          inputMode="decimal"
          min="0.0001"
          step="0.0001"
          required
          value={fields.reward}
          onChange={(event) => update("reward", event.target.value)}
          placeholder={createPlaceholders.reward}
          aria-invalid={insufficient || error === "invalid_reward"}
          aria-describedby="reward-hint"
        />
        <span>ETH</span>
      </div>
      <div
        id="reward-hint"
        className={`balance-hint ${insufficient ? "error-text" : ""}`}
      >
        {insufficient ? (
          t("insufficient_balance")
        ) : (
          <>
            {t("available_balance")}
            <span>{wallet.formattedBalance} ETH</span>
          </>
        )}
      </div>
      <TransactionSummary reward={fields.reward} />
      {error && (
        <p id="create-feedback" className="error-text" role="alert">
          {t(error)}
        </p>
      )}
      <div className="create-submit">
        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={insufficient || busy}
        >
          {!authenticated
            ? t("auth_login")
            : !wallet.connected
              ? t("connect_wallet")
              : wallet.wrongNetwork
                ? t("switch_network_name", { network: appChain.name })
                : fields.reward
                  ? t("create_amount", { reward: fields.reward })
                  : t("create_bounty")}
          <ArrowRight size={16} />
        </Button>
        <p>
          <LockKeyhole size={12} />
          {t("your_reward_is_held_securely_until_you_approve_the_work")}
        </p>
      </div>
    </form>
  );
}
