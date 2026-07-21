import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const fetcher = readFileSync(resolve("fetch-data.mjs"), "utf8");
const data = readFileSync(resolve("dash-data.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(data, context);

const D = context.window.DASH;
const filipe = D.SQUAD.find((person) => person.id === "filipe");

const checks = [
	{
		name: "fetcher includes Filipe in the squad",
		pass: /\{ id: "filipe", name: "Filipe",\s+handle: "keoshi"/.test(fetcher),
	},
	{
		name: "generated squad includes six designers",
		pass: D.SQUAD.length === 6,
	},
	{
		name: "generated squad includes Filipe's GitHub handle",
		pass: !!filipe && filipe.name === "Filipe" && filipe.handle === "keoshi",
	},
	{
		name: "generated squad includes Filipe's GitHub avatar",
		pass: !!filipe && /avatars\.githubusercontent\.com\/u\/390760/.test(filipe.avatar || ""),
	},
];

const failures = checks.filter((check) => !check.pass);

if (failures.length) {
	console.error("Squad member guard failures:");
	for (const failure of failures) {
		console.error("- " + failure.name);
	}
	process.exit(1);
}

console.log("Squad member guard passed.");
