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
		pass: /function SFlagBadge[\s\S]*font: "600 10\.5px\/14px \\"Menlo\\", \\"Consolas\\", monospace"/.test(app),
	},
	{
		name: "PR card repo number inherits the metadata font",
		pass: /<span>\{pr\.repo\.split\("\/"\)\[1\]\}#\{pr\.number\}<\/span>/.test(app),
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
