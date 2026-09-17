"use client";

import { useState } from "react";
import { FlaskConical, RotateCcw, UsersRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useDemo } from "../state/provider";
import { demoPeople } from "../fixtures/people";
import type { DemoRole } from "../state/types";

export function DemoBanner() {
  const t = useTranslations();
  const { state, transaction, switchRole, reset, storageError } = useDemo();
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <>
      <div className="demo-banner">
        <div className="demo-banner-inner">
          <div className="demo-banner-copy">
            <FlaskConical size={17} />
            <div>
              <strong>{t("demo_label")}</strong>
              <span>{t("demo_banner")}</span>
            </div>
          </div>
          <div className="demo-banner-controls">
            <label className="demo-role">
              <UsersRound size={16} />
              <span className="sr-only">{t("demo_role")}</span>
              <select
                aria-label={t("demo_role")}
                value={state.role}
                disabled={!!transaction}
                onChange={(event) => switchRole(event.target.value as DemoRole)}
              >
                <option value="contributor">
                  {t("contributor")} · {demoPeople.contributor.profile.name}
                </option>
                <option value="creator">
                  {t("creator")} · {demoPeople.creator.profile.name}
                </option>
              </select>
            </label>
            <button
              className="demo-reset"
              disabled={!!transaction}
              onClick={() => setConfirmReset(true)}
            >
              <RotateCcw size={14} />
              {t("demo_reset")}
            </button>
          </div>
        </div>
      </div>
      {storageError && (
        <p className="demo-storage-error" role="status">
          {t("demo_storage_error")}
        </p>
      )}
      {confirmReset && (
        <Modal
          title={t("demo_reset_title")}
          onClose={() => setConfirmReset(false)}
        >
          <div className="dialog-symbol">
            <RotateCcw size={26} />
          </div>
          <h2>{t("demo_reset_title")}</h2>
          <p className="dialog-description">{t("demo_reset_description")}</p>
          <div className="dialog-actions demo-dialog-gap">
            <Button onClick={() => setConfirmReset(false)}>
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                reset();
                setConfirmReset(false);
              }}
            >
              {t("demo_reset")}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
