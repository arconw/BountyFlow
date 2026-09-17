"use client";

import { useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";
import { useWallet } from "@/components/providers/wallet-provider";
import { appChain } from "@/blockchain/config";
import { Button } from "@/components/ui/button";

export function NetworkBanner() {
  const t = useTranslations();
  const wallet = useWallet();
  if (!wallet.wrongNetwork) return null;
  const network = appChain.name;
  const current = wallet.network;
  return (
    <div className="network-banner" role="status">
      <TriangleAlert size={18} />
      <p>
        <strong>{t("wrong_network")}</strong>{" "}
        {t("network_mismatch", { current, network })}
        {wallet.networkError && (
          <span role="alert">{t(wallet.networkError)}</span>
        )}
      </p>
      <Button
        disabled={wallet.switching}
        onClick={() => void wallet.switchNetwork()}
      >
        {t("switch_network_name", { network })}
      </Button>
    </div>
  );
}
