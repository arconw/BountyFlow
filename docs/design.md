# BountyFlow design

## Direction

A compact work marketplace for developers. The interface pairs a dark palette with generous space around the introduction, followed by a dense, useful board. Rewards carry the strongest hierarchy within cards. A small funding diagram explains escrow.

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

The board emphasizes task status, available rewards, and clear next actions. A quiet escrow pathway with an inset mint lock illustrates the funding flow. Light mode preserves the same hierarchy through a separate semantic palette.

## Scope

The Next.js application uses Prisma/SQLite, email or Google accounts, optional TOTP, wagmi/viem, and a Solidity escrow contract. Local EVM scenarios are executable. The separate `demo/` application shares presentational components and tokens and publishes an explicitly simulated experience to GitHub Pages; it never connects a wallet. Theme and language preferences use browser storage. Eight asynchronous dictionaries cover UI strings; bounty content stays in its original language.
