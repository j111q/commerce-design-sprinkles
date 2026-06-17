import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const app = readFileSync(resolve("sprinkles-app.jsx"), "utf8");

const checks = [
	{
		name: "sticky header does not render the cupcake back-to-top button",
		pass: !/className="sprk-bar-logo"|aria-label="Back to top"|>🧁<\/button>/.test(app),
	},
	{
		name: "right rail no longer shows the idle designer helper copy",
		pass: !app.includes("Five designers — tap one to filter"),
	},
	{
		name: "focus-area helper copy is direct",
		pass: app.includes("Filter by focus area"),
	},
	{
		name: "old focus-area helper copy is removed",
		pass: !app.includes("Merged PRs by focus area — tap to filter"),
	},
	{
		name: "focus-area pills use compact vertical padding",
		pass: /\.sprk-chip\s*\{[\s\S]*padding: 3px 9px;/.test(app),
	},
	{
		name: "focus-area pill text uses compact line-height",
		pass: /\.sprk-chip\s*\{[\s\S]*font: 500 12px\/15px/.test(app),
	},
	{
		name: "focus-area counts use compact line-height",
		pass: /\.sprk-chip-n\s*\{[\s\S]*font: 700 10\.5px\/13px/.test(app),
	},
	{
		name: "focus-area chip cloud uses a compact gap",
		pass: /className="sprk-chip-cloud"/.test(app) && /\.sprk-chip-cloud\s*\{[\s\S]*gap: 6px;/.test(app),
	},
];

const failures = checks.filter((check) => !check.pass);

if (failures.length) {
	console.error("Rail polish guard failures:");
	for (const failure of failures) {
		console.error("- " + failure.name);
	}
	process.exit(1);
}

console.log("Rail polish guard passed.");
