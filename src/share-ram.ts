import NSServer from "/ns-wrappers/ns-server";
import { fram } from "/utils/formatters";
import { AutocompleteData, NS } from "@ns";

export function autocomplete(data: AutocompleteData, args: string[]): string[] {
	return (
		["--bought", ...data.servers].filter(opt => !args.includes(opt)));
}

export async function main(ns: NS): Promise<void> {
	const {
		_: args,
		bought: shareBoughtOnly
	} = ns.flags([
		["bought", false]
	]);

	const hosts = args as string[];

	const shareScript = "hacking/share.ts";
	const shareScriptRam = ns.getScriptRam(shareScript);

	if (shareBoughtOnly) {
		const boughtServers = ns.getPurchasedServers();

		for (const host of boughtServers) {
			const server = new NSServer(ns, host);

			const freeRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
			const threads = Math.floor(freeRam / shareScriptRam);

			ns.scp(shareScript, host, "home");

			if (threads > 0) {
				ns.exec(shareScript, host, threads);
				ns.tprintf("Share()ing %s RAM from %s.", fram(shareScriptRam * threads), host);
			}
		}
	} else if (hosts.length > 0) {
		for (const host of hosts) {
			const freeRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
			const threads = Math.floor(freeRam / shareScriptRam);

			ns.scp(shareScript, host, "home");

			if (threads > 0) {
				ns.exec(shareScript, host, threads);
				ns.tprintf("Share()ing %s RAM from %s.", fram(shareScriptRam * threads), host);
			}
		}
	}
}