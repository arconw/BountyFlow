"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { NextIntlClientProvider } from "next-intl";
import { useTheme } from "next-themes";
import { RotateCw } from "lucide-react";
import {
  detectLocale,
  type Dictionary,
  type Locale,
  type Theme,
} from "@/i18n/config";
import { loadDictionary } from "@/i18n/load-dictionary";
import { usePreferencesStoreApi } from "@/components/providers/preferences-store-provider";

const bootstrapLabels = {
  en: "Retry",
  ru: "Повторить",
  es: "Reintentar",
  pt: "Tentar novamente",
  fr: "Réessayer",
  de: "Erneut versuchen",
  pl: "Spróbuj ponownie",
  uk: "Повторити",
};
type Preferences = {
  locale: Locale;
  theme: Theme;
  pendingLocale: Locale | null;
  languageError: boolean;
  changeLocale: (locale: Locale) => Promise<void>;
  changeTheme: (theme: Theme) => void;
};
const PreferencesContext = createContext<Preferences | null>(null);

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("PreferencesProvider is required");
  return value;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const store = usePreferencesStoreApi();
  const { resolvedTheme, setTheme } = useTheme();
  const [active, setActive] = useState<{
    locale: Locale;
    messages: Dictionary;
  } | null>(null);
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);
  const [languageError, setLanguageError] = useState(false);
  const [bootstrapLocale, setBootstrapLocale] = useState<Locale>("en");
  const generation = useRef(0);

  async function activate(locale: Locale, save: boolean) {
    const current = ++generation.current;
    setPendingLocale(locale);
    setLanguageError(false);
    try {
      const messages = await loadDictionary(locale);
      if (current !== generation.current) return;
      if (save) store.getState().setLocale(locale);
      setActive({ locale, messages });
      document.documentElement.lang = locale;
      document.title = `BountyBoard — ${messages.good_work_fair_rewards}`;
    } catch {
      if (current === generation.current) setLanguageError(true);
    } finally {
      if (current === generation.current) setPendingLocale(null);
    }
  }

  useEffect(() => {
    let mounted = true;
    Promise.resolve(store.persist.rehydrate()).then(() => {
      if (!mounted) return;
      const locale = detectLocale(navigator.languages, store.getState().locale);
      setBootstrapLocale(locale);
      void activate(locale, false);
    });
    return () => {
      mounted = false;
      generation.current++;
    };
  }, [store]);

  if (!active)
    return (
      <div className="app-loading" aria-busy={!languageError}>
        <span className="loading-brand">BountyBoard</span>
        {languageError ? (
          <button
            className="button"
            onClick={() => void activate(bootstrapLocale, false)}
          >
            <RotateCw size={16} />
            {bootstrapLabels[bootstrapLocale]}
          </button>
        ) : (
          <span className="loading-bar" />
        )}
      </div>
    );

  return (
    <PreferencesContext.Provider
      value={{
        locale: active.locale,
        theme: resolvedTheme === "light" ? "light" : "dark",
        pendingLocale,
        languageError,
        changeLocale: (locale) => activate(locale, true),
        changeTheme: setTheme,
      }}
    >
      <NextIntlClientProvider
        locale={active.locale}
        messages={active.messages}
        timeZone="UTC"
      >
        {children}
      </NextIntlClientProvider>
    </PreferencesContext.Provider>
  );
}
