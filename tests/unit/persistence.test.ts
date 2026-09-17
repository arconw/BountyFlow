import { describe, expect, it } from "vitest";
import { detectLocale } from "../../src/i18n/config";
import {
  createPreferencesStore,
  preferencesStorageKey,
} from "../../src/stores/preferences";
import { profileSchema } from "../../src/lib/profile-schema";

const profile = {
  name: " Ada ",
  bio: "Builder",
  website: "https://example.com",
  skills: ["React"],
};
function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}
describe("locale selection", () => {
  it.each([
    [["pt-BR", "en-US"], null, "pt"],
    [["ja-JP", "uk-UA"], null, "uk"],
    [["es-ES"], "pl", "pl"],
    [["zh"], "invalid", "en"],
  ])(
    "selects by preference and browser fallback",
    (languages, saved, expected) => {
      expect(detectLocale(languages as string[], saved)).toBe(expected);
    },
  );
});
it("persists locale across store instances", async () => {
  const storage = memoryStorage();
  const first = createPreferencesStore(storage);
  first.getState().setLocale("ru");
  const second = createPreferencesStore(storage);
  await second.persist.rehydrate();
  expect(second.getState().locale).toBe("ru");
});
it("rejects invalid persisted profile and language", async () => {
  const storage = memoryStorage();
  storage.setItem(
    preferencesStorageKey,
    JSON.stringify({
      version: 1,
      state: {
        profile: { ...profile, website: "javascript:alert(1)" },
        locale: "xx",
      },
    }),
  );
  const store = createPreferencesStore(storage);
  await store.persist.rehydrate();
  expect(store.getState().locale).toBeNull();
  expect(store.getState().locale).toBeNull();
  expect(
    profileSchema.safeParse({ ...profile, website: "javascript:alert(1)" })
      .success,
  ).toBe(false);
});
it("survives malformed browser storage", async () => {
  const storage = memoryStorage();
  storage.setItem(preferencesStorageKey, "invalid-json");
  const store = createPreferencesStore(storage);
  await store.persist.rehydrate();
  expect(store.getState().locale).toBeNull();
});
