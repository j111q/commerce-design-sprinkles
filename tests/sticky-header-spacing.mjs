import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const app = readFileSync(resolve("sprinkles-app.jsx"), "utf8");
const stickyWrapRules = [...app.matchAll(/\.sprk-bar-wrap\s*\{([^}]*)\}/g)];
const narrowStickyWrapRule = stickyWrapRules.at(-1);

const failures = [];

if (!narrowStickyWrapRule) {
	failures.push("narrow sticky header has an explicit wrap rule");
} else {
	const ruleBody = narrowStickyWrapRule[1];
	const bottomPaddingValues = [...ruleBody.matchAll(/padding-bottom:\s*([^;]+);/g)].map((match) => match[1].trim());
	if (!bottomPaddingValues.includes("0")) {
		failures.push("narrow sticky header keeps tabs flush with the bar bottom");
	}
	if (bottomPaddingValues.some((value) => value !== "0")) {
		failures.push("narrow sticky header does not add bottom padding below tabs");
	}
}

if (failures.length) {
	console.error("Sticky header spacing guard failures:");
	for (const failure of failures) {
		console.error("- " + failure);
	}
	process.exit(1);
}

console.log("Sticky header spacing guard passed.");
