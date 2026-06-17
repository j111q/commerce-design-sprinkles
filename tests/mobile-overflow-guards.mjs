import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const app = readFileSync(resolve("sprinkles-app.jsx"), "utf8");

const checks = [
	{
		name: "feed cards expose a shrinkable body column",
		pattern: /className="sprk-card-main"/,
	},
	{
		name: "PR metadata has its own wrapping hook",
		pattern: /className="sprk-meta"/,
	},
	{
		name: "tabs can scroll instead of widening the page",
		pattern: /className="sprk-tabs-scroll"/,
	},
	{
		name: "filter controls have a shared responsive wrapper",
		pattern: /\.sprk-filters\s*\{/,
	},
	{
		name: "mobile card padding is narrow enough for 390px screens",
		pattern: /@media \(max-width: 600px\)[\s\S]*\.sprk-card\s*\{[\s\S]*padding: 18px 20px !important;/,
	},
	{
		name: "long PR titles and metadata may break within words",
		pattern: /\.sprk-card-main\s*\{[\s\S]*min-width: 0;[\s\S]*overflow-wrap: anywhere;[\s\S]*\.sprk-meta\s*\{[\s\S]*overflow-wrap: anywhere;/,
	},
	{
		name: "narrow filters stack as full-width controls",
		pattern: /@media \(max-width: 600px\)[\s\S]*\.sprk-filters\s*\{[\s\S]*display: grid;[\s\S]*width: 100%;/,
	},
];

const failures = checks.filter((check) => !check.pattern.test(app));

if (failures.length) {
	console.error("Mobile overflow guard failures:");
	for (const failure of failures) {
		console.error("- " + failure.name);
	}
	process.exit(1);
}

console.log("Mobile overflow guards passed.");
