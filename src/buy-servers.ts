import { fnum, fram, ramSuffixes } from "/utils/formatters";
import { AutocompleteData, NS } from "@ns";
import { parseArgs } from "./utils/parsers";

class BuyServersFlags {
	buy = false;
	limit = 0;
}

export async function main(ns: NS): Promise<void> {
	const {
		_: args,
		buy: shouldBuy,
		limit
	} = parseArgs<BuyServersFlags, [number, string]>(ns, BuyServersFlags);

	/* **********************
	 **** Arg Validation ****
	 ************************/

	const [rawRam, rawUnit] = args;

	if (!rawRam) return ns.tprintf("ERROR: Missing 'rawRam' argument (args[0]).");
	if (isNaN(rawRam)) return ns.tprintf("ERROR: Argument 'rawRam' (args[0]) is not a number.");
	if (!Number.isInteger(Math.log2(rawRam))) {
		return ns.tprintf("ERROR: Argument 'rawRam' (args[0]) is not a valid RAM number (must be a power of 2).");
	}

	const unit = (rawUnit || ramSuffixes[0]).toUpperCase();
	const iSuffix = ramSuffixes.indexOf(unit);
	if (iSuffix === -1) {
		return ns.tprintf("ERROR: Argument 'rawUnit' (args[1]) is not a valid RAM Unit (up to YB).");
	}

	const ram = rawRam * Math.pow(1024, iSuffix);

	const buyRamMax = ns.getPurchasedServerMaxRam();
	if (ram > buyRamMax) {
		return ns.tprintf("ERROR: RAM [%s] is larger than max purchasable RAM [%s].", fram(ram), fram(buyRamMax));
	}

	const boughtServers = ns.getPurchasedServers();
	const boughtServerCount = boughtServers.length;

	const ramCost = ns.getPurchasedServerCost(ram);
	const maxRamCost = ns.getPurchasedServerCost(buyRamMax);

	const boughtServerLimit = ns.getPurchasedServerLimit();
	const isAtServerLimit = boughtServerCount === boughtServerLimit;

	ns.tprintf(
		"%s 🖥️(%d/%d) (🥇 📀%s 💲%s)",
		isAtServerLimit ? "WARN" : "INFO",
		boughtServerCount,
		boughtServerLimit,
		fram(buyRamMax),
		fnum(maxRamCost)
	);
	ns.tprintf("SUCCESS 💿%s 💲%s [x%s: 💲%s]", fram(ram), fnum(ramCost), boughtServerLimit, fnum(ramCost * boughtServerLimit));

	if (!shouldBuy || isAtServerLimit) return;

	const buyUpTo = limit > 0 ? Math.min(boughtServerCount + limit, boughtServerLimit) : boughtServerLimit;
	let i = boughtServerCount + 1;
	while (i <= buyUpTo) {
		if (ns.getServerMoneyAvailable("home") >= ramCost) {
			ns.purchaseServer(`pserv-${i.toFixed().padStart(2, "0")}`, ram);
			i++;
		} else {
			// Wait before next purchase attempt
			await ns.sleep(1000);
		}
	}

	ns.tprintf("SUCCESS [%s] servers bought. 🖥️(%s/%s)", buyUpTo - boughtServerCount, buyUpTo, boughtServerLimit);
}

export function autocomplete(data: AutocompleteData, args: string[]): string[] {
	const commands = data.command.split(" ");
	const lastCommand = commands[commands.length - 1];
	const isCompletingFlag = lastCommand.startsWith("-") || lastCommand.startsWith("--");

	if (isCompletingFlag) {
		const flags = Object.keys(new BuyServersFlags());
		return flags.map(f => "--" + f);
	} else {
		return data.servers.filter(s => !args.includes(s));
	}
}
