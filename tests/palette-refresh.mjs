import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const tokenCss = readFileSync(resolve("styles/woo-accents.css"), "utf8");
const app = readFileSync(resolve("sprinkles-app.jsx"), "utf8");
const index = readFileSync(resolve("index.html"), "utf8");
const source = [tokenCss, app, index].join("\n");

const checks = [
	{
		name: "palette no longer exposes the cream background token",
		pass: !source.includes("--woo-cream") &&
			!source.includes("#F6F1ED") &&
			!source.includes("246,241,237"),
	},
	{
		name: "palette uses porcelain blue as the app background",
		pass: /--woo-bg:\s*#F5F7FA;/.test(tokenCss) &&
			/background: "var\(--woo-bg\)"/.test(app) &&
			/body \{ background: var\(--woo-bg\); \}/.test(index),
	},
	{
		name: "palette includes a soft blue panel tone",
		pass: /--woo-panel-soft:\s*#EEF3FF;/.test(tokenCss),
	},
	{
		name: "palette uses a cooler rule color",
		pass: /--woo-rule:\s*rgba\(30, 17, 66, 0\.10\);/.test(tokenCss),
	},
	{
		name: "sticky bar translucent background follows the new page tint",
		pass: /background: rgba\(245,247,250,0\.86\);/.test(app),
	},
];

const failures = checks.filter((check) => !check.pass);

if (failures.length) {
	console.error("Palette refresh guard failures:");
	for (const failure of failures) {
		console.error("- " + failure.name);
	}
	process.exit(1);
}

console.log("Palette refresh guard passed.");
