"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { explorerLink } from "@/blockchain/config";
import { Check, Copy, ArrowUpRight } from "lucide-react";

export function Address({
  address,
  short,
}: {
  address: string;
  short?: string;
}) {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setError(false);
    } catch {
      setError(true);
    }
  }
  return (
    <span className="address">
      <span className="mono" title={address}>
        {short ?? address}
      </span>
      <button
        className="icon-button small"
        onClick={copy}
        aria-label={copied ? t("address_copied") : t("copy_address")}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
      {explorerLink("address", address) && (
        <a
          href={explorerLink("address", address)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("view_address")}
        >
          <ArrowUpRight size={14} />
        </a>
      )}
      <span className="sr-only" role="status">
        {copied
          ? t("address_copied")
          : error
            ? t("copy_unavailable_select_the_address_to_copy_it")
            : ""}
      </span>
    </span>
  );
}
