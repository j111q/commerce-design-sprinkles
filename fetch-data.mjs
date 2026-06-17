/* Regenerates dash-data.js with REAL WooCommerce-org PR data.
 *
 * Usage:  GH_TOKEN=$(gh auth token) node fetch-data.mjs
 *
 * Searches the woocommerce org for each squad member's merged + open PRs,
 * derives a product "surface" per PR, finds which squad members reviewed it,
 * and writes the result into dash-data.js as plain JS literals so the
 * prototype stays self-contained (no runtime fetch / auth in the canvas).
 *
 * Squad handles with `handle: null` are skipped until a real handle lands. */

import { writeFileSync } from "fs";

/* WooCommerce core + first-party extension repos to scan. Add/remove freely;
   repos with no squad PRs are harmless (they just contribute nothing). */
const REPOS = [
	"woocommerce/woocommerce",             // core
	"Automattic/woocommerce-payments",     // WooPayments
	"mailpoet/mailpoet",                   // MailPoet
	"woocommerce/woocommerce-shipping",    // Woo Shipping
	"woocommerce/google-listings-and-ads"  // Google for WooCommerce
];
const REPO_Q = REPOS.map((r) => `repo:${r}`).join(" ");

const TOKEN = process.env.GH_TOKEN;
if (!TOKEN) {
	console.error("GH_TOKEN env var is required:  GH_TOKEN=$(gh auth token) node fetch-data.mjs");
	process.exit(1);
}

/* ---- squad ----------------------------------------------------------------
   Colors mirror the original prototype. Add a real `handle` to bring a
   teammate's real PRs in; leave null to keep them out of the live data. */
const SQUAD = [
	{ id: "j",    name: "Jill",     handle: "j111q",          color: "#7F54B3", fg: "#fff" },
	{ id: "ann",  name: "Ann",      handle: "annchichi",      color: "#3C2A7D", fg: "#fff" },
	{ id: "poli", name: "Poli",     handle: "poligilad-auto", color: "#533582", fg: "#fff" },
	{ id: "jana", name: "Jana",     handle: "JanaMW27",       color: "#C9B8E8", fg: "#1E1142" },
	{ id: "vero", name: "Veronica", handle: "verofasulo",     color: "#E84A9C", fg: "#fff" }
];

/* ---- github ---------------------------------------------------------------- */
async function gh(url) {
	const res = await fetch(url, {
		headers: {
			Authorization: `Bearer ${TOKEN}`,
			Accept: "application/vnd.github+json",
			"User-Agent": "commerce-design-prs"
		}
	});
	if (!res.ok) {
		throw new Error(`${res.status} ${res.statusText} for ${url}\n${await res.text()}`);
	}
	return res.json();
}

function search(handle, qualifier) {
	const q = encodeURIComponent(`author:${handle} ${REPO_Q} is:pr ${qualifier}`);
	return gh(`https://api.github.com/search/issues?q=${q}&sort=updated&order=desc&per_page=100`);
}

/* ---- surface (area) mapping -----------------------------------------------
   A PR in a dedicated extension repo takes that repo's surface (a shipping-repo
   PR is Shipping no matter what its title says). Core PRs fall to an ordered
   keyword scan over title + labels; first hit wins. "Admin" is the honest
   fallback for the team's cross-cutting admin-chrome polish. */
const REPO_SURFACE = {
	"woocommerce/woocommerce-shipping": "Shipping",
	"Automattic/woocommerce-payments": "Payments",
	"mailpoet/mailpoet": "Emails",
	"woocommerce/google-listings-and-ads": "Marketing"
};
const SURFACE_RULES = [
	[/analytics|\breport/i,                              "Analytics"],
	[/home screen|dashboard|activity panel|\binbox\b/i,  "Home"],
	[/payment|gateway|woopayments/i,                     "Payments"],
	[/checkout|\bcart\b/i,                               "Checkout"],
	[/shipping/i,                                        "Shipping"],
	[/coupon/i,                                          "Coupons"],
	[/onboarding|setup wizard|task list|launch/i,        "Onboarding"],
	[/marketplace|extensions/i,                          "Marketplace"],
	[/marketing/i,                                       "Marketing"],
	[/product editor|inspector|quick edit|variation|\bsku\b|sale price|categor|\bstock\b|\bimage|\bproducts?\b/i, "Products & catalog"],
	[/\border/i,                                         "Orders"],
	[/email/i,                                           "Emails"],
	[/setting/i,                                         "Settings"],
	[/admin menu|navigation menu|main navigation|\bsubmenu\b|menu item|omnibar|admin bar/i, "Navigation"],
	[/block/i,                                           "Blocks"]
];
/* One-off corrections where the keyword scan guesses wrong. */
const SURFACE_OVERRIDES = {
	"woocommerce/woocommerce#64705": "Products & catalog" // "products dashboard" footer → Products, not Home
};
function surfaceFor(repo, number, title, labels) {
	if (SURFACE_OVERRIDES[repo + "#" + number]) return SURFACE_OVERRIDES[repo + "#" + number];
	if (REPO_SURFACE[repo]) return REPO_SURFACE[repo];
	const hay = title + " " + labels.join(" ");
	for (const [re, name] of SURFACE_RULES) if (re.test(hay)) return name;
	return "Other admin";
}

/* ---- feature-flag status --------------------------------------------------
   "Public" = shipped in a stable WooCommerce release. "Flagged" = gated behind
   a feature flag (off by default).

   GitHub exposes no flag field, and neither titles nor labels classify reliably
   ("product editor" also means the *classic* editor; the needs:documentation
   label lands on flagged and public PRs alike). The dependable signal is the
   code a PR actually touches: the flagged "experimental products app" lives in a
   dedicated JS package and a PHP feature module, so a PR editing either is
   flagged work. A short title fallback covers the named flags that live in
   shared code with no package of their own. */
const FLAG_PATHS = [
	/(^|\/)packages\/js\/experimental-products-app\//,  // products app — JS / React
	/(^|\/)src\/Admin\/Features\/ProductDataViews\//     // products app — PHP feature module
];
const FLAG_TITLE = /feature[- ]flag|order[- ]detail[- ]redesign|variations? (classic )?redesign|new variation experience|blueprint/i;
/* One-off corrections (repo#number → true forces flagged, false forces public)
   for the rare case the signals above misclassify a PR. None needed today. */
const FLAG_OVERRIDES = {};
function isFlagged(repo, number, title, files) {
	const key = repo + "#" + number;
	if (key in FLAG_OVERRIDES) return FLAG_OVERRIDES[key];
	if (REPO_SURFACE[repo]) return false; // extensions ship in their own releases
	if (files.some((p) => FLAG_PATHS.some((re) => re.test(p)))) return true;
	return FLAG_TITLE.test(title);
}

/* Changed code files for a PR (changelog entries dropped — they're noise). */
async function changedFiles(repo, number) {
	try {
		const files = await gh(`https://api.github.com/repos/${repo}/pulls/${number}/files?per_page=100`);
		return files.map((f) => f.filename).filter((p) => !/\/changelog\//.test(p));
	} catch {
		return [];
	}
}

/* ---- relative time --------------------------------------------------------- */
function monthYear(iso) {
	return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/* ---- approval: does an open PR have an APPROVED review? -------------------- */
async function isApproved(repo, number) {
	try {
		const reviews = await gh(`https://api.github.com/repos/${repo}/pulls/${number}/reviews?per_page=100`);
		return reviews.some((r) => r.state === "APPROVED");
	} catch {
		return false;
	}
}

/* ---- pooled map (gentle on the API) ---------------------------------------- */
async function pool(items, size, fn) {
	const out = [];
	let i = 0;
	const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
		while (i < items.length) {
			const idx = i++;
			out[idx] = await fn(items[idx], idx);
		}
	});
	await Promise.all(workers);
	return out;
}

/* ---- build ----------------------------------------------------------------- */
function parseRepoNumber(item) {
	// html_url: https://github.com/woocommerce/woocommerce/pull/65157
	const m = item.html_url.match(/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/);
	return { repo: m[1], number: Number(m[2]) };
}

async function collect() {
	const active = SQUAD.filter((p) => p.handle);
	console.log(`Fetching for: ${active.map((p) => p.handle).join(", ")}\nacross: ${REPOS.join(", ")}`);

	// Pull each member's real GitHub avatar.
	await Promise.all(active.map(async (p) => {
		try { p.avatar = (await gh(`https://api.github.com/users/${p.handle}`)).avatar_url; }
		catch { p.avatar = null; }
	}));

	const merged = [];
	const open = [];

	for (const p of active) {
		const [m, o] = await Promise.all([search(p.handle, "is:merged"), search(p.handle, "is:open")]);

		for (const it of m.items) {
			const { repo, number } = parseRepoNumber(it);
			merged.push({ it, repo, number, authorId: p.id, dateIso: it.closed_at || it.updated_at });
		}
		for (const it of o.items) {
			const { repo, number } = parseRepoNumber(it);
			open.push({ it, repo, number, authorId: p.id, dateIso: it.updated_at, draft: !!it.draft });
		}
	}

	// Only open, non-draft PRs need a reviews lookup (for the Approved status).
	const needsApproval = open.filter((row) => !row.draft);
	const approvals = await pool(needsApproval, 6, (row) => isApproved(row.repo, row.number));
	needsApproval.forEach((row, i) => { row.approved = approvals[i]; });

	// Feature-flag status keys off changed files, so fetch them for every PR.
	// Extension-repo PRs are public by rule, so skip those lookups.
	const allRows = merged.concat(open);
	const flagTargets = allRows.filter((row) => !REPO_SURFACE[row.repo]);
	const fileLists = await pool(flagTargets, 8, (row) => changedFiles(row.repo, row.number));
	flagTargets.forEach((row, i) => { row.files = fileLists[i]; });
	allRows.forEach((row) => { if (!row.files) row.files = []; });

	const labelsOf = (it) => (it.labels || []).map((l) => l.name);

	const MERGED = merged
		.map((row) => {
			const labels = labelsOf(row.it);
			const ts = new Date(row.dateIso).getTime();
			return {
				title: row.it.title,
				repo: row.repo,
				number: row.number,
				url: row.it.html_url,
				area: surfaceFor(row.repo, row.number, row.it.title, labels),
				flagged: isFlagged(row.repo, row.number, row.it.title, row.files),
				authors: [row.authorId],
				reviewers: [],
				ts,
				fresh: Date.now() - ts < 3 * 864e5
			};
		})
		.sort((a, b) => b.ts - a.ts);

	const OPEN = open
		.map((row) => {
			const labels = labelsOf(row.it);
			const ts = new Date(row.dateIso).getTime();
			const status = row.draft ? "Draft" : row.approved ? "Approved" : "Open";
			return {
				title: row.it.title,
				repo: row.repo,
				number: row.number,
				url: row.it.html_url,
				area: surfaceFor(row.repo, row.number, row.it.title, labels),
				flagged: isFlagged(row.repo, row.number, row.it.title, row.files),
				authors: [row.authorId],
				reviewers: [],
				status,
				ts
			};
		})
		.sort((a, b) => b.ts - a.ts);

	// Surface map from merged PRs, most-shipped first.
	const areaCount = {};
	MERGED.forEach((pr) => { areaCount[pr.area] = (areaCount[pr.area] || 0) + 1; });
	const AREAS = Object.entries(areaCount)
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

	const repos = new Set(MERGED.concat(OPEN).map((pr) => pr.repo));
	const earliest = MERGED.reduce((min, pr) => Math.min(min, pr.ts), Date.now());
	const mergedFlagged = MERGED.filter((pr) => pr.flagged).length;
	const TOTALS = {
		merged: MERGED.length,
		surfaces: AREAS.length,
		repos: repos.size,
		since: monthYear(new Date(earliest).toISOString()),
		mergedFlagged: mergedFlagged,
		mergedPublic: MERGED.length - mergedFlagged
	};

	return { MERGED, OPEN, AREAS, TOTALS };
}

/* ---- emit dash-data.js ----------------------------------------------------- */
const HELPERS = `
	function person(id) {
		return SQUAD.find(function (p) { return p.id === id; });
	}

	/* Relative time, computed at render so it's always live (no baked strings). */
	function whenLabel(ts) {
		const h = Math.max(0, Math.round((Date.now() - ts) / 36e5));
		if (h < 1) return "just now";
		if (h < 24) return h + "h ago";
		const d = Math.round(h / 24);
		if (d < 7) return d + "d ago";
		const w = Math.round(d / 7);
		if (w < 5) return w + "w ago";
		return Math.round(d / 30) + "mo ago";
	}
	/* Open/draft PRs read "updated …"; merged PRs just show the time. */
	function prWhen(pr) {
		return (pr.status && pr.status !== "Merged" ? "updated " : "") + whenLabel(pr.ts);
	}

	function pluralAge(n, unit) {
		return n + " " + unit + (n === 1 ? "" : "s") + " ago";
	}

	function dataAgeLabel(ts) {
		const seconds = Math.max(0, Math.round((Date.now() - ts) / 1000));
		if (seconds < 45) return "just now";
		const minutes = Math.round(seconds / 60);
		if (minutes < 60) return pluralAge(minutes, "minute");
		const hours = Math.round(minutes / 60);
		if (hours < 24) return pluralAge(hours, "hour");
		const days = Math.round(hours / 24);
		if (days < 30) return pluralAge(days, "day");
		const months = Math.round(days / 30);
		if (months < 12) return pluralAge(months, "month");
		return pluralAge(Math.round(days / 365), "year");
	}

	function dataUpdatedLabel() {
		const ts = new Date(DATA_META.updatedAt).getTime();
		if (Number.isNaN(ts)) return "Last updated recently";
		return "Last updated " + dataAgeLabel(ts);
	}

	/* Easter egg: rainbow sprinkle burst on merged-badge click */
	const SPRINKLE_COLORS = ["#FF3B30", "#FF9500", "#FFD60A", "#34C759", "#2F6BFF", "#5E5CE6", "#7F54B3", "#E84A9C", "#32ADE6"];
	function sprinkleBurst(e) {
		const x = e.clientX, y = e.clientY;
		for (let i = 0; i < 44; i++) {
			const s = document.createElement("div");
			const angle = Math.random() * Math.PI * 2;
			const dist = 70 + Math.random() * 180;
			const dx = Math.cos(angle) * dist;
			const dy = Math.sin(angle) * dist - 40;
			const w = 5 + Math.random() * 4;
			s.style.cssText =
				"position:fixed;left:" + x + "px;top:" + y + "px;width:" + w + "px;height:" + (11 + Math.random() * 11) +
				"px;border-radius:2.5px;pointer-events:none;z-index:99999;background:" +
				SPRINKLE_COLORS[Math.floor(Math.random() * SPRINKLE_COLORS.length)] +
				";transform:rotate(" + Math.random() * 360 + "deg);transition:transform 1s cubic-bezier(0.2,0.8,0.2,1),opacity 1s ease-out;";
			document.body.appendChild(s);
			requestAnimationFrame(function () {
				requestAnimationFrame(function () {
					s.style.transform = "translate(" + dx + "px," + (dy + 110) + "px) rotate(" + (Math.random() * 720 - 360) + "deg)";
					s.style.opacity = "0";
				});
			});
			setTimeout(function () { s.remove(); }, 1100);
		}
	}`;

function emit({ MERGED, OPEN, AREAS, TOTALS }) {
	const SQUAD_OUT = SQUAD.map((p) => ({ id: p.id, name: p.name, handle: p.handle, avatar: p.avatar || null, color: p.color, fg: p.fg }));
	const DATA_META = { updatedAt: new Date().toISOString() };
	const j = (v) => JSON.stringify(v, null, "\t");
	return `/* Shared data for the squad PR dashboard directions.
   GENERATED by fetch-data.mjs from real WooCommerce PRs — do not hand-edit.
   Re-run:  GH_TOKEN=$(gh auth token) node fetch-data.mjs */

(function () {
	const SQUAD = ${j(SQUAD_OUT)};

	const REPOS = ${j(REPOS)};

	const MERGED = ${j(MERGED)};

	const OPEN = ${j(OPEN)};

	const AREAS = ${j(AREAS)};

	const TOTALS = ${j(TOTALS)};

	const DATA_META = ${j(DATA_META)};
${HELPERS}

	window.DASH = { SQUAD: SQUAD, REPOS: REPOS, MERGED: MERGED, OPEN: OPEN, AREAS: AREAS, TOTALS: TOTALS, DATA_META: DATA_META, person: person, whenLabel: whenLabel, prWhen: prWhen, dataUpdatedLabel: dataUpdatedLabel, sprinkleBurst: sprinkleBurst };
})();
`;
}

const data = await collect();
writeFileSync(new URL("./dash-data.js", import.meta.url), emit(data));
console.log(
	`Wrote dash-data.js — ${data.MERGED.length} merged, ${data.OPEN.length} open, ` +
	`${data.AREAS.length} surfaces, ${data.TOTALS.repos} repos, since ${data.TOTALS.since}`
);
