"use client";

import { useTranslations } from "next-intl";
import { Wallet, ArrowRight, ShieldCheck } from "lucide-react";
import { useWallet } from "@/components/providers/wallet-provider";
import { useWalletLink } from "@/hooks/use-wallet-link";
import { blockchainErrorKey } from "@/blockchain/errors";
import { Button } from "@/components/ui/button";
import { Address } from "@/components/ui/address";

export function WalletSettings() {
  const t = useTranslations();
  const wallet = useWallet();
  const { auth, linked, link, pending, error } = useWalletLink();
  return (
    <section className="settings-card">
      <div className="settings-heading">
        <Wallet size={19} />
        <div>
          <h2>{t("wallet")}</h2>
          <p>{t("manage_the_wallet_you_use_for_bounties")}</p>
        </div>
      </div>
      {wallet.connected && wallet.address ? (
        <>
          <div className="profile-wallet">
            <span className="network-dot" />
            <Address address={wallet.address} short={wallet.shortAddress} />
          </div>
          <dl className="summary-rows">
            <div>
              <dt>{t("network")}</dt>
              <dd>{wallet.network}</dd>
            </div>
            <div>
              <dt>{t("wallet_balance")}</dt>
              <dd>{wallet.formattedBalance} ETH</dd>
            </div>
          </dl>
          <div className="settings-save">
            <Button
              variant="primary"
              disabled={pending || linked || !auth.authenticated}
              onClick={link}
            >
              <ShieldCheck size={16} />
              {t(linked ? "wallet_linked" : "link_wallet")}
            </Button>
            <Button onClick={() => void wallet.disconnect()}>
              {t("disconnect_wallet")}
            </Button>
          </div>
          {!!error && (
            <p role="alert" className="error-text">
              {t(blockchainErrorKey(error))}
            </p>
          )}
        </>
      ) : (
        <div className="wallet-empty">
          <Wallet size={28} />
          <h3>{t("no_wallet_connected")}</h3>
          <p>{t("connect_a_wallet_to_preview_your_account_details")}</p>
          <Button onClick={wallet.openWallet}>
            {t("connect_wallet")}
            <ArrowRight size={15} />
          </Button>
        </div>
      )}
      {auth.session?.wallets.length ? (
        <ul className="wallet-list">
          {auth.session.wallets.map((item) => (
            <li key={item.id}>
              <Address
                address={item.address}
                short={`${item.address.slice(0, 6)}…${item.address.slice(-4)}`}
              />
            </li>
          ))}
        </ul>
      ) : null}
      <p className="settings-note">
        {t(
          auth.authenticated ? "signature_not_transaction" : "auth_wallet_gate",
        )}
      </p>
    </section>
  );
}
