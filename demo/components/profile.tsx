"use client";

import { useTranslations } from "next-intl";
import { FlaskConical } from "lucide-react";
import { AppearanceSettings } from "@/components/profile/appearance-settings";
import { useDemo } from "../state/provider";
import { DemoProfileForm } from "./profile-form";
import { DemoActivityList } from "./activity-list";

export function DemoProfilePage() {
  const t = useTranslations();
  const { state } = useDemo();
  return (
    <div className="profile-page">
      <div className="profile-intro">
        <h1>{t("account_settings")}</h1>
        <p>{t("demo_profile_intro")}</p>
      </div>
      <div className="profile-layout">
        <DemoProfileForm
          key={state.role}
          initial={state.profiles[state.role]}
        />
        <aside className="settings-aside">
          <AppearanceSettings />
          <section className="settings-card">
            <div className="settings-heading">
              <FlaskConical size={19} />
              <div>
                <h2>{t("demo_virtual_balance")}</h2>
                <p>{t("demo_network")}</p>
              </div>
            </div>
            <div className="demo-balance">
              {state.balances[state.role]}
              <span>ETH</span>
            </div>
            <p className="settings-note">{t("demo_wallet_info")}</p>
          </section>
        </aside>
      </div>
      <DemoActivityList />
    </div>
  );
}
