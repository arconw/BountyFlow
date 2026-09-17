"use client";
import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
export function useRouteRefresh(interval?: number) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible" && !pending)
        startTransition(() => router.refresh());
    };
    if (!interval) {
      window.addEventListener("focus", refresh);
      return () => window.removeEventListener("focus", refresh);
    }
    const timer = window.setInterval(refresh, interval);
    return () => window.clearInterval(timer);
  }, [router, interval, pending]);
}
