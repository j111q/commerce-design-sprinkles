import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const app = readFileSync(resolve("sprinkles-app.jsx"), "utf8");
const tooltip = "PRs merged in public repos, excludes PRs in private repos";

const checks = [
	{
		name: "app defines the merged tab tooltip copy once",
		pass: app.includes(`const MERGED_TAB_TOOLTIP = "${tooltip}";`),
	},
	{
		name: "tabs accept a unique id prefix for duplicate tab rows",
		pass: /function STabs\(\{ active, onChange, tabStyle, counts, idPrefix \}\)/.test(app),
	},
	{
		name: "merged tab button is described by its tooltip",
		pass: /aria-describedby=\{isMerged \? tooltipId : undefined\}/.test(app),
	},
	{
		name: "merged tab shows the tooltip on hover and focus",
		pass: /onMouseEnter=\{isMerged \? showMergedTabTooltip : undefined\}/.test(app) &&
			/onFocus=\{isMerged \? showMergedTabTooltip : undefined\}/.test(app) &&
			/onMouseLeave=\{isMerged \? hideMergedTabTooltip : undefined\}/.test(app) &&
			/onBlur=\{isMerged \? hideMergedTabTooltip : undefined\}/.test(app),
	},
	{
		name: "merged tab tooltip renders as a fixed tooltip",
		pass: /className="sprk-tab-tip"[\s\S]*id=\{tooltipId\}[\s\S]*role="tooltip"[\s\S]*\{MERGED_TAB_TOOLTIP\}/.test(app) &&
			/\.sprk-tab-tip\s*\{[^}]*position: fixed;[^}]*max-width: min\(252px, calc\(100vw - 32px\)\);[^}]*text-wrap: balance;/.test(app),
	},
	{
		name: "both tab rows provide unique tooltip ids",
		pass: /<STabs active=\{tab\} onChange=\{setTab\} tabStyle=\{t\.tabStyle\} counts=\{tabCounts\} idPrefix="sticky" \/>/.test(app) &&
			/<STabs active=\{tab\} onChange=\{setTab\} tabStyle=\{t\.tabStyle\} counts=\{tabCounts\} idPrefix="feed" \/>/.test(app),
	},
];

const failures = checks.filter((check) => !check.pass);

if (failures.length) {
	console.error("Tab tooltip guard failures:");
	for (const failure of failures) {
		console.error("- " + failure.name);
	}
	process.exit(1);
}

console.log("Tab tooltip guard passed.");
