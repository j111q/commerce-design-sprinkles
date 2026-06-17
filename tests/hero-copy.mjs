import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const app = readFileSync(resolve("sprinkles-app.jsx"), "utf8");
const expected = "Five designers pushing pull requests in Woo.";
const previous = "Five designers pushing real improvements into Woo, in production, through pull requests.";

if (!app.includes(expected)) {
	console.error(`Expected hero subtitle to include: ${expected}`);
	process.exit(1);
}

if (app.includes(previous)) {
	console.error("Hero subtitle still contains the previous wording.");
	process.exit(1);
}

console.log("Hero copy guard passed.");
