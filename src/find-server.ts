import { AutocompleteData, NS } from "@ns";

/**
 * Usage:
 *   run search-server.js <startHost> <targetHostOrRegex> [--tprint] [--limit=N]
 *
 * Examples:
 *   run findBreadcrumb.js home n00dles --tprint
 *   run findBreadcrumb.js home "^food" --tprint --limit=6   (regex: hosts starting with "food")
 */
export async function main(ns: NS): Promise<string[] | void> {
	const host: string[] = ns.args as string[];

	if (host.length < 2) {
		ns.tprintf("Usage: run search-server.js <startHost> <targetHostOrRegex> [--tprint] [--limit=N]");
		return;
	}

	const startHost = "home";
	const rawTarget: string = host[0];

	const limitArg: string | undefined = host.find(a => a.startsWith("--limit="));
	const depthLimit: number = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;

	// Detect if target is regex
	const regexChars = ["^", "$", ".*", "\\d", "[", "]", "(", ")", "|", "+"];
	const isRegex: boolean = regexChars.some(ch => rawTarget.includes(ch));

	const targetMatcher: RegExp | string = isRegex
		? new RegExp(rawTarget)
		: rawTarget;

	// --- BFS search ---
	function matchesTarget(host: string): boolean {
		if (isRegex) {
			return (targetMatcher as RegExp).test(host);
		} else {
			return host === (targetMatcher as string);
		}
	}

	const visited: Set<string> = new Set();
	const parent: Record<string, string | undefined> = {}; // childHost -> parentHost
	const queue: { host: string; depth: number }[] = [];
	let found: string | null = null;

	visited.add(startHost);
	queue.push({ host: startHost, depth: 0 });

	while (queue.length > 0) {
		const { host, depth } = queue.shift()!;
		if (depth > depthLimit) continue;

		if (matchesTarget(host)) {
			found = host;
			break;
		}

		try {
			const neighbors: string[] = ns.scan(host);
			for (const nbr of neighbors) {
				if (!visited.has(nbr)) {
					visited.add(nbr);
					parent[nbr] = host;
					queue.push({ host: nbr, depth: depth + 1 });
				}
			}
		} catch (err) {
			ns.print(`scan(${host}) failed: ${String(err)}`);
		}
	}

	// --- Reconstruct path ---
	if (!found) {
		const msg = `ERROR Target "${rawTarget}" not found from "${startHost}" (limit=${isFinite(depthLimit) ? depthLimit : "∞"}).`;
		ns.tprint(msg);
		return;
	}

	const path: string[] = [];
	let cur: string | undefined = found;
	while (cur !== undefined) {
		path.push(cur);
		if (cur === startHost) break;
		cur = parent[cur];
	}
	path.reverse();

	const summary = `SUCCESS Found: ${found} (path length ${path.length - 1})`;
	const breadcrumb = path.join(" → ");

	ns.tprint(summary);
	ns.tprint(breadcrumb);

	return path;
}

export function autocomplete(data: AutocompleteData, args: string[]): string[] {
	return data.servers.filter(s => !args.includes(s));
}
