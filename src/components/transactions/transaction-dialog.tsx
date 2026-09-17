"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  Check,
  Clock3,
  LockKeyhole,
  Wallet,
  CircleAlert,
  ArrowUpRight,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { appChain, explorerLink } from "@/blockchain/config";
import { transactionCopy } from "@/content/transactions";
import type { LiveTransaction } from "@/types/live-transaction";

export function LiveTransactionDialog({
  transaction,
  onClose,
  onConfirm,
  onCheck,
  onSync,
}: {
  transaction: LiveTransaction;
  onClose: () => void;
  onConfirm: () => void;
  onCheck: () => void;
  onSync: () => void;
}) {
  const t = useTranslations();
  const { action, state, reward, hash, bountyId, error, syncError } =
    transaction;
  const copy =
    action === "cancel"
      ? {
          confirm: "cancel_bounty_confirm",
          description: "cancel_bounty_description",
          success: "bounty_cancelled",
          successDescription: "reward_returned_to_creator",
          button: "cancel_bounty",
        }
      : transactionCopy[action];
  const title =
    state === "confirm"
      ? copy.confirm
      : state === "awaiting"
        ? "confirm_in_your_wallet"
        : state === "pending"
          ? "transaction_submitted"
          : state === "success"
            ? copy.success
            : state === "rejected"
              ? "transaction_cancelled"
              : "transaction_failed";
  const description =
    state === "confirm"
      ? copy.description
      : state === "awaiting"
        ? "open_your_wallet_and_confirm_the_transaction_to_continue"
        : state === "pending"
          ? "your_transaction_is_waiting_to_be_confirmed_on_chain"
          : state === "success"
            ? copy.successDescription
            : (error ?? "rpc_unavailable");
  const explorer = hash ? explorerLink("tx", hash) : undefined;
  return (
    <Modal title={t(title)} onClose={onClose}>
      <div className={`dialog-symbol symbol-${state}`}>
        {state === "success" ? (
          <Check size={28} />
        ) : state === "pending" ? (
          <Clock3 size={28} />
        ) : state === "awaiting" ? (
          <Wallet size={28} />
        ) : state === "failed" ? (
          <CircleAlert size={28} />
        ) : (
          <LockKeyhole size={28} />
        )}
      </div>
      <h2>{t(title)}</h2>
      <p className="dialog-description">{t(description)}</p>
      <div className="transaction-reward">
        <span>{t("bounty_reward")}</span>
        <strong>
          {reward} <span>ETH</span>
        </strong>
        <small>{t("test_network_name", { network: appChain.name })}</small>
      </div>
      {hash && (
        <div className="transaction-hash mono" title={hash}>
          {hash.slice(0, 12)}…{hash.slice(-8)}
          {explorer && (
            <a href={explorer} target="_blank" rel="noopener noreferrer">
              {t("view_transaction")}
              <ArrowUpRight size={14} />
            </a>
          )}
        </div>
      )}
      {state === "confirm" && (
        <div className="dialog-actions">
          <Button onClick={onClose}>{t("cancel")}</Button>
          <Button variant="primary" onClick={onConfirm}>
            {t(copy.button)}
          </Button>
        </div>
      )}
      {state === "awaiting" && (
        <p role="status" className="dialog-note">
          {t("confirm_in_your_wallet")}
        </p>
      )}
      {state === "pending" && (
        <div role="status">
          <p className="dialog-note">{t(error ?? "pending")}</p>
          {error && (
            <Button fullWidth onClick={onCheck}>
              {t("check_confirmation")}
            </Button>
          )}
        </div>
      )}
      {state === "success" && (
        <>
          {syncError ? (
            <div role="alert">
              <p className="dialog-note">{t("sync_delayed")}</p>
              <Button fullWidth onClick={onSync}>
                {t("try_again")}
              </Button>
            </div>
          ) : bountyId ? (
            <Link
              className="button button-primary full-width"
              href={`/bounty/${bountyId}`}
              onClick={onClose}
            >
              {t("view_bounty")}
            </Link>
          ) : (
            <Button fullWidth onClick={onClose}>
              {t("done")}
            </Button>
          )}
        </>
      )}
      {(state === "failed" || state === "rejected") && (
        <Button variant="primary" fullWidth onClick={onConfirm}>
          {t("try_again")}
        </Button>
      )}
    </Modal>
  );
}
