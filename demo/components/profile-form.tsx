"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, Save, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SkillPicker } from "@/components/skills/skill-picker";
import { useDemo } from "../state/provider";
import { demoProfileSchema } from "../state/model";
import type { DemoProfile } from "../state/types";

export function DemoProfileForm({ initial }: { initial: DemoProfile }) {
  const t = useTranslations();
  const { saveProfile } = useDemo();
  const [profile, setProfile] = useState(initial);
  const [result, setResult] = useState<"saved" | "invalid" | null>(null);
  useEffect(() => {
    setProfile(initial);
  }, [initial]);
  function update<K extends keyof DemoProfile>(key: K, value: DemoProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
    setResult(null);
  }
  function save(event: FormEvent) {
    event.preventDefault();
    const value = demoProfileSchema.safeParse(profile);
    if (!value.success) {
      setResult("invalid");
      return;
    }
    saveProfile(value.data);
    setResult("saved");
  }
  return (
    <section className="settings-card">
      <div className="settings-heading">
        <UserRound size={19} />
        <div>
          <h2>{t("public_profile")}</h2>
          <p>{t("introduce_yourself_to_the_people_you_build_with")}</p>
        </div>
      </div>
      <form onSubmit={save}>
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
            required
            maxLength={60}
            value={profile.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder={t("how_should_we_call_you")}
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
          id="demo-profile-skills"
          value={profile.skills}
          onChange={(value) => update("skills", value)}
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
          />
        </label>
        <div className="settings-save">
          <Button type="submit" variant="primary">
            {result === "saved" ? <Check size={16} /> : <Save size={16} />}
            {t("save_profile")}
          </Button>
          <span
            role="status"
            className={result === "invalid" ? "error-text" : "save-feedback"}
          >
            {result
              ? t(
                  result === "saved"
                    ? "profile_saved_in_this_browser"
                    : "demo_invalid_input",
                )
              : ""}
          </span>
        </div>
        <p className="settings-note">{t("demo_profile_intro")}</p>
      </form>
    </section>
  );
}
