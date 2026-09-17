"use client";
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import QRCode from "react-qr-code";
import { ShieldCheck } from "lucide-react";
import { accountClient } from "@/lib/auth/client";
import { accountError } from "@/lib/auth/errors";
import { setAccountPassword } from "@/server/actions/security";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { AuthField } from "./auth-field";

export function SecuritySettings({
  info,
}: {
  info: { hasPassword: boolean; google: boolean };
}) {
  const t = useTranslations();
  const auth = useAuth();
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [setup, setSetup] = useState<{
    totpURI: string;
    backupCodes: string[];
  } | null>(null);
  async function run(
    action: () => Promise<{ error?: { code?: string } | null }>,
    onSuccess?: () => void,
  ) {
    setPending(true);
    setNotice(null);
    try {
      const result = await action();
      if (result.error) {
        setNotice(accountError(result.error.code));
        return;
      }
      await auth.refresh();
      setNotice("auth_saved");
      onSuccess?.();
    } catch {
      setNotice("auth_error");
    } finally {
      setPending(false);
    }
  }
  function credential(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    void run(
      async () => {
        const newPassword = String(fields.get("newPassword"));
        if (info.hasPassword)
          return accountClient.changePassword({
            currentPassword: String(fields.get("currentPassword")),
            newPassword,
            revokeOtherSessions: true,
          });
        const saved = await setAccountPassword(newPassword);
        if (saved.error) return { error: { code: saved.error } };
        return {};
      },
      () => form.reset(),
    );
  }
  function factor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const password = String(fields.get("currentPassword") ?? "") || undefined;
    void run(async () => {
      if (auth.session?.twoFactorEnabled)
        return accountClient.twoFactor.disable({ password });
      const result = await accountClient.twoFactor.enable({ password });
      if (result.data && "totpURI" in result.data)
        setSetup({
          totpURI: result.data.totpURI,
          backupCodes: result.data.backupCodes,
        });
      return result;
    });
  }
  if (!auth.authenticated) return null;
  return (
    <section className="settings-card">
      <div className="settings-heading">
        <ShieldCheck size={19} />
        <div>
          <h2>{t("auth_security")}</h2>
          <p>{auth.session?.email}</p>
        </div>
      </div>
      <form
        className="security-form"
        onSubmit={(event) => {
          event.preventDefault();
          const value = String(
            new FormData(event.currentTarget).get("username"),
          );
          void run(() => accountClient.updateUser({ username: value }));
        }}
      >
        <AuthField
          label={t("auth_username")}
          name="username"
          defaultValue={auth.session?.username ?? ""}
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_.]+"
          autoComplete="username"
        />
        <Button disabled={pending}>{t("auth_save_username")}</Button>
      </form>
      {info && (
        <form className="security-form" onSubmit={credential}>
          <h3>
            {t(info.hasPassword ? "auth_change_password" : "auth_set_password")}
          </h3>
          {!info.hasPassword && (
            <p className="settings-note">
              {t("auth_google_password_optional")}
            </p>
          )}
          {info.hasPassword && (
            <AuthField
              label={t("auth_current_password")}
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
            />
          )}
          <AuthField
            label={t("auth_new_password")}
            name="newPassword"
            type="password"
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            required
          />
          <p className="settings-note">{t("auth_password_hint")}</p>
          <Button disabled={pending}>{t("auth_save")}</Button>
        </form>
      )}
      <h3>{t("auth_factor")}</h3>
      <p className="settings-note">{t("auth_factor_hint")}</p>
      {setup ? (
        <div>
          <p>{t("auth_scan_qr")}</p>
          <div className="auth-qr">
            <QRCode value={setup.totpURI} size={180} />
          </div>
          <p className="settings-note">{t("auth_keep_codes")}</p>
          <div className="auth-codes">
            {setup.backupCodes.map((code) => (
              <code key={code}>{code}</code>
            ))}
          </div>
          <form
            className="security-form"
            onSubmit={(event) => {
              event.preventDefault();
              const code = String(
                new FormData(event.currentTarget).get("code"),
              );
              void run(
                () => accountClient.twoFactor.verifyTotp({ code }),
                () => setSetup(null),
              );
            }}
          >
            <AuthField
              label={t("auth_code")}
              name="code"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
            />
            <Button disabled={pending}>{t("auth_confirm_factor")}</Button>
          </form>
        </div>
      ) : (
        <form className="security-form" onSubmit={factor}>
          {info.hasPassword && (
            <AuthField
              label={t("auth_current_password")}
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
            />
          )}
          <Button disabled={pending || !info}>
            {t(
              auth.session?.twoFactorEnabled
                ? "auth_disable_factor"
                : "auth_enable_factor",
            )}
          </Button>
        </form>
      )}
      {notice && (
        <p role="status" className="auth-feedback">
          {t(notice)}
        </p>
      )}
      <Button
        onClick={() => void auth.signOut().catch(() => setNotice("auth_error"))}
        disabled={pending}
      >
        {t("auth_logout")}
      </Button>
    </section>
  );
}
