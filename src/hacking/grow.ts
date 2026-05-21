import { useDebug } from "/utils/loggers";
import { fnum, ftime } from "/utils/formatters";
import { AutocompleteData, NS } from "@ns";
import { parseArgs } from "../utils/parsers";

class WeakenFlags {
	delay = 0;
	debug = false;
}

export async function main(ns: NS): Promise<void> {
	const {
		_: args,
		delay,
		debug: isDebug
	} = parseArgs<WeakenFlags, string[]>(ns, WeakenFlags);
	const debug = useDebug(ns, isDebug);

	// [targetHost!]
	const [targetHost] = args;
	if (!targetHost) return ns.tprintf("ERROR: Missing 'targetHost' argument (rawArgs[0]).");

	const expectedTime = ns.getGrowTime(targetHost);

	if (delay) await ns.asleep(delay);

	// GROW()
	const start = new Date().getTime();
	const mult = await ns.grow(targetHost);
	const end = new Date().getTime();

	const actualTime = end - start;
	debug(
		"SUCCESS [%s][💹 Grow.ts -> %s] 🔒%s🔺 ⌛ %s | (⌛ +%s) | x%s🔺",
		ns.pid,
		targetHost,
		fnum(ns.getServerSecurityLevel(targetHost) - ns.getServerMinSecurityLevel(targetHost)),
		ftime(actualTime, true),
		ftime(actualTime - expectedTime, true),
		fnum(mult)
	);
}

export function autocomplete(data: AutocompleteData, args: string[]): string[] {
	return data.servers.filter(s => !args.includes(s));
}
