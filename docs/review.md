# Review and release evidence

Review date: 2026-09-17. Coverage: marketplace behavior, account security, server architecture, wallet transactions, design, localization, and the shared skill catalog.

## Outcome

The repository contains a working testnet application and a separate client-facing showcase. It is suitable for demonstrating implementation quality and a complete locally verified escrow workflow. A public financial production launch is conditional on external configuration, wallet/provider checks, operations, and a separate real-funds contract audit.

Account registration uses email or Google. Login supports email/username plus password or Google, and wallets link to an existing account. Wallet ownership never grants account access.

## Requirements and evidence

| Requirement                                             | Implementation / verification                                                                              |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Public board, details, create, personal bounties        | Next.js server routes, database catalog; browser navigation and authorization tests                        |
| ETH funding, acceptance, payout, cancellation           | Solidity escrow; local EVM tests including exact payout and permission failures                            |
| Wallet connection and multiple links                    | wagmi, EIP-6963, signed user-bound challenges; real local signatures and multiwallet browser tests         |
| Wrong network, rejection, stale session, pending/reload | Network controls, transaction state machine; unit and browser regressions                                  |
| Canonical history and explorer access                   | Deployment/event relations, reorg handling, persistent detail link for configured explorer                 |
| Creation time                                           | Timestamp of the `BountyCreated` block, localized display                                                  |
| Accounts and Google                                     | Better Auth, verified email, username, optional Google password; controlled-provider HTTP tests            |
| Optional TOTP and recovery codes                        | Activation, login, one-time use, fresh-session enforcement, OAuth factor gate                              |
| Private internal operations                             | Server reads and validated Server Actions; cross-origin and expired-session tests                          |
| Relational database and migrations                      | Prisma/SQLite relations, foreign keys, indexes, seven versioned migrations                                 |
| Shared skills                                           | Curated catalog, data migration, reusable picker, canonical validation, exact search filtering             |
| Localization                                            | Eight asynchronous JSON dictionaries, browser fallback and local override, error/retry/race tests          |
| Design and accessibility                                | Dark/light tokens, responsive layouts, motion and reduced motion, keyboard navigation, WSL Chromium review |
| Public showcase and source                              | ISC license, documented repository, separate demo branch and static Pages workflow                         |
| Public on-chain deployment                              | Pending owner-controlled testnet deployment and external configuration                                     |

## Corrected during this review

- Spoofable IP headers could bypass login limits. Account-based persistent atomic counters now combine username/email and survive process restarts; the proxy boundary is explicit.
- Auth POST previously lacked the Server Actions body cap. A bounded reader now rejects bodies over 32 KB, including chunked uploads.
- Public runtime configuration could silently fall back to development assumptions. Origin, HTTPS, auth material, Google pairing, and trusted proxy configuration are checked explicitly.
- A stale receipt could restore an orphaned transaction after a reorg. Confirmation now depends on canonical indexed events; a changed boundary hash during indexing forces safe replay.
- Contract-wallet calls could be rejected because their outer `to` address differs from the escrow address. Confirmation checks authentic emitted events and canonical history instead.
- Insufficient gas funds surfaced as a generic RPC problem. They now have a specific localized message.
- Skill entry was free text, and the skill filter actually selected categories. Both forms now use one validated catalog; filtering compares actual skills.
- Creation dates were empty, and explorer access was limited to the transient transaction dialog. Details now retain the canonical transaction and use block timestamps.
- Concurrent SQLite writes could time out under parallel account tests. WAL, bounded busy timeouts, atomic limiter updates, and native-compatible account upserts remove the demonstrated contention without serializing the browser suite.
- New curated-skill validation initially rejected historical on-chain tags; protocol reading now accepts bounded immutable metadata while new form submissions remain catalog-only. A legacy-task transition regression protects its history.
- Local account provisioning shipped fixed review credentials. Public provisioning now prompts for caller-chosen credentials; the old local fixture stays ignored.

## Automated and manual checks

The local suite passed **69 unit/integration tests, 38 application browser tests, and 10 static-demo browser tests**. The full wallet lifecycle also passed in headed Chromium in WSL, and manual interface review reported no browser errors. CI verifies each published revision. `npm audit` reported zero known vulnerabilities at review time; this is a point-in-time dependency check, not an assurance against unknown defects.

Unit/integration coverage includes temporary migrated SQLite databases, schemas, cache invalidation, session ownership, OAuth/TOTP, rate limits, signatures, reorgs, transaction replacement, exact contract balances, transfer rollback, and attempted reentrancy. Browser tests use an injected EIP-1193 test provider against a real loopback EVM. They do not connect a real wallet or access a public signing account.

CI runs unit, production-build, browser, static-demo, format, and dependency checks. Check the repository's [latest verification run](https://github.com/arconw/BountyFlow/actions/workflows/verify.yml) for the result associated with a particular revision.

## External release checks

1. Configure SMTP and verify actual email delivery, verification, and recovery.
2. Configure Google OAuth credentials/consent and the exact callback origin; test a real Google account. The reviewed local application correctly reports that Google is not configured.
3. Deploy the escrow contract to a public testnet, configure RPC/explorer, and repeat the flow using real wallet extensions and WalletConnect. No real wallet was connected during this review.
4. Deploy the full Node.js app with persistent SQLite, HTTPS, a trusted ingress, backup/restore, and monitoring. Pages only hosts the demo.
5. For real funds, commission a contract audit and decide how disputes, inactive creators, and timeouts should work. Accepted bounties currently depend on creator approval.

These conditions prevent an unconditional claim of production readiness while preserving a useful, honest, executable portfolio demonstration.
