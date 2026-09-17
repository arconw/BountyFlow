# Deployment

## Two deployments

The `demo` branch publishes `demo/out` through GitHub Actions to GitHub Pages. This static Next.js export is an interactive simulation with browser-local data. It does not contain production auth, server actions, a database, or a wallet connector. See [Next.js static-export limitations](https://nextjs.org/docs/app/guides/static-exports) and [Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

The full application runs as one Node.js instance behind HTTPS with a persistent SQLite volume. Horizontal scaling requires a deliberate database, distributed cache, indexer, and limiter design.

## Runtime configuration

| Variable                                                 | Requirement                                                                                                                                               |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `APP_ORIGIN`                                             | Exact origin, e.g. `https://bounty.example.com`. Required for production builds and starts. No path, query, or credentials. Public origins require HTTPS. |
| `BETTER_AUTH_SECRET`                                     | Stable random value of at least 32 characters, supplied through your secret manager. Rotation affects sessions and encrypted 2FA.                         |
| `DATABASE_URL`                                           | `file:/absolute/persistent/path/bountyflow.db`; create the parent directory and restrict access.                                                          |
| `AUTH_TRUSTED_IP_HEADER`                                 | Public deployment requires `x-real-ip` or `cf-connecting-ip`, overwritten by the trusted ingress.                                                         |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`               | Both enable Google; partial configuration is rejected.                                                                                                    |
| `SMTP_HOST`, `MAIL_FROM`                                 | Enable verification and recovery mail.                                                                                                                    |
| `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` | Mail provider transport settings.                                                                                                                         |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`                   | Optional public identifier, provided before build.                                                                                                        |

Locally the auth key is generated once with mode 0600 in ignored `data/auth-material.bin`. Never publish or remove it while its accounts and 2FA data are in use. Runtime databases, local review credentials, and populated environment files are excluded from Git.

`config/environment.example` documents local variable names. Next.js loads privately populated `.env.local`; command-line Prisma scripts receive `DATABASE_URL` through their environment. The local launcher passes `APP_ORIGIN` to its children. The former `TRUST_PROXY` variable is not used.

## Proxy boundary

`npm start` binds to 127.0.0.1. Keep the application port inaccessible publicly. Configure your HTTPS proxy to replace client IP headers. For nginx:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    client_max_body_size 64k;
}
```

Use `AUTH_TRUSTED_IP_HEADER=x-real-ip` with that configuration. Trust a CDN header only when requests must arrive through that CDN. SQLite connections use WAL and a bounded busy timeout. The database and its WAL must stay on one host with a local persistent filesystem. Additional persistent, atomic SQLite counters limit attempts per account independently of IP headers. Both auth POST bodies and Server Action bodies are limited to 32 KB.

## Google sign-in

Localhost is supported. Create a Google OAuth **Web application** client, configure consent, add test users while the app is in testing, and register your exact redirect URI:

```text
http://localhost:3000/api/auth/callback/google
http://localhost:3001/api/auth/callback/google
https://your-domain.example/api/auth/callback/google
```

Register only the URLs you use. `APP_ORIGIN` must match the intended origin, including port. Set both Google variables privately and restart. A hostname or port mismatch can cause `redirect_uri_mismatch`; absent credentials intentionally disable the button. [Better Auth Google configuration](https://www.better-auth.com/docs/authentication/google)

Tests verify a controlled provider's callback exchange, state rejection, optional passwords, and TOTP enforcement after OAuth. A real consent round trip still needs the owner's configured Google project.

## Contract and network

The checked-in settings describe a local development chain, not a public deployment. RPC and explorer URLs are bundled into the browser; do not put private RPC credentials in `config/network.json` or `NEXT_PUBLIC_*` values.

To deploy on Sepolia through your own controlled signer, supply `SEPOLIA_RPC_URL` and `SIGNER_RPC_URL` privately and run `npm run chain:deploy:sepolia`. The script verifies chain 11155111 and writes the deployed address and block to public configuration. Never expose an unlocked signer RPC. Alternatively deploy `contracts/BountyBoard.sol` with your own wallet tooling and update public settings. Rebuild after changing the network.

Before public release, manually connect browser wallets, test account/network switching and WalletConnect, create a small testnet bounty, accept with another linked wallet, release from the creator, and verify the explorer receipt and recipient balance. Local tests establish protocol behavior, not every extension or external provider's behavior.

## Build and operations

Provide the required configuration securely, then:

```bash
npm ci
npm run db:deploy
npm run build
npm start
```

Do not seed local demo accounts into a public installation. Curated skills are included in migrations; public setup needs no `db:seed`.

Back up SQLite and authentication material together using a consistent snapshot or SQLite backup procedure. Rehearse restoration. Do not blindly copy a live database during writes. Restrict filesystem access and monitor disk space, RPC, process errors, mail delivery, and index progress. Rollouts apply committed migrations and retain the persistent volume.

The current indexer runs with application reads and processes bounded block ranges. Large catalogs need a dedicated worker and server pagination. The contract has no dispute/timeout mechanism and no independent real-funds audit. These are explicit scope limits.
