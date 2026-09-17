"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createPreferencesStore } from "@/stores/preferences";

const PreferencesContext = createContext<ReturnType<
  typeof createPreferencesStore
> | null>(null);

export function PreferencesStoreProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [store] = useState(createPreferencesStore);
  return (
    <PreferencesContext.Provider value={store}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferencesStoreApi() {
  const store = useContext(PreferencesContext);
  if (!store) throw new Error("PreferencesProvider is required");
  return store;
}
