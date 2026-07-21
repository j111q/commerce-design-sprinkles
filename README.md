# The Sprinkles Spree 🧁

A little dashboard for the **Commerce Design Squad** — six designers (Jill, Ann, Poli, Jana, Veronica, Filipe) shipping improvements into WooCommerce and WordPress, one pull request at a time.

**Live:** https://j111q.github.io/commerce-design-sprinkles/

## Refreshing the data

A GitHub Action (`.github/workflows/refresh-data.yml`) re-runs the fetch **every 6 hours** (and on demand via the Actions tab), committing `dash-data.js` only when the PR data actually changes. Relative times ("updated 3h ago") are computed in the browser, so the page always shows accurate times between refreshes.

To refresh manually:

```sh
GH_TOKEN=$(gh auth token) node fetch-data.mjs
```

`fetch-data.mjs` searches each squad member's merged + open PRs across WooCommerce core, first-party extension repos (WooPayments, MailPoet, Woo Shipping, Google for WooCommerce), and WordPress Core, derives a focus area per PR, and rewrites `dash-data.js`. Edit the `SQUAD` / `REPOS` lists at the top to change scope.
