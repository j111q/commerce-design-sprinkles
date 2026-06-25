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

const checks = [
	{
		name: "fetcher pulls formal PR reviews from GitHub",
		pattern: /pulls\/\$\{number\}\/reviews\?per_page=100/,
		source: fetcher
	},
	{
		name: "fetcher aggregates review data into KUDOS",
		pattern: /function buildKudos\([\s\S]*reviewedPrs[\s\S]*approvals[\s\S]*latestAt/,
		source: fetcher
	},
	{
		name: "fetcher emits KUDOS with the generated dashboard data",
		pattern: /const KUDOS = buildKudos\(allRows, active\);[\s\S]*return \{ MERGED, OPEN, AREAS, TOTALS, KUDOS \};/,
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
		name: "generated KUDOS excludes bots and squad members",
		pass: generatedKudos.every((kudos) => !/\[bot\]$/i.test(kudos.login) && !squadHandles.has(kudos.login.toLowerCase()))
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
		pattern: /Kudos and blessings[\s\S]*To the devs who patiently review our PRs, thank you!/,
		source: app
	},
	{
		name: "app no longer uses the old kudos heading",
		pass: !/Kudos and cupcakes/.test(app)
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
		pattern: /kudos\.reviewedPrs[\s\S]*kudos\.avatar[\s\S]*reviewed " \+ label \+ "! 💜"/,
		source: app
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
		pattern: /receive your thanks/,
		source: app
	},
	{
		name: "app includes thank-you blessing lines",
		pattern: /BLESSINGS = \[[\s\S]*thank you and may your pixels always align[\s\S]*thank you and may your colours be saturated[\s\S]*thank you and be blessed with good kerning/,
		source: app
	},
	{
		name: "app renders one blessing bubble overlay",
		pattern: /sprk-blessing-bubble[\s\S]*aria-live="polite"/,
		source: app
	},
	{
		name: "app does not auto-rotate blessing copy",
		pass: !/setInterval/.test(app)
	}
];

const failures = checks.filter((check) => "pass" in check ? !check.pass : !check.pattern.test(check.source));

if (failures.length) {
	console.error("Kudos card guard failed:");
	for (const failure of failures) console.error("- " + failure.name);
	process.exit(1);
}

console.log("Kudos card guard passed.");
