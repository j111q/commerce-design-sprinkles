import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const app = readFileSync(resolve("sprinkles-app.jsx"), "utf8");
const data = readFileSync(resolve("dash-data.js"), "utf8");
const fetcher = readFileSync(resolve("fetch-data.mjs"), "utf8");

const checks = [
	{
		name: "generated data includes a metadata object",
		pattern: /const DATA_META = \{\s*"updatedAt": "\d{4}-\d{2}-\d{2}T[^"]+"\s*\};/,
		source: data,
	},
	{
		name: "generated data exposes metadata on window.DASH",
		pattern: /window\.DASH = \{[\s\S]*DATA_META: DATA_META/,
		source: data,
	},
	{
		name: "generated data exposes a formatted update label helper",
		pattern: /function dataUpdatedLabel\(\)[\s\S]*Data pulled/,
		source: data,
	},
	{
		name: "fetcher writes a fresh updatedAt value into emitted data",
		pattern: /const DATA_META = \{ updatedAt: new Date\(\)\.toISOString\(\) \};/,
		source: fetcher,
	},
	{
		name: "app renders the data update label below the subtitle",
		pattern: /className="sprk-updated"[\s\S]*\{D\.dataUpdatedLabel\(\)\}/,
		source: app,
	},
	{
		name: "update label has a tiny muted style",
		pattern: /\.sprk-updated\s*\{[\s\S]*font: 500 12px\/18px/,
		source: app,
	},
];

const failures = checks.filter((check) => !check.pattern.test(check.source));

if (failures.length) {
	console.error("Data update label guard failures:");
	for (const failure of failures) {
		console.error("- " + failure.name);
	}
	process.exit(1);
}

console.log("Data update label guards passed.");
