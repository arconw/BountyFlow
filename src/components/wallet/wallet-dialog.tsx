"use client";

import { useConnect, useConnectors } from "wagmi";
import { useTranslations } from "next-intl";
import { ArrowRight, Wallet, LogOut, ShieldCheck } from "lucide-react";
import { useWallet } from "@/components/providers/wallet-provider";
import { useWalletLink } from "@/hooks/use-wallet-link";
import { blockchainErrorKey } from "@/blockchain/errors";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Address } from "@/components/ui/address";

export function WalletDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations();
  const wallet = useWallet();
  const connectors = useConnectors();
  const connect = useConnect();
  const { auth, linked, link, pending, error } = useWalletLink();
  return (
    <Modal
      title={t(wallet.connected ? "your_wallet" : "connect_a_wallet")}
      onClose={onClose}
    >
      <div className="dialog-symbol">
        <Wallet size={26} />
      </div>
      <h2>{t(wallet.connected ? "your_wallet" : "connect_a_wallet")}</h2>
      <p className="dialog-description">
        {t("your_identity_for_work_on_chain")}
      </p>
      {wallet.connected && wallet.address ? (
        <>
          <div className="wallet-account">
            <Address address={wallet.address} short={wallet.shortAddress} />
          </div>
          <dl className="summary-rows">
            <div>
              <dt>{t("wallet_balance")}</dt>
              <dd>{wallet.formattedBalance} ETH</dd>
            </div>
            <div>
              <dt>{t("network")}</dt>
              <dd>{wallet.network}</dd>
            </div>
          </dl>
          <Button
            variant="primary"
            fullWidth
            disabled={pending || linked || !auth.authenticated}
            onClick={link}
          >
            <ShieldCheck size={16} />
            {t(
              linked
                ? "wallet_linked"
                : pending
                  ? "confirm_in_your_wallet"
                  : "link_wallet",
            )}
          </Button>
          <Button fullWidth onClick={() => void wallet.disconnect()}>
            <LogOut size={15} />
            {t("disconnect_wallet")}
          </Button>
        </>
      ) : (
        <>
          <div className="wallet-options">
            {connectors.map((connector) => (
              <button
                className="wallet-option"
                key={connector.uid}
                disabled={connect.isPending}
                onClick={() => connect.mutate({ connector })}
              >
                <Wallet size={22} />
                <span>
                  <strong>
                    {connector.id === "injected"
                      ? t("browser_wallet")
                      : connector.name}
                  </strong>
                  <small>{t("connect_with_your_preferred_wallet")}</small>
                </span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
          <p className="dialog-note">{t("wallet_install_hint")}</p>
        </>
      )}
      {!!(connect.error || error) && (
        <p className="error-text" role="alert">
          {t(blockchainErrorKey(connect.error ?? error))}
        </p>
      )}
      <p className="dialog-note">{t("signature_not_transaction")}</p>
    </Modal>
  );
}
