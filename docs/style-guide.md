# BountyFlow style and component guide

## Where to change the design

`src/styles/tokens.css` is the central configuration point. Components use semantic CSS variables, and visual rules are grouped by interface area.

| File                | Responsibility                                                             |
| ------------------- | -------------------------------------------------------------------------- |
| `tokens.css`        | Palette, fonts, type scale, spacing, radii, dimensions, animation settings |
| `base.css`          | Reset, shared controls, buttons, focus, addresses, empty states            |
| `layout.css`        | Header, navigation, container, footer, network notice                      |
| `board.css`         | Board layout, grid, section below the list                                 |
| `board-intro.css`   | Introduction, escrow diagram, statistics                                   |
| `board-filters.css` | Search, filters, sorting, view switch                                      |
| `bounty-card.css`   | Cards, badges, authors, list view                                          |
| `bounty.css`        | Bounty details, requirements, reward panel, mobile action                  |
| `create.css`        | Form, guidance, transaction summary                                        |
| `dialogs.css`       | Wallet and transaction dialogs                                             |
| `status.css`        | Status colors and indicators                                               |
| `motion.css`        | Border shimmer, hover highlights, status and button effects                |
| `escrow-motion.css` | Escrow diagram icon and halo pulses                                        |
| `themes.css`        | Light-theme semantic palette                                               |
| `profile.css`       | Profile and appearance settings, loading, transaction notices              |
| `skills.css`        | Shared skill picker                                                        |
| `auth.css`          | Account forms and security settings                                        |

`src/app/globals.css` defines import order. Fix the relevant selector when addressing a local styling issue; keep the import order stable.

## Quick adjustments

Change `--color-accent`, `--color-accent-hover`, `--color-accent-subtle`, and `--color-on-accent` together. Text on accent buttons must retain readable contrast.

For a denser interface, reduce `--card-padding`, `--grid-gap`, and `--control-height`. Change `--container-width`, `--page-gutter`, and `--aside-width` to adjust layout width.

To change typography, update the local font imports in `src/app/layout.tsx` and the `--font-sans` and `--font-mono` families. Text sizes use `--text-*`, weights use `--weight-*`, and line heights use `--leading-*`. Brand and display sizes have additional semantic tokens.

Breakpoints are written directly in media queries because CSS custom properties do not work in ordinary `@media` conditions. The main transitions are 1050px for the grid, 760px for the mobile layout, and 590px for a single column. Narrow screens also use 420px. Check widths of 390, 768, and 1440px when changing breakpoints.

## Visual conventions

- Page backgrounds, card surfaces, and elevated controls have separate semantic roles. Use the corresponding variables.
- The accent identifies primary actions, active states, and escrow. Statuses have separate text/background pairs.
- Cards follow this order: status and ID, title, description, skills, reward, author, and time.
- Manrope Variable is the main typeface. Geist Mono is used for identifiers and addresses.
- Primary actions use `Button` with `variant="primary"`. Navigation remains a link even when styled as a button.
- Radius sizes `xs/sm` apply to badges and controls, `md/lg` to cards and panels, and `xl` to dialogs.
- Status is always conveyed through both text and color.
- Interactions use `--duration-fast` and `--duration-normal` and respect `prefers-reduced-motion`.
- Keep colors, dimensions, and decorative rules in CSS. Inline values are reserved for computed Motion transforms and cursor coordinates in CSS variables. Avoid `!important` for local fixes; the global reduced-motion override is an exception. Keep selectors scoped to components.

## Component structure

`src/app` contains routes and page composition. Demo task arrays, wallet fixtures, and large interface components belong in their dedicated modules.

`src/components/ui` contains shared primitives: buttons, accessible dialogs, addresses, and empty states. `layout` provides the application shell. `board`, `bounty`, `create`, `profile`, `auth`, and `wallet` contain components for their respective areas. The separate `demo/components` directory composes the static showcase from shared presentation components and demo controls.

Reuse `Button`, `Modal`, `StatusBadge`, `BountyCard`, and `TransactionSummary` first. Extract a component when it has its own role, owns state, or is reused. Extend the existing card composition for changes to individual fields.

## Sample data and interface content

Sample accounts and bounties live in `prisma/fixtures` and are seeded into the database. `src/content` holds filter options, form-guidance keys, transaction-state content, and the curated skill catalog. Domain types live in `src/types`. Static interface labels belong in `public/locales/*.json`; components access them through next-intl keys. Labels, errors, aria-labels, and placeholders must be translated.

To change the local sample dataset, edit `prisma/fixtures` and run `npm run demo:seed` to deploy a fresh local contract and seed the database. Board statistics come from the catalog, and amounts are calculated in wei using bigint.

The static showcase keeps its fixtures in `demo/fixtures` and browser-local state in `demo/state`. Simulated transactions validate role permissions and update only that browser's demo data. Application transactions use `TransactionProvider`, `src/hooks`, and `src/components/transactions`; the static showcase does not invoke them.

## Accessibility and verification

New controls need a visible label or `aria-label`. Dialogs use native `<dialog>`: focus stays inside, Escape closes the dialog, and closing restores the previous focus. Selection state uses `aria-pressed`. Form errors must be associated with their fields through `aria-describedby`.

Run `npm run typecheck`, `npm run build`, `npm run test:e2e`, and `npm run format:check`. Visually check the board, details, forms, and dialogs on desktop and mobile. Use the operating system's reduced-motion preference to check the static presentation.

## Animation and shimmer

- `src/components/board/animated-bounty-grid.tsx` handles card entry, exit, and rearrangement with stable bounty IDs, Motion layout, and `AnimatePresence` in `popLayout` mode. Exiting elements temporarily receive `inert` and `aria-hidden`.
- `src/components/layout/main-nav.tsx` owns the shared active-tab indicator. It moves only on route changes, including browser history navigation. Hover and keyboard focus leave its position unchanged.
- `src/styles/motion.css` defines border shimmer, surface highlights, status-dot pulses, escrow light flow, and button shine. Status styling is in `src/styles/status.css`.
- `src/components/ui/use-pointer-glow.ts` updates `--pointer-x/y` at most once per frame without rerendering the card on every pointer movement.

CSS settings live in `tokens.css`: `--duration-border-orbit`, `--duration-status-pulse`, `--duration-status-completed`, `--duration-hover`, `--duration-button-shine`, `--card-hover-lift`, `--card-spotlight-size`, `--color-card-spotlight`, and `--color-border-shimmer`. Effect colors derive from the main palette through `color-mix`.

Motion settings live in `src/lib/motion.ts`: entry, exit, and layout durations, stagger interval, maximum delay, and entry offset. Motion timings use seconds. Motion owns the transforms of `.bounty-grid-item`; do not apply CSS transforms or `transition: all` to that wrapper. Hover lift applies to the nested card.

Status labels remain readable while their dots pulse. Cancelled status is static. Border shimmer runs only on hover or keyboard focus. `prefers-reduced-motion: reduce` disables looping effects and grid movement while preserving filtering.

References: [Motion layout](https://motion.dev/docs/react-layout-animations), [AnimatePresence](https://motion.dev/docs/react-animate-presence).

## Typography and diagram motion

The main typeface is [Manrope](https://fontsource.org/fonts/manrope), bundled through `@fontsource-variable/manrope`. Its imports live in `src/app/layout.tsx`, and the family is configured in `--font-sans`. Addresses and identifiers use Geist Mono. Fonts are served by the application itself.

`src/styles/escrow-motion.css` controls the three icon pulses and the thin halo around each icon. Animation changes SVG scale and opacity without affecting block dimensions or connecting lines. `--duration-escrow-pulse`, `--escrow-icon-pulse-scale`, `--escrow-icon-rest-opacity`, `--escrow-halo-scale`, and `--escrow-halo-opacity` live in `tokens.css`. Phases are offset by one third of a cycle. Reduced motion disables the pulse completely.

The navigation indicator is a persistent element anchored to the bottom of `.main-nav`. Measurements use the active link's `offsetLeft` and width relative to the navigation element; only horizontal position and width animate. This prevents vertical movement during scroll resets and page loading. `ResizeObserver` updates geometry when fonts load or viewport width changes. `--duration-navigation` controls speed. Initial positioning is not animated.

`--type-scale` controls the overall text scale. Its current value is `1.15`, a 15% increase. It affects `--text-*` sizes, including headings, without enlarging spacing or containers.

## Themes and language

`themes.css` overrides semantic colors under `[data-theme="light"]`; the default palette is dark. next-themes handles switching. Add new colors to both palettes, including text, status, and border colors. Visual rules should work across all languages.

`profile.css` covers account settings, loading states, and transaction notices. Check long translations at 390px: German, French, and Russian often need more space. Keep native language names in `src/i18n/config.ts`. Counters use ICU plurals; translate complete messages rather than joining translated fragments.

Form validation and flows live in `src/hooks`, with input schemas in `src/lib`. Forms display translated errors instead of browser-native validation messages.
