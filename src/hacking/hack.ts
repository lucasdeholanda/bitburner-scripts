import { useDebug } from "/utils/loggers";
import { fnum, ftime } from "/utils/formatters";
import { parseArgs } from "/utils/parsers";
import { AutocompleteData, NS } from "@ns";

class HackFlags {
	delay = 0;
	debug = false;
}

export async function main(ns: NS): Promise<void> {
	const {
		_: args,
		delay,
		debug: isDebug
	} = parseArgs<HackFlags, string[]>(ns, HackFlags);
	const debug = useDebug(ns, isDebug);

	// [targetHost!]
	const [targetHost] = args;
	if (!targetHost) return ns.tprintf("ERROR: Missing 'targetHost' argument (args[0]).");

	const expectedTime = ns.getHackTime(targetHost);

	if (delay) await ns.asleep(delay);

	// HACK()
	const start = new Date().getTime();
	const stolen = await ns.hack(targetHost);
	const end = new Date().getTime();

	const actualTime = end - start;
	debug(
		"SUCCESS [%s][👾 Hack.ts -> %s] 🔒%s🔺 ⌛ %s | (⌛ +%s) | 💲%s🔻",
		ns.pid,
		targetHost,
		fnum(ns.getServerSecurityLevel(targetHost) - ns.getServerMinSecurityLevel(targetHost)),
		ftime(actualTime, true),
		ftime(actualTime - expectedTime, true),
		fnum(stolen)
	);
}

export function autocomplete(data: AutocompleteData, args: string[]): string[] {
	return data.servers.filter(s => !args.includes(s));
}
