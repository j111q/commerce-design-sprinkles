import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const app = readFileSync(resolve("sprinkles-app.jsx"), "utf8");
const tickerLine = "designers chasing the dopamine hit of hitting merge";

const checks = [
	{
		name: "ticker includes the dopamine merge line",
		pass: app.includes(`funFacts.push("${tickerLine}");`),
	},
	{
		name: "ticker renders pushed fun facts in the marquee",
		pass: /funFacts\.concat\(funFacts\)\.map/.test(app) &&
			/className="sprk-marquee-item"/.test(app),
	},
];

const failures = checks.filter((check) => !check.pass);

if (failures.length) {
	console.error("Ticker copy guard failures:");
	for (const failure of failures) {
		console.error("- " + failure.name);
	}
	process.exit(1);
}

console.log("Ticker copy guard passed.");
