"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check, CircleAlert, FlaskConical, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useDemo } from "../state/provider";

const actionTitles = {
  create: "create_this_bounty",
  accept: "accept_this_bounty",
  release: "release_bounty_reward",
  cancel: "cancel_bounty_confirm",
};
const successTitles = {
  create: "bounty_created",
  accept: "bounty_accepted",
  release: "payment_released",
  cancel: "bounty_cancelled",
};

export function DemoTransactionDialog() {
  const t = useTranslations();
  const { transaction, confirm, reject, dismiss } = useDemo();
  if (!transaction) return null;
  const { stage, request, reward, bountyId, error } = transaction;
  const title =
    stage === "confirm"
      ? actionTitles[request.action]
      : stage === "success"
        ? successTitles[request.action]
        : stage === "pending"
          ? "transaction_submitted"
          : stage === "rejected"
            ? "transaction_cancelled"
            : "transaction_failed";
  return (
    <Modal title={t(title)} onClose={dismiss}>
      <div className={`dialog-symbol symbol-${stage}`}>
        {stage === "success" ? (
          <Check size={28} />
        ) : stage === "pending" ? (
          <LoaderCircle size={28} className="loading-icon" />
        ) : stage === "failed" ? (
          <CircleAlert size={28} />
        ) : (
          <FlaskConical size={28} />
        )}
      </div>
      <h2>{t(title)}</h2>
      <p
        className="dialog-description"
        role={stage === "pending" || stage === "success" ? "status" : undefined}
      >
        {t(error ?? `demo_${stage}_description`)}
      </p>
      <div className="transaction-reward">
        <span>{t("bounty_reward")}</span>
        <strong>
          {reward} <span>ETH</span>
        </strong>
        <small>{t("demo_network")}</small>
      </div>
      {stage === "confirm" && (
        <>
          <div className="dialog-actions">
            <Button onClick={dismiss}>{t("cancel")}</Button>
            <Button variant="primary" onClick={() => confirm()}>
              {t("demo_run")}
            </Button>
          </div>
          <div className="demo-scenarios">
            <button onClick={reject}>{t("demo_simulate_rejection")}</button>
            <button onClick={() => confirm("failed")}>
              {t("demo_simulate_failure")}
            </button>
          </div>
        </>
      )}
      {stage === "pending" && <p className="dialog-note">{t("pending")}</p>}
      {stage === "success" && (
        <Link
          className="button button-primary full-width"
          href={`/bounty/${bountyId}/`}
          onClick={dismiss}
        >
          {t("view_bounty")}
        </Link>
      )}
      {(stage === "failed" || stage === "rejected") && (
        <Button variant="primary" fullWidth onClick={() => confirm()}>
          {t("try_again")}
        </Button>
      )}
      <p className="dialog-note">
        <FlaskConical size={13} />
        {t("demo_banner")}
      </p>
    </Modal>
  );
}
