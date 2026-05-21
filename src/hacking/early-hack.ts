// noinspection InfiniteLoopJS

import { NS } from "@ns";
import { printError } from "../utils/printers";

export async function main(ns: NS): Promise<void> {
	try {
		const [targetServer] = ns.args as string[];

		if (!targetServer) throw new Error("Missing 'targetServer' argument (args[0]).");

		const maxMoney = ns.getServerMaxMoney(targetServer);
		const minSecurity = ns.getServerMinSecurityLevel(targetServer);

		while (true) {
			if (ns.getServerSecurityLevel(targetServer) > minSecurity) {
				await ns.weaken(targetServer);
			} else if (ns.getServerMoneyAvailable(targetServer) < maxMoney) {
				await ns.grow(targetServer);
			} else {
				await ns.hack(targetServer);
			}
		}
	} catch (e) {
		printError(ns, e);
	}
}