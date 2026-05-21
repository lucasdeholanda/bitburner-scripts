import NSServer from "/ns-wrappers/ns-server";
import { ScriptsHelper } from "/utils/lists/scripts";
import { parseArgs } from "/utils/parsers";
import { printError } from "/utils/printers";
import { scanHome } from "/utils/scanners";
import { AutocompleteData, NS } from "@ns";

class SetupFlags {
	noBought = false;
}

export async function main(ns: NS): Promise<void> {
	try {
		const {
			_: args,
			noBought
		} = parseArgs<SetupFlags, string[]>(ns, SetupFlags);

		const [targetHost] = args;
		if (!targetHost) throw new Error("ERROR: Missing 'targetHost' argument (args[0]).");

		const home = new NSServer(ns);
		const target = new NSServer(ns, targetHost);

		const runnerHosts = scanHome(ns);
		const programsOwned = home.numProgramsOwned;
		const targetPortsRequired = target.numPortsRequired;

		// Filter: Enough Programs
		if (targetPortsRequired > programsOwned) {
			throw new Error(`You don't have enough programs for this server [${programsOwned}/${targetPortsRequired}].`);
		}

		for (const runnerHost of runnerHosts) {
			const runner = new NSServer(ns, runnerHost);

			if (noBought && runner.isPurchased) continue;

			// Runner Server Ports
			// Not Enough Programs (except Purchased)
			if (!runner.isPurchased && runner.numPortsRequired > programsOwned) continue;

			// Opening Doors and Nuking
			if (home.hasBruteSsh()) runner.bruteSsh();
			if (home.hasFtpCrack()) runner.ftpCrack();
			if (home.hasRelaySmtp()) runner.relaySMTP();
			if (home.hasHttpWorm()) runner.httpWorm();
			if (home.hasSqlInject()) runner.sqlInject();
			runner.nuke();

			// RAM Counting
			const ramMax = runner.maxRam;
			const ramFree = ramMax - runner.usedRam;

			let ramToUse;
			if (runner.isHome) {
				ramToUse = ramMax * 0.9;

				if (ramToUse > ramFree) {
					ramToUse = 0;
				}
			} else {
				ramToUse = ramFree;
			}

			// Filter: 0 Free RAM
			if (ramToUse <= 0) continue;

			const earlyHackScriptRam = home.files.earlyHack.ram();
			const threads = Math.floor(ramToUse / earlyHackScriptRam);

			// Filter: 0 Threads
			if (threads <= 0) continue;

			// Copying & Running
			runner.files.earlyHack.pull();
			// home.copyFileTo(earlyHackScript, runner);

			const pid = runner.files.earlyHack.exec(threads, targetHost);
			// const pid = runner.exec(earlyHackScript, threads, targetHost);
			if (pid <= 0) {
				throw new Error(`[${runnerHost} -> ${targetHost}]: Running [${(ScriptsHelper.EARLY_HACK)}] with args [${targetHost}] and [${threads}] threads.`);
				// ns.tprintf("ERROR: [%s]: Running [%s] with args [%s] and [%s] threads.", runnerHost, earlyHackScript, targetHost, threads);
			}
		}
	} catch (e) {
		printError(ns, e);
	}
}

export function autocomplete(data: AutocompleteData, args: string[]): string[] {
	return data.servers.filter(s => !args.includes(s));
}
