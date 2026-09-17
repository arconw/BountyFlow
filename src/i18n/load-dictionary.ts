import { z } from "zod";
import type { Locale } from "./config";

const dictionarySchema = z.record(z.string(), z.string());

async function fetchDictionary(locale: Locale) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/locales/${locale}.json`,
    {
      cache: "force-cache",
    },
  );
  if (!response.ok) throw new Error("LANGUAGE_UNAVAILABLE");
  return dictionarySchema.parse(await response.json());
}

const dictionaries = new Map<Locale, ReturnType<typeof fetchDictionary>>();
export function loadDictionary(locale: Locale) {
  let dictionary = dictionaries.get(locale);
  if (!dictionary) {
    dictionary = fetchDictionary(locale).catch((error) => {
      dictionaries.delete(locale);
      throw error;
    });
    dictionaries.set(locale, dictionary);
  }
  return dictionary;
}
