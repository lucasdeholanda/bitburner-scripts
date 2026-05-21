import { scanHome } from "/utils/scanners";
import NSServer from "/ns-wrappers/ns-server";
import { AutocompleteData, NS } from "@ns";
import { ifNotEmptyish } from "./utils/checkers";
import { parseArgs } from "./utils/parsers";

export function autocomplete(data: AutocompleteData, args: string[]): string[] {
	return data.servers.filter(s => !args.includes(s));
}

class KillAllFlags {
	bought = false;
}

export async function main(ns: NS): Promise<void> {
	const {
		_: args,
		bought: onlyBought
	} = parseArgs<KillAllFlags, string[]>(ns, KillAllFlags);

	const hosts = ifNotEmptyish(args, scanHome(ns));

	let scriptsKilledCount = 0;
	for (const host of hosts) {
		const server = new NSServer(ns, host);

		if (onlyBought) {
			if (!server.isPurchased || host === "home") continue;
		}

		const wereScriptsKilled = server.killAll();

		if (wereScriptsKilled) scriptsKilledCount++;
	}

	ns.tprintf("SUCCESS Scripts Killed in [%s] servers.", scriptsKilledCount);
}
