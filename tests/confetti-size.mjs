import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const app = readFileSync(resolve("sprinkles-app.jsx"), "utf8");
const data = readFileSync(resolve("dash-data.js"), "utf8");
const generator = readFileSync(resolve("fetch-data.mjs"), "utf8");
const burstSources = [data, generator];

const checks = [
	{
		name: "hover sparkles use a smaller font-size range",
		pass: /font-size:" \+ \(4 \+ Math\.random\(\) \* 3\)/.test(app) &&
			!/font-size:" \+ \(6 \+ Math\.random\(\) \* 5\)/.test(app),
	},
	{
		name: "burst sprinkles use a smaller width range",
		pass: burstSources.every((source) => /const w = 3 \+ Math\.random\(\) \* 2\.5;/.test(source)) &&
			burstSources.every((source) => !/const w = 5 \+ Math\.random\(\) \* 4;/.test(source)),
	},
	{
		name: "burst sprinkles use a smaller height range",
		pass: burstSources.every((source) => /height:" \+ \(6 \+ Math\.random\(\) \* 5\)/.test(source)) &&
			burstSources.every((source) => !/height:" \+ \(11 \+ Math\.random\(\) \* 11\)/.test(source)),
	},
	{
		name: "burst sprinkles use a matching smaller corner radius",
		pass: burstSources.every((source) => source.includes("\"px;border-radius:2px;")),
	},
];

const failures = checks.filter((check) => !check.pass);

if (failures.length) {
	console.error("Confetti size guard failures:");
	for (const failure of failures) {
		console.error("- " + failure.name);
	}
	process.exit(1);
}

console.log("Confetti size guard passed.");
