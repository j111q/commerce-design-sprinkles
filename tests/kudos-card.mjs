import { readFileSync } from "fs";
import { resolve } from "path";
import vm from "node:vm";

const fetcher = readFileSync(resolve("fetch-data.mjs"), "utf8");
const data = readFileSync(resolve("dash-data.js"), "utf8");
const app = readFileSync(resolve("sprinkles-app.jsx"), "utf8");
const context = { window: {} };
vm.runInNewContext(data, context);

const D = context.window.DASH;
const squadHandles = new Set(D.SQUAD.map((person) => person.handle).filter(Boolean).map((handle) => handle.toLowerCase()));
const generatedKudos = D.KUDOS || [];
const automatedReviewerPattern = /(?:\[bot\]|bot|copilot|code.?rabbit|cursor|devin|claude|openai|chatgpt|gemini)/i;
const blessingMatch = app.match(/const BLESSINGS = \[([\s\S]*?)\];/);
const blessingLines = blessingMatch ? Array.from(blessingMatch[1].matchAll(/"([^"]+)"/g), (match) => match[1]) : [];
const expectedBlessings = [
	"thank you and may all your pixels always align",
	"thank you and may your colours forever be saturated",
	"thank you and we hope your text will always have good kerning",
	"thank you and may your spacing tokens feel spacious",
	"thank you and we wish you enticingly clickable buttons",
	"thank you and may your icons look visually balanced",
	"thank you and i hope your screen is never too bright for your eyes",
	"thank you and we hope your life feels intentional and intuitive",
	"thank you and may all your buttons be clicked",
	"thank you and may you never feel lost in layers",
	"thank you and we hope the palette of your life is harmonious",
	"thank you and we wish you many cute empty states"
];

const checks = [
	{
		name: "fetcher pulls formal PR reviews from GitHub",
		pattern: /pulls\/\$\{number\}\/reviews\?per_page=100/,
		source: fetcher
	},
	{
		name: "fetcher pulls PR review comments from GitHub",
		pattern: /pulls\/\$\{number\}\/comments\?per_page=100/,
		source: fetcher
	},
	{
		name: "fetcher pulls PR conversation comments from GitHub",
		pattern: /issues\/\$\{number\}\/comments\?per_page=100/,
		source: fetcher
	},
	{
		name: "fetcher aggregates review data into KUDOS",
		pattern: /function buildKudos\([\s\S]*reviewedPrs[\s\S]*approvals[\s\S]*latestAt/,
		source: fetcher
	},
	{
		name: "fetcher filters automated review accounts",
		pattern: /function isAutomatedReviewer\([\s\S]*copilot[\s\S]*code\.\?rabbit[\s\S]*devin/,
		source: fetcher
	},
	{
		name: "fetcher bases KUDOS on merged PRs",
		pattern: /const KUDOS = buildKudos\(merged, active\);[\s\S]*return \{ MERGED, OPEN, AREAS, TOTALS, KUDOS \};/,
		source: fetcher
	},
	{
		name: "dash-data defines KUDOS",
		pattern: /const KUDOS = \[/,
		source: data
	},
	{
		name: "dash-data exposes KUDOS on window.DASH",
		pattern: /window\.DASH = \{[\s\S]*KUDOS: KUDOS/,
		source: data
	},
	{
		name: "generated KUDOS contains reviewer entries",
		pass: generatedKudos.length > 0
	},
	{
		name: "generated KUDOS excludes bots, AI reviewers, and squad members",
		pass: generatedKudos.every((kudos) =>
			!automatedReviewerPattern.test(kudos.login + " " + kudos.url) &&
			!squadHandles.has(kudos.login.toLowerCase())
		)
	},
	{
		name: "generated KUDOS entries include avatars, profile URLs, and PR counts",
		pass: generatedKudos.every((kudos) => kudos.avatar && kudos.url && kudos.reviewedPrs > 0)
	},
	{
		name: "generated KUDOS is sorted by reviewed PR count",
		pass: generatedKudos.every((kudos, index) => index === 0 || generatedKudos[index - 1].reviewedPrs >= kudos.reviewedPrs)
	},
	{
		name: "app renders the kudos card copy",
		pattern: /kudos to reviewers 💜[\s\S]*To the devs who patiently review our PRs, thank you!/,
		source: app
	},
	{
		name: "app renders a kudos chevron state indicator",
		pattern: /className="sprk-kudos-chevron"[\s\S]*aria-hidden="true"/,
		source: app
	},
	{
		name: "app gives the kudos chevron open and collapsed states",
		pattern: /sprk-kudos-chevron[\s\S]*\.sprk-kudos-card\.is-expanded \.sprk-kudos-chevron/,
		source: app
	},
	{
		name: "app keeps the kudos heading position stable while toggling",
		pass: !/sprk-kudos-card\.is-collapsed \{ padding:/.test(app) &&
			!/sprk-kudos-card\.is-expanded \.sprk-kudos-heading \{ margin-bottom:/.test(app)
	},
	{
		name: "app no longer uses old kudos headings",
		pass: !/Kudos and cupcakes|Kudos and blessings/.test(app)
	},
	{
		name: "app renders mobile kudos below Last updated and before the grid",
		pattern: /<p className="sprk-updated">\{D\.dataUpdatedLabel\(\)\}<\/p>[\s\S]*<div className="sprk-kudos-mobile">[\s\S]*<SKudosCard kudos=\{D\.KUDOS\} \/>[\s\S]*<\/div>[\s\S]*<div className="sprk-wrap sprk-grid">/,
		source: app
	},
	{
		name: "app renders desktop kudos as its own rail card",
		pattern: /<div className="sprk-rail"[\s\S]*<div style=\{Object\.assign\(\{\}, card, \{ padding: 28 \}\)\}>[\s\S]*<\/div>\s*<SKudosCard kudos=\{D\.KUDOS\} className="sprk-kudos-rail" \/>[\s\S]*<\/div>/,
		source: app
	},
	{
		name: "app renders reviewer avatars and PR counts",
		pattern: /function showReviewerKudos\(kudos, event\)[\s\S]*kudos\.reviewedPrs[\s\S]*thank you @" \+ kudos\.login \+ " for reviewing " \+ label \+ "! 💜"[\s\S]*kudos\.avatar/,
		source: app
	},
	{
		name: "app collapses the kudos card by default",
		pattern: /const \[expanded, setExpanded\] = React\.useState\(false\);[\s\S]*aria-expanded=\{expanded\}[\s\S]*\{expanded \?/,
		source: app
	},
	{
		name: "app shows every generated kudos reviewer",
		pass: !/slice\(0,\s*6\)/.test(app)
	},
	{
		name: "app hides review counts by default",
		pass: !/sprk-kudos-count/.test(app)
	},
	{
		name: "app renders review count only in an avatar tap bubble",
		pattern: /sprk-kudos-review-bubble[\s\S]*aria-live="polite"/,
		source: app
	},
	{
		name: "app balances reviewer thank-you bubble wrapping",
		pattern: /sprk-kudos-review-bubble \{[^}]*width: max-content;[^}]*max-width: min\(24ch, calc\(100vw - 32px\)\);[^}]*text-wrap: balance;/,
		source: app
	},
	{
		name: "app clamps reviewer thank-you bubbles inside the viewport",
		pattern: /function showReviewerKudos\(kudos, event\)[\s\S]*getBoundingClientRect\(\)[\s\S]*halfWidth[\s\S]*minLeft[\s\S]*maxLeft[\s\S]*center[\s\S]*setActiveReviewer\(\{[\s\S]*login: kudos\.login[\s\S]*left: Math\.round\(Math\.min\(maxLeft, Math\.max\(minLeft, center\)\)\)[\s\S]*top:/,
		source: app
	},
	{
		name: "app positions reviewer bubbles with viewport coordinates",
		pattern: /className="sprk-kudos-review-bubble"[\s\S]*style=\{\{[\s\S]*"--reviewer-bubble-left": activeReviewer\.left \+ "px"[\s\S]*"--reviewer-bubble-top": activeReviewer\.top \+ "px"/,
		source: app
	},
	{
		name: "app renders reviewer bubbles outside avatar clipping context",
		pattern: /ReactDOM\.createPortal\([\s\S]*className="sprk-kudos-review-bubble"[\s\S]*document\.body[\s\S]*sprk-kudos-review-bubble \{[^}]*position: fixed;[^}]*left: var\(--reviewer-bubble-left\);[^}]*top: var\(--reviewer-bubble-top\);[^}]*max-width: min\(24ch, calc\(100vw - 32px\)\);[^}]*transform: translate\(-50%, -100%\);/,
		source: app
	},
	{
		name: "reviewer bubble animation preserves above-avatar positioning",
		pattern: /@keyframes sprk-review-pop \{ from \{ opacity: 0; transform: translate\(-50%, calc\(-100% \+ 3px\)\) scale\(0\.98\); \} to \{ opacity: 1; transform: translate\(-50%, -100%\) scale\(1\); \} \}/,
		source: app
	},
	{
		name: "reviewer avatar hover does not transform the fixed bubble container",
		pass: !/\.sprk-kudos-person:hover\s*\{[^}]*transform:/.test(app) &&
			/\.sprk-kudos-person:hover \.sprk-kudos-avatar\s*\{[^}]*transform: translateY\(-1px\);/.test(app)
	},
	{
		name: "app renders the tiny blessing button with the new label",
		pattern: /click to receive your special thanks 😌/,
		source: app
	},
	{
		name: "app makes the blessing button full width",
		pattern: /sprk-blessing-button \{[\s\S]*width: 100%;[\s\S]*justify-content: center;/,
		source: app
	},
	{
		name: "app uses Jill's exact blessing list",
		pass: JSON.stringify(blessingLines) === JSON.stringify(expectedBlessings)
	},
	{
		name: "app includes a larger pool of silly blessings",
		pass: blessingLines.length >= 12 && blessingLines.every((line) => line.startsWith("thank you and "))
	},
	{
		name: "app renders independent blessing bubble overlays",
		pattern: /blessingBubbles\.map\(function \(bubble\)[\s\S]*className=\{"sprk-blessing-bubble is-" \+ bubble\.phase\}[\s\S]*aria-live="polite"/,
		source: app
	},
	{
		name: "app balances blessing bubble wrapping",
		pattern: /sprk-blessing-bubble \{[^}]*text-wrap: balance;/,
		source: app
	},
	{
		name: "app centers blessing bubbles with equal padding",
		pattern: /sprk-blessing-bubble \{[^}]*width: max-content;[^}]*max-width: min\(24ch, calc\(100vw - 72px\)\);[^}]*padding: 7px 11px;[^}]*text-align: center;/,
		source: app
	},
	{
		name: "app gives each blessing bubble a random-feeling position",
		pattern: /BLESSING_SPOTS[\s\S]*--bubble-x[\s\S]*--bubble-y[\s\S]*--bubble-rotate/,
		source: app
	},
	{
		name: "app keeps multiple blessing bubbles mounted for soft exits",
		pattern: /blessingBubbles[\s\S]*setBlessingBubbles\(function \(bubbles\) \{return bubbles\.concat\(bubble\);\}\)[\s\S]*phase: "leaving"[\s\S]*filter\(function \(bubble\) \{return bubble\.id !== id;\}\)/,
		source: app
	},
	{
		name: "app gives blessing bubbles a rainbow glow",
		pattern: /sprk-blessing-bubble::before \{[\s\S]*linear-gradient[\s\S]*filter: blur/,
		source: app
	},
	{
		name: "app softly bounces blessing bubbles in and out",
		pattern: /sprk-blessing-bubble\.is-visible[\s\S]*sprk-blessing-enter 0\.48s[\s\S]*sprk-blessing-bubble\.is-leaving[\s\S]*sprk-blessing-exit 0\.58s[\s\S]*translate\(calc\(-50% \+ var\(--bubble-x\)\), calc\(var\(--bubble-y\) \+ 5px\)\)[\s\S]*translate\(calc\(-50% \+ var\(--bubble-x\)\), calc\(var\(--bubble-y\) - 2px\)\)/,
		source: app
	},
	{
		name: "app no longer uses a single replaceable blessing bubble",
		pass: !/const \[blessingPhase|const \[blessingIndex|blessingVisible|setBlessingPhase/.test(app)
	},
	{
		name: "app does not auto-rotate blessing copy",
		pass: !/setInterval/.test(app)
	},
	{
		name: "app makes the kudos card visually quieter",
		pattern: /sprk-kudos-card \{[\s\S]*background: rgba\(255,255,255,0\.3[\d]\);[\s\S]*box-shadow: none;/,
		source: app
	}
];

const failures = checks.filter((check) => "pass" in check ? !check.pass : !check.pattern.test(check.source));

if (failures.length) {
	console.error("Kudos card guard failed:");
	for (const failure of failures) console.error("- " + failure.name);
	process.exit(1);
}

console.log("Kudos card guard passed.");
