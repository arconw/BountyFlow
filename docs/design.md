# BountyBoard design review

## Direction

A compact work marketplace for developers. The interface uses the supplied dark product direction with generous space around the introduction, followed by a dense, useful board. Rewards carry the strongest hierarchy within cards. A small funding diagram explains escrow without decorative crypto imagery.

Palette: canvas `#0B0D10`, surface `#12151A`, elevated `#191D23`, border `#282D35`, primary text `#F1F3F5`, accent `#A8E6CF`. Muted text uses `#929AA7`.

Type: locally hosted Manrope Variable for the interface and Geist Mono for addresses and bounty identifiers. Headings are left aligned with tight tracking; descriptions have comfortable line spacing. Status uses both color and text.

Layout:

```text
Brand / navigation                  Create / network / wallet
Introduction                        Compact escrow diagram
Open bounties          Rewards secured          Completed
Status tabs                              Search / sort / view
Bounty card              Bounty card             Bounty card
```

The brief explicitly requests a dark interface, stats and cards. Those remain deliberate product requirements. To avoid a generic crypto landing page, there is no giant hero, gradient wash or coin imagery. The distinctive element is a quiet escrow pathway with an inset mint lock.

## Session-only skill

Source: https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md

Read on 2026-09-14 directly from Anthropic's public repository. The inspected markdown contains design guidance, no executable scripts, no credential access, no external data upload instructions and no required installation. Applied as instructions in this conversation only; no global or repository skill installation was performed. This is a review of the inspected file, not a guarantee about future upstream changes.

## Scope

The initial visual prototype has evolved into a working Next.js application with Prisma/SQLite, email or Google accounts, optional TOTP, wagmi/viem, and a Solidity escrow contract. Local EVM scenarios are executable. The separate `demo/` application shares presentational components and tokens and publishes an explicitly simulated experience to GitHub Pages; it never connects a wallet. Theme and language preferences use browser storage. Eight asynchronous dictionaries cover UI strings; bounty content stays in its original language.
