export const locales = [
  { code: "en", name: "English" },
  { code: "ru", name: "Русский" },
  { code: "es", name: "Español" },
  { code: "pt", name: "Português" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "pl", name: "Polski" },
  { code: "uk", name: "Українська" },
] as const;
export type Locale = (typeof locales)[number]["code"];
export type Dictionary = Record<string, string>;
export type Theme = "dark" | "light";
export const defaultLocale: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return locales.some((locale) => locale.code === value);
}

export function detectLocale(
  languages: readonly string[],
  saved?: unknown,
): Locale {
  if (isLocale(saved)) return saved;
  for (const language of languages) {
    const code = language.toLowerCase().split(/[-_]/)[0];
    if (isLocale(code)) return code;
  }
  return defaultLocale;
}
