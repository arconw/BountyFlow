# Accounts and security

Accounts are created through email registration or Google. Both require an email address. A unique public username contains 3–30 Latin letters, digits, periods, or underscores; sign-in is case-insensitive. Google users choose their username in the profile. Bounty operations require a username and a linked wallet.

## Account flows

- `/register`: email, username, password, and email verification.
- `/login`: email or username and password, or Google OAuth.
- `/recover`, `/reset-access`: a single-use recovery link; resetting a password revokes existing sessions.
- `/two-factor`: TOTP or a single-use recovery code. No authenticated session is available until verification succeeds.
- `/profile`: public profile, username, password setup or changes, optional 2FA, and linked wallets.

Google does not create a password automatically. A user can set one after a recent sign-in. Matching verified email addresses belong to the same account; an unverified email is not linked automatically. Enabled TOTP is also enforced after the Google callback. Direct ID-token sign-in is disabled; the application uses an OAuth redirect with state and PKCE.

Recovery codes are shown during setup, and each code can be used once. The QR code is generated locally in the browser. 2FA becomes active after confirmation with an authenticator code. Changes to 2FA and initial password setup require a session authenticated within the last 15 minutes; accounts with a password must also confirm their current password.

Guests do not see profile or personal-bounty navigation. Requests to `/profile`, `/my-bounties`, and `/create` are checked on the server and redirect guests to sign-in. Language and theme controls are in `/profile` after sign-in. Taking an action on a public bounty requires an account, followed by a connected, linked wallet.

## Wallets and history

Wallets do not participate in sign-in, registration, or account recovery. Signing a single-use message links an address to an authenticated account. An account can link multiple addresses. Disconnecting a wallet does not end the account session.

Public cards display usernames. Addresses appear in wallet settings and transaction details. Changing wallets does not transfer creator permissions or payout rights for an existing on-chain bounty.

The account migration preserves older profiles and history. Legacy wallet sessions are no longer accepted. Linking an older address associates its bounties with the verified account while retaining the previous profile record in the database. Separate registered accounts are never merged automatically.

## External services

SMTP configuration uses `SMTP_HOST`, `SMTP_PORT` (587 by default), `SMTP_SECURE`, optional `SMTP_USER` and `SMTP_PASSWORD`, and `MAIL_FROM`. Mail transport and localized templates are separate from authentication flows.

Google configuration uses `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and the redirect URI `{APP_ORIGIN}/api/auth/callback/google`. A public server requires an HTTPS `APP_ORIGIN` and a stable `BETTER_AUTH_SECRET` of at least 32 characters. Local development generates its key in the ignored `data/auth-material.bin` file with mode 0600 and never logs it. Keep this file between runs: it protects cookies and configured 2FA data.

Without SMTP, registration and recovery are marked unavailable. Without Google configuration, the Google button is disabled with an explanation. Actual email delivery and Google sign-in must be verified after configuring those services.

Google OAuth supports localhost. For an application on port 3001, set `APP_ORIGIN=http://localhost:3001` and register `http://localhost:3001/api/auth/callback/google` in Google Cloud. Public origins require HTTPS, a stable authentication key, and `AUTH_TRUSTED_IP_HEADER` behind a proxy that overwrites the selected header. See the [deployment guide](deployment.md).

Sign-in limits persist in SQLite and are account-based: email and username attempts share one counter. Spoofing `X-Forwarded-For` does not reset it. Auth POST bodies are limited to 32 KB independently of `Content-Length`. Supplying only one of the two Google settings causes startup validation to fail.

## Verification

Unit tests exercise Better Auth HTTP flows against temporary SQLite databases: email verification, email/username sign-in, incorrect passwords, recovery-link reuse, TOTP and recovery codes, Google callbacks without a session before the second factor, Google accounts without passwords, session freshness, and rejection of direct ID-token sign-in. Email delivery and Google exchanges are replaced only inside the test factory.

Playwright covers forms, TOTP setup, recovery-code sign-in, multiple wallets without logout, and the complete create → accept → payout flow on a local EVM. Tests involving passwords or 2FA disable traces and screenshots. The application has no authentication bypasses.
