"use client";

import { useTranslations } from "next-intl";
import { Check, Moon, SlidersHorizontal, Sun } from "lucide-react";
import { usePreferences } from "@/components/preferences/preferences-provider";
import { LanguageSelect } from "@/components/preferences/language-select";

export function AppearanceSettings() {
  const t = useTranslations();
  const { theme, changeTheme } = usePreferences();
  return (
    <section className="settings-card">
      <div className="settings-heading">
        <SlidersHorizontal size={19} />
        <div>
          <h2>{t("preferences")}</h2>
          <p>{t("make_bountyboard_feel_like_your_workspace")}</p>
        </div>
      </div>
      <span className="setting-label">{t("appearance")}</span>
      <div className="theme-options">
        <button
          type="button"
          aria-pressed={theme === "dark"}
          onClick={() => changeTheme("dark")}
        >
          <div className="theme-preview preview-dark">
            <span />
            <span />
            <span />
          </div>
          <span>
            <Moon size={15} />
            {t("dark")}
            {theme === "dark" && <Check size={15} />}
          </span>
        </button>
        <button
          type="button"
          aria-pressed={theme === "light"}
          onClick={() => changeTheme("light")}
        >
          <div className="theme-preview preview-light">
            <span />
            <span />
            <span />
          </div>
          <span>
            <Sun size={15} />
            {t("light")}
            {theme === "light" && <Check size={15} />}
          </span>
        </button>
      </div>
      <LanguageSelect />
      <p className="settings-note">
        {t("theme_and_language_are_saved_automatically")}
      </p>
    </section>
  );
}
