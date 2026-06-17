import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const app = readFileSync(resolve("sprinkles-app.jsx"), "utf8");
const data = readFileSync(resolve("dash-data.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(data, context);

const D = context.window.DASH;
const feed = D.MERGED.map((pr) => ({ ...pr, status: "Merged" })).concat(D.OPEN);
const globalProducts = feed.filter((pr) => pr.area === "Products & catalog").length;
const jillProducts = feed.filter((pr) => pr.area === "Products & catalog" && pr.authors.includes("j")).length;

const checks = [
	{
		name: "fixture has a designer-specific focus count that differs from the global count",
		pass: globalProducts !== jillProducts && jillProducts > 0,
	},
	{
		name: "focus-area counts are derived from filtered feed rows",
		pass: /const focusAreaCounts = \{\};/.test(app) && /focusAreaRows\.forEach\(function \(pr\)/.test(app),
	},
	{
		name: "focus-area counts follow the active designer filter",
		pass: /focusAreaRows = FEED\.filter\(function \(pr\) \{[\s\S]*person[\s\S]*pr\.authors\.indexOf\(person\)/.test(app),
	},
	{
		name: "focus-area counts follow the active tab",
		pass: /focusAreaRows = FEED\.filter\(function \(pr\) \{[\s\S]*TAB_FILTERS\[tab\]\(pr\)/.test(app),
	},
	{
		name: "focus-area chips render dynamic counts instead of generated global counts",
		pass: /const focusAreas = D\.AREAS\.map\(function \(a\)/.test(app) &&
			/<div className="sprk-chip-cloud">[\s\S]*\{focusAreas\.map\(function \(a\)/.test(app) &&
			!/<div className="sprk-chip-cloud">[\s\S]{0,120}\{D\.AREAS\.map\(function \(a\)/.test(app),
	},
];

const failures = checks.filter((check) => !check.pass);

if (failures.length) {
	console.error("Focus-area count guard failures:");
	for (const failure of failures) {
		console.error("- " + failure.name);
	}
	process.exit(1);
}

console.log("Focus-area count guards passed.");
