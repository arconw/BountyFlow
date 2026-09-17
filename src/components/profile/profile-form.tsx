"use client";

import { useTranslations } from "next-intl";
import { Check, Save, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkillPicker } from "@/components/skills/skill-picker";

import type { Profile } from "@/lib/profile-schema";
import { useProfileForm } from "@/hooks/use-profile-form";

export function ProfileForm({ initial }: { initial: Profile }) {
  const t = useTranslations();
  const { profile, result, update, save, pending } = useProfileForm(initial);
  const saved = result === "profile_saved_account";
  return (
    <section className="settings-card">
      <div className="settings-heading">
        <UserRound size={19} />
        <div>
          <h2>{t("public_profile")}</h2>
          <p>{t("introduce_yourself_to_the_people_you_build_with")}</p>
        </div>
      </div>
      <form onSubmit={save} noValidate>
        <div className="profile-avatar" aria-hidden="true">
          {profile.name.trim().slice(0, 1).toUpperCase() || (
            <UserRound size={29} />
          )}
        </div>
        <label className="form-field" htmlFor="profile-name">
          {t("display_name")}
          <input
            id="profile-name"
            autoComplete="nickname"
            maxLength={60}
            value={profile.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder={t("how_should_we_call_you")}
            aria-invalid={result === "enter_a_display_name"}
            aria-describedby={
              result === "enter_a_display_name" ? "profile-feedback" : undefined
            }
          />
        </label>
        <label className="form-field" htmlFor="profile-bio">
          {t("about_you")}
          <span>{t("a_short_introduction_to_your_work_and_interests")}</span>
          <textarea
            id="profile-bio"
            rows={3}
            maxLength={400}
            value={profile.bio}
            onChange={(event) => update("bio", event.target.value)}
            placeholder={t("tell_us_a_little_about_yourself")}
          />
        </label>
        <SkillPicker
          id="profile-skills"
          value={profile.skills}
          onChange={(skills) => update("skills", skills)}
          invalid={result === "invalid_skills"}
        />
        <label className="form-field" htmlFor="profile-website">
          {t("website")}
          <span>{t("optional")}</span>
          <input
            id="profile-website"
            type="url"
            autoComplete="url"
            maxLength={200}
            value={profile.website}
            onChange={(event) => update("website", event.target.value)}
            placeholder={t("https_example_com")}
            aria-invalid={
              result === "enter_a_valid_http_or_https_website_address"
            }
            aria-describedby={
              result === "enter_a_valid_http_or_https_website_address"
                ? "profile-feedback"
                : undefined
            }
          />
        </label>
        <div className="settings-save">
          <Button type="submit" variant="primary" disabled={pending}>
            {saved ? <Check size={16} /> : <Save size={16} />}
            {t("save_profile")}
          </Button>
          <span
            id="profile-feedback"
            role="status"
            className={result && !saved ? "error-text" : "save-feedback"}
          >
            {result ? t(result) : ""}
          </span>
        </div>
        <p className="settings-note">{t("profile_sync_note")}</p>
      </form>
    </section>
  );
}
