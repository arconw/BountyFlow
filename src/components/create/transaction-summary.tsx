"use client";

import { useTranslations } from "next-intl";
import { LockKeyhole } from "lucide-react";
import { appChain, contractAddress } from "@/blockchain/config";
import { Address } from "@/components/ui/address";

export function TransactionSummary({ reward }: { reward: string }) {
  const t = useTranslations();
  return (
    <section className="transaction-summary">
      <h3>
        <LockKeyhole size={15} />
        {t("transaction_summary")}
      </h3>
      <dl className="summary-rows">
        <div>
          <dt>{t("bounty_reward")}</dt>
          <dd>{reward || "0.00"} ETH</dd>
        </div>
        <div>
          <dt>{t("estimated_network_fee")}</dt>
          <dd>{t("wallet_calculates_fee")}</dd>
        </div>
        <div>
          <dt>{t("network")}</dt>
          <dd>
            <span className="network-dot" />
            {appChain.name}
          </dd>
        </div>
        <div>
          <dt>{t("escrow_contract")}</dt>
          <dd>
            {contractAddress ? (
              <Address
                address={contractAddress}
                short={`${contractAddress.slice(0, 6)}…${contractAddress.slice(-4)}`}
              />
            ) : (
              t("contract_unavailable")
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
