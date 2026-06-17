import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const app = readFileSync(resolve("sprinkles-app.jsx"), "utf8");

const checks = [
	{
		name: "PR card metadata row uses a monospace font",
		pass: /className="sprk-meta"[\s\S]*font: "400 12px\/18px \\"Menlo\\", \\"Consolas\\", monospace"/.test(app),
	},
	{
		name: "PR card release badge uses a monospace font",
		pass: /function SFlagBadge[\s\S]*font: "400 10\.5px\/14px \\"Menlo\\", \\"Consolas\\", monospace"/.test(app) &&
			!/function SFlagBadge[\s\S]*font: "600 10\.5px\/14px \\"Menlo\\", \\"Consolas\\", monospace"/.test(app),
	},
	{
		name: "public release badge does not render the checkmark icon",
		pass: !app.includes("M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z") &&
			/\{copy\.path && \(/.test(app),
	},
	{
		name: "PR card repo number inherits the metadata font",
		pass: /<span>\{pr\.repo\.split\("\/"\)\[1\]\}#\{pr\.number\}<\/span>/.test(app),
	},
	{
		name: "PR card release badge appears after the timestamp",
		pass: /\{DASH\.prWhen\(pr\)\}\s*\n\s*\{pr\.status === "Merged" && <SFlagBadge flagged=\{pr\.flagged\} \/>/.test(app),
	},
	{
		name: "release badges expose custom tooltip content",
		pass: /className="sprk-flag-wrap"/.test(app) &&
			/className="sprk-flag-tip"/.test(app) &&
			/role="tooltip"/.test(app) &&
			app.includes("Included in a public WooCommerce\\u00a0release.") &&
			app.includes("Merged behind a feature flag; not in a public release\\u00a0yet."),
	},
	{
		name: "release badge tooltip uses a compact line length",
		pass: /max-width: min\(184px, calc\(100vw - 48px\)\)/.test(app),
	},
	{
		name: "release badge tooltip protects final phrases from widows",
		pass: !app.includes("WooCommerce release.") &&
			!app.includes("release yet.") &&
			app.includes("WooCommerce\\u00a0release.") &&
			app.includes("release\\u00a0yet."),
	},
	{
		name: "release badge tooltip appears on hover and keyboard focus",
		pass: /\.sprk-flag-wrap:hover \.sprk-flag-tip/.test(app) &&
			/\.sprk-flag-wrap:focus \.sprk-flag-tip/.test(app) &&
			/\.sprk-flag-wrap:focus-within \.sprk-flag-tip/.test(app) &&
			/\.sprk-flag-wrap:focus-visible \.sprk-flag-tip/.test(app),
	},
];

const failures = checks.filter((check) => !check.pass);

if (failures.length) {
	console.error("PR card metadata typography guard failures:");
	for (const failure of failures) {
		console.error("- " + failure.name);
	}
	process.exit(1);
}

console.log("PR card metadata typography guard passed.");
