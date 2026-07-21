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
	{
		name: "right rail scrolls when taller than the viewport",
		pass: /\.sprk-rail\s*\{[^}]*max-height: calc\(100vh - 88px\);[^}]*overflow-y: auto;[^}]*overscroll-behavior: contain;/.test(app),
	},
	{
		name: "desktop grid keeps the same overall page width while giving the right rail more room",
		pass: /\.sprk-wrap\s*\{[^}]*max-width: 1180px;/.test(app) &&
			/\.sprk-grid\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\) 372px;/.test(app),
	},
	{
		name: "designer avatars stay on one row in the right rail",
		pass: /className="sprk-squad-avatars"/.test(app) &&
			/\.sprk-squad-avatars\s*\{[^}]*display: flex;[^}]*flex-wrap: nowrap;[^}]*gap: 8px;/.test(app),
	},
	{
		name: "right rail keeps its scrollbar unobtrusive",
		pass: /\.sprk-rail\s*\{[^}]*scrollbar-width: thin;[^}]*scrollbar-color: rgba\(127,84,179,0\.28\) transparent;/.test(app),
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
