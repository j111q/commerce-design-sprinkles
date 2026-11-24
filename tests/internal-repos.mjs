import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const app = readFileSync(resolve("sprinkles-app.jsx"), "utf8");
const fetcher = readFileSync(resolve("fetch-data.mjs"), "utf8");

const checks = [
	{
		name: "headline total includes internal repo merges",
		pass: app.includes("D.TOTALS.merged + D.TOTALS.privateMerged + (D.TOTALS.internalMerged || 0)"),
	},
	{
		name: "headline names internal repos only when there are some",
		pass: /D\.TOTALS\.internalMerged > 0 \?[\s\S]{0,200}in internal repos/.test(app),
	},
	{
		name: "rail line adds a designer's internal merges to their private ones",
		pass: app.includes("(p.privateMerged || 0) + (p.internalMerged || 0)"),
	},
	{
		name: "fetcher reads internal counts from private-prs.json",
		pass: fetcher.includes("internalMerged: PRIV.internalByDesigner[p.handle] || 0") &&
			fetcher.includes("internalMerged: PRIV.internalTotal"),
	},
];

const failures = checks.filter((check) => !check.pass);
if (failures.length) {
	console.error("Internal repos guard failures:");
	for (const failure of failures) console.error("- " + failure.name);
	process.exit(1);
}
console.log("Internal repos guard passed.");
