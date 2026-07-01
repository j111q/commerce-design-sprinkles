import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const fetcher = readFileSync(resolve("fetch-data.mjs"), "utf8");
const data = readFileSync(resolve("dash-data.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(data, context);

const D = context.window.DASH;
const wordpressMerged = D.MERGED.filter((pr) => pr.repo === "WordPress/wordpress-develop");
const wordpressArea = D.AREAS.find((area) => area.name === "WordPress");
const poliStatusPr = D.MERGED.find((pr) => pr.repo === "WordPress/wordpress-develop" && pr.number === 12304);
const poliVisibilityPr = D.MERGED.find((pr) => pr.repo === "WordPress/wordpress-develop" && pr.number === 12298);

const checks = [
	{
		name: "fetcher scans the WordPress Core mirror repo",
		pass: fetcher.includes('"WordPress/wordpress-develop"'),
	},
	{
		name: "fetcher maps WordPress Core PRs to the WordPress focus area",
		pass: /"WordPress\/wordpress-develop": "WordPress"/.test(fetcher),
	},
	{
		name: "fetcher searches closed WordPress Core PRs separately from GitHub-merged PRs",
		pass: /WORDPRESS_CORE_REPO/.test(fetcher) &&
			/searchWordPressCoreClosedPrs/.test(fetcher) &&
			/is:closed/.test(fetcher),
	},
	{
		name: "fetcher treats WordPress SVN changeset bot comments as shipped",
		pass: /function hasWordPressCoreSvnMergeComment/.test(fetcher) &&
			/SVN changeset/.test(fetcher) &&
			/fixes the Trac ticket/.test(fetcher),
	},
	{
		name: "generated data includes Poli's SVN-merged WordPress status PR",
		pass: !!poliStatusPr &&
			poliStatusPr.area === "WordPress" &&
			poliStatusPr.authors.includes("poli") &&
			poliStatusPr.flagged === false,
	},
	{
		name: "generated data includes Poli's SVN-merged WordPress visibility PR",
		pass: !!poliVisibilityPr &&
			poliVisibilityPr.area === "WordPress" &&
			poliVisibilityPr.authors.includes("poli") &&
			poliVisibilityPr.flagged === false,
	},
	{
		name: "generated WordPress focus-area count follows WordPress merged PRs",
		pass: !!wordpressArea &&
			wordpressArea.count === wordpressMerged.length &&
			wordpressMerged.length >= 2,
	},
];

const failures = checks.filter((check) => !check.pass);

if (failures.length) {
	console.error("WordPress core area guard failures:");
	for (const failure of failures) {
		console.error("- " + failure.name);
	}
	process.exit(1);
}

console.log("WordPress core area guard passed.");
