"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  executeDemoRequest,
  initialDemoState,
  restoreDemoState,
  updateDemoProfile,
} from "./model";
import type {
  DemoProfile,
  DemoRequest,
  DemoRole,
  DemoState,
  DemoTransaction,
} from "./types";

const storageKey = "bountyflow_public_demo_v1";
type DemoContextValue = {
  state: DemoState;
  transaction: DemoTransaction | null;
  storageError: boolean;
  switchRole: (role: DemoRole) => void;
  reset: () => void;
  saveProfile: (profile: DemoProfile) => void;
  begin: (request: DemoRequest) => void;
  confirm: (outcome?: "success" | "failed") => void;
  reject: () => void;
  dismiss: () => void;
};
const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialDemoState);
  const stateRef = useRef(state);
  const [transaction, setTransaction] = useState<DemoTransaction | null>(null);
  const transactionRef = useRef<DemoTransaction | null>(null);
  const [storageError, setStorageError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function commit(next: DemoState) {
    stateRef.current = next;
    setState(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }

  function show(next: DemoTransaction | null) {
    transactionRef.current = next;
    setTransaction(next);
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const restored = restoreDemoState(JSON.parse(saved));
        stateRef.current = restored;
        setState(restored);
      }
    } catch {
      setStorageError(true);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function begin(request: DemoRequest) {
    if (transactionRef.current) return;
    const current = stateRef.current;
    const bounty =
      request.action === "create"
        ? null
        : current.bounties.find((item) => item.id === request.bountyId);
    const reward =
      request.action === "create" ? request.fields.reward : bounty?.reward;
    if (!reward) return;
    show({ request, actor: current.role, reward, stage: "confirm" });
  }

  function confirm(outcome: "success" | "failed" = "success") {
    const current = transactionRef.current;
    if (!current || current.stage === "pending" || current.stage === "success")
      return;
    show({ ...current, stage: "pending", error: undefined });
    timer.current = setTimeout(() => {
      timer.current = null;
      if (outcome === "failed") {
        show({ ...current, stage: "failed", error: "demo_failed_description" });
        return;
      }
      try {
        const result = executeDemoRequest(
          stateRef.current,
          current.request,
          current.actor,
        );
        commit(result.state);
        show({ ...current, stage: "success", bountyId: result.bountyId });
      } catch (error) {
        show({
          ...current,
          stage: "failed",
          error:
            error instanceof Error ? error.message : "demo_failed_description",
        });
      }
    }, 1100);
  }

  return (
    <DemoContext.Provider
      value={{
        state,
        transaction,
        storageError,
        switchRole: (role) => {
          if (!transactionRef.current) commit({ ...stateRef.current, role });
        },
        reset: () => {
          if (!transactionRef.current) commit(initialDemoState());
        },
        saveProfile: (profile) =>
          commit(updateDemoProfile(stateRef.current, profile)),
        begin,
        confirm,
        reject: () => {
          if (transactionRef.current?.stage === "confirm")
            show({ ...transactionRef.current, stage: "rejected" });
        },
        dismiss: () => {
          if (transactionRef.current?.stage !== "pending") show(null);
        },
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("DemoStateProvider is required");
  return value;
}
