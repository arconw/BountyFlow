import { createStore } from "zustand/vanilla";
import {
  persist,
  createJSONStorage,
  type StateStorage,
} from "zustand/middleware";
import { z } from "zod";
import { isLocale, type Locale } from "../i18n/config";
export const preferencesStorageKey = "bountyboard_profile";
type PreferencesState = {
  locale: Locale | null;
  setLocale: (locale: Locale) => void;
};
export function createPreferencesStore(storage?: StateStorage) {
  return createStore<PreferencesState>()(
    persist(
      (set) => ({
        locale: null,
        setLocale: (locale) => {
          if (isLocale(locale)) set({ locale });
        },
      }),
      {
        name: preferencesStorageKey,
        version: 1,
        skipHydration: true,
        storage: createJSONStorage(() => storage ?? localStorage),
        partialize: (state) => ({ locale: state.locale }),
        merge: (persisted, current) => {
          const value = z
            .object({ locale: z.unknown().optional() })
            .safeParse(persisted);
          return {
            ...current,
            locale:
              value.success && isLocale(value.data.locale)
                ? value.data.locale
                : null,
          };
        },
      },
    ),
  );
}
