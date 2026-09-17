"use client";

import { useTranslations } from "next-intl";
import { Languages, LoaderCircle } from "lucide-react";
import { isLocale, locales } from "@/i18n/config";
import { usePreferences } from "./preferences-provider";

export function LanguageSelect() {
  const t = useTranslations();
  const { locale, pendingLocale, languageError, changeLocale } =
    usePreferences();
  return (
    <div className="language-setting">
      <label className="form-field" htmlFor="language">
        {t("language")}
        <span>{t("choose_the_language_used_across_the_interface")}</span>
      </label>
      <div className="language-control">
        <Languages size={18} />
        <select
          id="language"
          value={pendingLocale ?? locale}
          aria-busy={!!pendingLocale}
          aria-describedby={languageError ? "language-error" : undefined}
          onChange={(event) => {
            if (isLocale(event.target.value))
              void changeLocale(event.target.value);
          }}
        >
          {locales.map((item) => (
            <option key={item.code} value={item.code} lang={item.code}>
              {item.name}
            </option>
          ))}
        </select>
        {pendingLocale && <LoaderCircle size={16} className="loading-icon" />}
      </div>
      {languageError && (
        <p id="language-error" className="error-text" role="alert">
          {t("could_not_load_this_language_please_try_again")}
        </p>
      )}
      <span className="sr-only" role="status">
        {pendingLocale ? t("loading_language") : ""}
      </span>
    </div>
  );
}
