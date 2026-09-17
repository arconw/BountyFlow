# BountyFlow interactive demo

A standalone Next.js static export for GitHub Pages. It shares the application's design tokens, cards, animated grids, filtering controls, curated skill picker, and appearance settings. It has no server, authentication provider, wallet connector, database, RPC client, or real payments.

From the repository root:

```sh
npm run demo:build
npm run demo:test
node scripts/serve-demo.mjs
```

The export is written to `demo/out`. The default URL is `http://127.0.0.1:3200/BountyFlow/`. Set `NEXT_PUBLIC_BASE_PATH` before building and serving to change the prefix.

## Try the workflow

1. Explore the board and filter by a skill, status, or search term.
2. Select the creator profile in the demo banner and create a bounty.
3. Switch to the contributor profile and accept it.
4. Return to its creator and release the virtual reward.
5. Try rejection, failure, and retry in the confirmation dialog, or cancel an unassigned bounty.

No wallet is connected, even if a browser wallet is installed. The banner and every transaction dialog identify the simulation. Virtual balances use exact ETH arithmetic. Mutations validate ownership and allowed status transitions.

## Organization

| Directory     | Purpose                                                                  |
| ------------- | ------------------------------------------------------------------------ |
| `app/`        | Exported routes, metadata, and shared styling                            |
| `components/` | Demo navigation, controls, forms, and transaction previews               |
| `state/`      | Validated local state, profile updates, and simulated bounty transitions |
| `fixtures/`   | Sample profiles and bounties                                             |
| `locales/`    | Demo-specific translations in eight languages                            |
| `styles/`     | Demo-only layout rules built on the main design tokens                   |
| `tests/`      | Browser tests of the generated static export                             |

`scripts/build-demo.mjs` merges the demo translations with the shared dictionaries into generated `demo/public/locales/` files. The selected locale loads asynchronously. English, Russian, Spanish, Portuguese, French, German, Polish, and Ukrainian are supported. Theme and locale persist locally.

The simulated workspace uses a separate localStorage key, `bountyflow_public_demo_v1`. It persists after reload, belongs to the current browser, and can be restored with **Reset demo**. Profiles are samples, so visitors should not enter personal information.

There are nine initial bounties. IDs 101–164 have prebuilt routes so newly created demo bounties support navigation and reloads on static hosting. A reset becomes necessary after 64 total bounties. New bounties are visible only in the browser where they were created; sharing their URL does not share local data. Simulation activity retains the most recent 200 actions.

The production application remains a separate server-backed Next.js application. This export demonstrates its interaction design; it does not demonstrate an actual blockchain transaction or replace the local-chain integration tests.
