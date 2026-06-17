# The Sprinkles Spree 🧁

A little dashboard for the **Commerce Design Squad** — five designers (Jill, Ann, Poli, Jana, Veronica) shipping real, merged improvements into WooCommerce, one pull request at a time.

**Live:** https://j111q.github.io/commerce-design-sprinkles/

It's a single self-contained page: a unified feed of merged / open / draft PRs, filterable by designer and by focus area, with a "where we've been" map of the surfaces the squad has touched. No rankings, no per-person scoreboards — just the work.

## How it's built

Static HTML + React (via CDN) + in-browser Babel — no build step. The data is **real**, pulled from GitHub and baked into `dash-data.js` as plain literals so the page stays self-contained (no API keys or runtime calls).

- `index.html` — the dashboard (entry point)
- `sprinkles-app.jsx` — the app
- `tweaks-panel.jsx` — live-tweak controls (only active inside the design host)
- `dash-data.js` — generated PR data
- `styles/` — WordPress-admin base + Woo brand accents + Inter
- `Squad PR Dashboard Directions.html` — early three-direction exploration (bonus)

## Refreshing the data

```sh
GH_TOKEN=$(gh auth token) node fetch-data.mjs
```

`fetch-data.mjs` searches each squad member's merged + open PRs across WooCommerce core and first-party extension repos (WooPayments, MailPoet, Woo Shipping, Google for WooCommerce), derives a focus area per PR, and rewrites `dash-data.js`. Edit the `SQUAD` / `REPOS` lists at the top to change scope.
