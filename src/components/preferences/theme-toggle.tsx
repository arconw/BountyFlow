"use client";

import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import { usePreferences } from "./preferences-provider";

export function ThemeToggle() {
  const t = useTranslations();
  const { theme, changeTheme } = usePreferences();
  return (
    <button
      className="icon-button theme-toggle"
      aria-label={
        theme === "dark"
          ? t("switch_to_light_theme")
          : t("switch_to_dark_theme")
      }
      onClick={() => changeTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
