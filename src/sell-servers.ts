import NSServer from "/ns-wrappers/ns-server";
import { fram } from "/utils/formatters";
import { NS } from "@ns";

/**
 * Deletes all purchased servers in Bitburner after first killing all scripts on them.
 *
 * ## Command Line Arguments
 * (none)
 *
 * ## Flags
 * (none)
 *
 * ## Notes
 * - This script will:
 *    1. Kill all scripts on each purchased server.
 *    2. Delete each purchased server.
 * - A server can only be deleted if it has no running scripts and no files.
 * - Use with caution — deleted servers are gone permanently.
 *
 * ## Examples
 * ```
 * run sell-servers.ts
 * ```
 *
 * @param {NS} ns - Bitburner Netscript API object
 */
export async function main(ns: NS): Promise<void> {
	// Get a list of all purchased servers
	const boughtHosts = ns.getPurchasedServers();

	// Print the maximum RAM that can be purchased for reference
	ns.tprintf("Max Purchasable RAM: %s📀", fram(ns.getPurchasedServerMaxRam()));

	// Loop through each purchased server
	for (const host of boughtHosts) {
		const server = new NSServer(ns, host);

		// Kill all scripts on the server before deletion
		server.killAll();

		// Attempt to delete the server
		const isServerDeleted = server.delete();
		if (isServerDeleted)
			ns.tprintf("Deleted Server [%s]", host);
		else
			ns.tprintf("ERROR: Failed to sell Server [%s]", host);
	}
}
