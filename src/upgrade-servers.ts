import { fint, fnum, fram, ramSuffixes } from "/utils/formatters";
import { AutocompleteData, NS } from "@ns";
import { parseArgs } from "./utils/parsers";

class UpgradeServersFlags {
	buy = false;
}

export async function main(ns: NS): Promise<void> {
	// === Arguments & Flags ===
	const {
		_: args,
		buy: shouldBuy
	} = parseArgs<UpgradeServersFlags, [number, string]>(ns, UpgradeServersFlags);

	const [rawNewRam, rawUnit] = args;

	// Validate RAM amount
	if (!rawNewRam) return ns.tprintf("ERROR: Missing 'ram' argument (args[0]).");
	if (isNaN(rawNewRam)) return ns.tprintf("ERROR: Argument 'ram' (args[0]) is not a number.");
	if (!Number.isInteger(Math.log2(rawNewRam))) {
		return ns.tprintf("ERROR: Argument 'ram' (args[0]) is not a valid RAM number.");
	}

	// Validate RAM rawUnit
	const unit = (rawUnit || ramSuffixes[0]).toUpperCase();
	const suffixIndex = ramSuffixes.indexOf(unit);
	if (suffixIndex === -1) {
		return ns.tprintf("ERROR: Argument 'rawUnit' (args[1]) is not a valid RAM Unit (up to YB).");
	}

	// Calculate new RAM in GB
	const newRam = rawNewRam * Math.pow(1024, suffixIndex);

	// Check if requested RAM exceeds maximum
	const buyRamMax = ns.getPurchasedServerMaxRam();
	if (newRam > buyRamMax) {
		return ns.tprintf(
			"ERROR: RAM [%s] is larger than max purchasable RAM [%s].",
			fram(newRam),
			fram(buyRamMax)
		);
	}

	// === Cost calculations ===
	const buyCost = ns.getPurchasedServerCost(newRam);
	const buyCostMax = ns.getPurchasedServerCost(buyRamMax);

	// === Get purchased server list ===
	const boughtServers = ns.getPurchasedServers();
	const boughtServerCount = boughtServers.length;
	const buyServerLimit = ns.getPurchasedServerLimit();

	// Print basic info
	ns.tprintf("🖥️ (%d/%d)", boughtServerCount, buyServerLimit, boughtServers);
	ns.tprintf("🛒   %s📀 💲%s [🖧 💲%s]", fram(newRam), fint(buyCost), fint(buyCost * 25));
	ns.tprintf("🛒📈 %s📀 💲%s [🖧 💲%s]", fram(buyRamMax), fint(buyCostMax), fint(buyCostMax * 25));

	// If there are no servers purchased, exit
	if (boughtServers.length === 0) return;

	// === Upgrade logic ===
	let upgradeCostTotal = 0;

	for (let i = 0; i < boughtServers.length; i++) {
		const host = boughtServers[i];
		const oldRam = ns.getServerMaxRam(host);

		if (newRam > oldRam) {
			// Calculate upgrade cost
			const upgradeCost = ns.getPurchasedServerUpgradeCost(host, newRam);
			upgradeCostTotal += upgradeCost;

			// Print upgrade plan
			ns.tprintf(
				`INFO: 🛠️ [%s]🖥️ %s💿 ▶️ %s📀 (💲%s)`,
				host, fram(oldRam),
				fram(newRam),
				fint(upgradeCost)
			);

			// Skip if not buying
			if (!shouldBuy) continue;

			// Attempt upgrade
			const wasUpgradeSuccessful = ns.upgradePurchasedServer(host, newRam);
			if (!wasUpgradeSuccessful) {
				ns.tprintf(
					"ERROR: Couldn't Upgrade Server [%s] from 💿%s to 📀%s: 🧑💰💲%s.",
					host,
					fram(oldRam),
					fram(newRam),
					fnum(ns.getPlayer().money)
				);
				return;
			}

			ns.tprintf(
				`SUCCESS: Upgraded Server 🖥️[%s] from %s💿 to %s📀.`,
				host,
				fram(oldRam),
				fram(newRam)
			);
		} else {
			// No upgrade needed
			ns.tprintf("RAM Unchanged for Server 🖥️[%s] %s💿.", host, fram(oldRam));
		}
	}

	// Summary of upgrade costs
	ns.tprintf("WARN: 🛠️ Total: 💲%s", fnum(upgradeCostTotal));
}

export function autocomplete(data: AutocompleteData, args: string[]): string[] {
	return ["--buy"].filter(t => args.includes(t));
}
