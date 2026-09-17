"use client";

import { useTranslations } from "next-intl";

export function Text({ id }: { id: string }) {
  const t = useTranslations();
  return <>{t(id)}</>;
}
