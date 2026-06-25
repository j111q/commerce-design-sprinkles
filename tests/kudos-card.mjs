import { readFileSync } from "fs";
import { resolve } from "path";
import vm from "node:vm";

const fetcher = readFileSync(resolve("fetch-data.mjs"), "utf8");
const data = readFileSync(resolve("dash-data.js"), "utf8");
const app = readFileSync(resolve("sprinkles-app.jsx"), "utf8");
const context = { window: {} };
vm.runInNewContext(data, context);

const D = context.window.DASH;
const squadHandles = new Set(D.SQUAD.map((person) => person.handle).filter(Boolean).map((handle) => handle.toLowerCase()));
const generatedKudos = D.KUDOS || [];
const automatedReviewerPattern = /(?:\[bot\]|bot|copilot|code.?rabbit|cursor|devin|claude|openai|chatgpt|gemini)/i;
const blessingMatch = app.match(/const BLESSINGS = \[([\s\S]*?)\];/);
const blessingLines = blessingMatch ? Array.from(blessingMatch[1].matchAll(/"([^"]+)"/g), (match) => match[1]) : [];

const checks = [
	{
		name: "fetcher pulls formal PR reviews from GitHub",
		pattern: /pulls\/\$\{number\}\/reviews\?per_page=100/,
		source: fetcher
	},
	{
		name: "fetcher pulls PR review comments from GitHub",
		pattern: /pulls\/\$\{number\}\/comments\?per_page=100/,
		source: fetcher
	},
	{
		name: "fetcher pulls PR conversation comments from GitHub",
		pattern: /issues\/\$\{number\}\/comments\?per_page=100/,
		source: fetcher
	},
	{
		name: "fetcher aggregates review data into KUDOS",
		pattern: /function buildKudos\([\s\S]*reviewedPrs[\s\S]*approvals[\s\S]*latestAt/,
		source: fetcher
	},
	{
		name: "fetcher filters automated review accounts",
		pattern: /function isAutomatedReviewer\([\s\S]*copilot[\s\S]*code\.\?rabbit[\s\S]*devin/,
		source: fetcher
	},
	{
		name: "fetcher bases KUDOS on merged PRs",
		pattern: /const KUDOS = buildKudos\(merged, active\);[\s\S]*return \{ MERGED, OPEN, AREAS, TOTALS, KUDOS \};/,
		source: fetcher
	},
	{
		name: "dash-data defines KUDOS",
		pattern: /const KUDOS = \[/,
		source: data
	},
	{
		name: "dash-data exposes KUDOS on window.DASH",
		pattern: /window\.DASH = \{[\s\S]*KUDOS: KUDOS/,
		source: data
	},
	{
		name: "generated KUDOS contains reviewer entries",
		pass: generatedKudos.length > 0
	},
	{
		name: "generated KUDOS excludes bots, AI reviewers, and squad members",
		pass: generatedKudos.every((kudos) =>
			!automatedReviewerPattern.test(kudos.login + " " + kudos.url) &&
			!squadHandles.has(kudos.login.toLowerCase())
		)
	},
	{
		name: "generated KUDOS entries include avatars, profile URLs, and PR counts",
		pass: generatedKudos.every((kudos) => kudos.avatar && kudos.url && kudos.reviewedPrs > 0)
	},
	{
		name: "generated KUDOS is sorted by reviewed PR count",
		pass: generatedKudos.every((kudos, index) => index === 0 || generatedKudos[index - 1].reviewedPrs >= kudos.reviewedPrs)
	},
	{
		name: "app renders the kudos card copy",
		pattern: /kudos to reviewers[\s\S]*To the devs who patiently review our PRs, thank you!/,
		source: app
	},
	{
		name: "app no longer uses old kudos headings",
		pass: !/Kudos and cupcakes|Kudos and blessings/.test(app)
	},
	{
		name: "app renders mobile kudos below Last updated and before the grid",
		pattern: /<p className="sprk-updated">\{D\.dataUpdatedLabel\(\)\}<\/p>[\s\S]*<div className="sprk-kudos-mobile">[\s\S]*<SKudosCard kudos=\{D\.KUDOS\} \/>[\s\S]*<\/div>[\s\S]*<div className="sprk-wrap sprk-grid">/,
		source: app
	},
	{
		name: "app renders desktop kudos as its own rail card",
		pattern: /<div className="sprk-rail"[\s\S]*<div style=\{Object\.assign\(\{\}, card, \{ padding: 28 \}\)\}>[\s\S]*<\/div>\s*<SKudosCard kudos=\{D\.KUDOS\} className="sprk-kudos-rail" \/>[\s\S]*<\/div>/,
		source: app
	},
	{
		name: "app renders reviewer avatars and PR counts",
		pattern: /kudos\.reviewedPrs[\s\S]*kudos\.avatar[\s\S]*thank you @" \+ kudos\.login \+ " for reviewing " \+ label \+ "! 💜"/,
		source: app
	},
	{
		name: "app collapses the kudos card by default",
		pattern: /const \[expanded, setExpanded\] = React\.useState\(false\);[\s\S]*aria-expanded=\{expanded\}[\s\S]*\{expanded \?/,
		source: app
	},
	{
		name: "app shows every generated kudos reviewer",
		pass: !/slice\(0,\s*6\)/.test(app)
	},
	{
		name: "app hides review counts by default",
		pass: !/sprk-kudos-count/.test(app)
	},
	{
		name: "app renders review count only in an avatar tap bubble",
		pattern: /sprk-kudos-review-bubble[\s\S]*aria-live="polite"/,
		source: app
	},
	{
		name: "app renders the tiny blessing button with the new label",
		pattern: /receive your special thanks 😌/,
		source: app
	},
	{
		name: "app makes the blessing button full width",
		pattern: /sprk-blessing-button \{[\s\S]*width: 100%;[\s\S]*justify-content: center;/,
		source: app
	},
	{
		name: "app includes thank-you blessing lines",
		pattern: /BLESSINGS = \[[\s\S]*thank you and may your pixels always align[\s\S]*thank you and may your colours be saturated[\s\S]*thank you and be blessed with good kerning/,
		source: app
	},
	{
		name: "app includes a larger pool of silly blessings",
		pass: blessingLines.length >= 12 && blessingLines.every((line) => line.startsWith("thank you and "))
	},
	{
		name: "app includes design-flavored silly blessings",
		pass: blessingLines.includes("thank you and may your Figma layers auto-name themselves") &&
			blessingLines.includes("thank you and may your z-indexes stay humble")
	},
	{
		name: "app renders one blessing bubble overlay",
		pattern: /sprk-blessing-bubble[\s\S]*aria-live="polite"/,
		source: app
	},
	{
		name: "app balances blessing bubble wrapping",
		pattern: /sprk-blessing-bubble \{[\s\S]*text-wrap: balance;/,
		source: app
	},
	{
		name: "app does not auto-rotate blessing copy",
		pass: !/setInterval/.test(app)
	},
	{
		name: "app makes the kudos card visually quieter",
		pattern: /sprk-kudos-card \{[\s\S]*background: rgba\(255,255,255,0\.3[\d]\);[\s\S]*box-shadow: none;/,
		source: app
	}
];

const failures = checks.filter((check) => "pass" in check ? !check.pass : !check.pattern.test(check.source));

if (failures.length) {
	console.error("Kudos card guard failed:");
	for (const failure of failures) console.error("- " + failure.name);
	process.exit(1);
}

console.log("Kudos card guard passed.");
