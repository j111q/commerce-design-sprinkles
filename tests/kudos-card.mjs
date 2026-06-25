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
		pattern: /Kudos and cupcakes[\s\S]*To the devs who review our PRs\./,
		source: app
	},
	{
		name: "app passes D.KUDOS into the kudos card",
		pattern: /<SKudosCard kudos=\{D\.KUDOS\} \/>/,
		source: app
	},
	{
		name: "app renders reviewer avatars and PR counts",
		pattern: /kudos\.reviewedPrs[\s\S]*kudos\.avatar/,
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
