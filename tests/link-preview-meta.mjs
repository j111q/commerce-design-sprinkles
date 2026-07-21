import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const html = readFileSync(resolve("index.html"), "utf8");
const expected = "Six Woo designers, real PRs, and don't ask us how many tokens.";
const previous = "Five Woo designers, real PRs, and don't ask us how many tokens.";

const descriptionTags = Array.from(
	html.matchAll(/<meta\s+name="description"\s+content="([^"]*)"\s*\/>/g),
	(match) => match[1]
);

const checks = [
	{
		name: "index defines one plain description meta tag",
		pass: descriptionTags.length === 1,
	},
	{
		name: "link preview description uses the requested copy",
		pass: descriptionTags[0] === expected,
	},
	{
		name: "link preview description no longer uses the old copy",
		pass: !html.includes(previous),
	},
];

const failures = checks.filter((check) => !check.pass);

if (failures.length) {
	console.error("Link preview metadata guard failures:");
	for (const failure of failures) {
		console.error("- " + failure.name);
	}
	process.exit(1);
}

console.log("Link preview metadata guard passed.");
