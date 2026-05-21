import { NS } from "@ns";

/**
 * Scans the network starting from a given host, exploring up to the specified depth.
 *
 * - Includes the starting host in the result.
 * - Prevents revisiting already scanned hosts (avoids infinite loops).
 * - Uses depth-first search semantics internally.
 *
 * @param ns - The Bitburner Netscript API.
 * @param host - The starting host to scan from.
 * @param targetDepth - The maximum depth to explore (0 = only the host itself).
 * @returns An array of hostnames reachable within the given depth, starting with `host`.
 *
 * @throws {Error} If `targetDepth` is negative.
 *
 * @example
 * scan(ns, "home", 2);
 * // Might return: ["home", "foodnstuff", "sigma-cosmetics", "joesguns", ...]
 */
export function scan(ns: NS, host: string, targetDepth = 100): string[] {
	if (targetDepth < 0)
		throw new Error(`[targetDepth] should be 0 or greater, but was ${targetDepth}.`);

	if (targetDepth === 0) return [host];

	return [host, ...depthScan(ns, host, targetDepth, 1, new Set())];
}

/**
 * Convenience wrapper around {@link scan} that always starts at `"home"`.
 *
 * @param ns - The Bitburner Netscript API.
 * @param targetDepth - The maximum depth to explore (defaults to 100).
 * @returns An array of hostnames reachable from `"home"`.
 *
 * @example
 * scanHome(ns, 1);
 * // Might return: ["home", "foodnstuff", "sigma-cosmetics", ...]
 */
export function scanHome(ns: NS, targetDepth?: number): string[] {
	return scan(ns, "home", targetDepth);
}

/**
 * Recursive helper for {@link scan}.
 *
 * Performs a depth-limited DFS traversal of the network graph.
 *
 * @param ns - The Bitburner Netscript API.
 * @param host - The current host being scanned.
 * @param targetDepth - The maximum depth to explore.
 * @param currentDepth - The current depth in the traversal.
 * @param visitedHosts - A set of hosts already visited, to prevent cycles.
 * @returns An array of hostnames discovered at or below the current host.
 *
 * @example
 * // Normally not called directly; use scan() instead.
 */
function depthScan(
	ns: NS,
	host: string,
	targetDepth: number,
	currentDepth: number,
	visitedHosts: Set<string>
): string[] {
	visitedHosts.add(host);

	const neighbors = ns.scan(host).filter(n => !visitedHosts.has(n));

	if (currentDepth >= targetDepth) return neighbors;

	const deepNeighbors = [...neighbors];
	for (const neighbor of neighbors) {
		const deeperNeighbors = depthScan(ns, neighbor, targetDepth, currentDepth + 1, visitedHosts);
		deepNeighbors.push(...deeperNeighbors);
	}

	return deepNeighbors;
}
