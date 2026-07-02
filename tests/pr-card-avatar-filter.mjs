import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const app = readFileSync(resolve("sprinkles-app.jsx"), "utf8");

const checks = [
	{
		name: "PR-card author avatars set the active designer filter",
		pass: /pr\.authors\.map\(function \(id\) \{[\s\S]*onClick=\{function \(\) \{setPerson\(id\);\}\}[\s\S]*<SAvatar id=\{id\} size=\{26\}/.test(app),
	},
	{
		name: "PR-card author avatars describe the filter action",
		pass: /const designer = DASH\.person\(id\);/.test(app) &&
			/title=\{"Filter by " \+ designer\.name\}/.test(app) &&
			/aria-label=\{"Filter by " \+ designer\.name\}/.test(app),
	},
	{
		name: "card avatar twirl handler is removed",
		pass: !/function avatarTwirl|AVATAR_TWIRLS|onClick=\{avatarTwirl\}/.test(app),
	},
	{
		name: "card avatar twirl animation CSS is removed",
		pass: !/sprk-tw-|sprk-tw-spin|sprk-tw-wobble|sprk-tw-flip|sprk-tw-bounce|sprk-tw-pop/.test(app),
	},
];

const failures = checks.filter((check) => !check.pass);

if (failures.length) {
	console.error("PR-card avatar filter guard failures:");
	for (const failure of failures) {
		console.error("- " + failure.name);
	}
	process.exit(1);
}

console.log("PR-card avatar filter guard passed.");
