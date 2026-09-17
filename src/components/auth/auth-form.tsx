"use client";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";
import { accountClient } from "@/lib/auth/client";
import { accountError } from "@/lib/auth/errors";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { AuthField } from "./auth-field";

export type AuthMode = "login" | "register" | "recover" | "reset" | "factor";
export function AuthForm({
  mode,
  capabilities,
}: {
  mode: AuthMode;
  capabilities: { google: boolean; email: boolean };
}) {
  const t = useTranslations();
  const router = useRouter();
  const params = useSearchParams();
  const auth = useAuth();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [backup, setBackup] = useState(false);
  const title = {
    login: "auth_login",
    register: "auth_register",
    recover: "auth_recover",
    reset: "auth_set_password",
    factor: "auth_factor",
  }[mode];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setNotice(null);
    setFailed(false);
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? "").trim();
    const password = String(form.get("password") ?? "");
    try {
      let result;
      if (mode === "register")
        result = await accountClient.signUp.email({
          email: value("email"),
          password,
          name: value("username"),
          username: value("username"),
          callbackURL: "/login",
        });
      else if (mode === "login")
        result = value("identifier").includes("@")
          ? await accountClient.signIn.email({
              email: value("identifier"),
              password,
              callbackURL: "/profile",
            })
          : await accountClient.signIn.username({
              username: value("identifier"),
              password,
            });
      else if (mode === "recover")
        result = await accountClient.requestPasswordReset({
          email: value("email"),
          redirectTo: "/reset-access",
        });
      else if (mode === "reset")
        result = await accountClient.resetPassword({
          newPassword: password,
          token: params.get("token") ?? "",
        });
      else
        result = backup
          ? await accountClient.twoFactor.verifyBackupCode({
              code: value("code"),
            })
          : await accountClient.twoFactor.verifyTotp({ code: value("code") });
      if (result.error) {
        setFailed(true);
        setNotice(accountError(result.error.code));
        return;
      }
      if (mode === "register" || mode === "recover") {
        setNotice("auth_check_email");
        return;
      }
      if (mode === "reset") {
        router.push("/login");
        return;
      }
      if (
        result.data &&
        "twoFactorRedirect" in result.data &&
        result.data.twoFactorRedirect
      )
        return;
      await auth.refresh();
      router.push("/profile");
    } catch {
      setFailed(true);
      setNotice("auth_error");
    } finally {
      setPending(false);
    }
  }
  async function google() {
    setPending(true);
    setNotice(null);
    try {
      const result = await accountClient.signIn.social({
        provider: "google",
        callbackURL: "/profile",
        errorCallbackURL: "/login?error=oauth",
      });
      if (result.error) {
        setFailed(true);
        setNotice(accountError(result.error.code));
      }
    } catch {
      setFailed(true);
      setNotice("auth_error");
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="auth-page settings-card">
      <div className="dialog-symbol">
        <ShieldCheck size={28} />
      </div>
      <h1>{t(title)}</h1>
      <p className="settings-note">{t("auth_account_intro")}</p>
      {(mode === "login" || mode === "register") && (
        <>
          <Button
            fullWidth
            disabled={pending || !capabilities.google}
            onClick={() => void google()}
          >
            {t("auth_google")}
          </Button>
          {capabilities && !capabilities.google && (
            <p className="settings-note">{t("auth_google_unavailable")}</p>
          )}
          <div className="auth-divider">{t("auth_or")}</div>
        </>
      )}
      {capabilities &&
        !capabilities.email &&
        (mode === "register" || mode === "recover") && (
          <p role="status" className="settings-note">
            {t("auth_mail_unavailable")}
          </p>
        )}
      <form onSubmit={submit}>
        {mode === "login" && (
          <AuthField
            label={t("auth_identifier")}
            name="identifier"
            autoComplete="username"
            required
            maxLength={254}
          />
        )}
        {(mode === "register" || mode === "recover") && (
          <AuthField
            label={t("auth_email")}
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        )}
        {mode === "register" && (
          <>
            <AuthField
              label={t("auth_username")}
              name="username"
              autoComplete="username"
              required
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_.]+"
            />
            <p className="settings-note">{t("auth_username_hint")}</p>
          </>
        )}
        {(mode === "login" || mode === "register" || mode === "reset") && (
          <AuthField
            label={t("auth_password")}
            name="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
            minLength={mode === "login" ? 1 : 12}
            maxLength={128}
          />
        )}
        {(mode === "register" || mode === "reset") && (
          <p className="settings-note">{t("auth_password_hint")}</p>
        )}
        {mode === "factor" && (
          <AuthField
            label={t(backup ? "auth_backup_code" : "auth_code")}
            name="code"
            autoComplete="one-time-code"
            inputMode={backup ? "text" : "numeric"}
            required
          />
        )}
        <Button
          fullWidth
          variant="primary"
          disabled={
            pending ||
            ((mode === "register" || mode === "recover") && !capabilities.email)
          }
        >
          {t(pending ? "auth_wait" : title)}
        </Button>
      </form>
      {(notice || params.has("error")) && (
        <p
          role={failed || params.has("error") ? "alert" : "status"}
          className={failed ? "error-text" : "settings-note"}
        >
          {t(notice ?? "auth_error")}
        </p>
      )}
      <div className="auth-links">
        {mode === "login" && (
          <>
            <Link href="/register">{t("auth_register")}</Link>
            <Link href="/recover">{t("auth_recover")}</Link>
          </>
        )}
        {mode !== "login" && <Link href="/login">{t("auth_back_login")}</Link>}
        {mode === "factor" && (
          <Button onClick={() => setBackup(!backup)}>
            {t(backup ? "auth_use_app" : "auth_use_backup")}
          </Button>
        )}
      </div>
    </section>
  );
}
