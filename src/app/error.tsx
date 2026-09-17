"use client";

import { useTranslations } from "next-intl";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  const t = useTranslations();
  return (
    <div className="empty-state not-found" role="alert">
      <CircleAlert size={30} />
      <h1>{t("bounties_unavailable")}</h1>
      <p>{t("rpc_unavailable")}</p>
      <Button onClick={reset}>{t("try_again")}</Button>
    </div>
  );
}
