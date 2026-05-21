import { AutocompleteData, NS } from "@ns";
import { parseArgs } from "./utils/parsers";

class SearchFlags {
	connect = false;
}

/**
 * Usage:
 *   run search-server.js <startHost> <targetHostOrRegex> [--tprint] [--limit=N]
 *
 * Examples:
 *   run findBreadcrumb.js home n00dles --tprint
 *   run findBreadcrumb.js home "^food" --tprint --limit=6   (regex: hosts starting with "food")
 */
export async function main(ns: NS): Promise<string[] | void> {
	const {
		_: args,
		connect
	} = parseArgs<SearchFlags, string[]>(ns, SearchFlags);

	// const args: string[] = ns.args as string[];

	if (args.length < 2) {
		ns.tprintf("Usage: run search-server.js <startHost> <targetHostOrRegex> [--tprint] [--limit=N]");
		return;
	}

	const start: string = args[0];
	const rawTarget: string = args[1];
	const limitArg: string | undefined = args.find(a => a.startsWith("--limit="));
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

	visited.add(start);
	queue.push({ host: start, depth: 0 });

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
		const msg = `ERROR Target "${rawTarget}" not found from "${start}" (limit=${isFinite(depthLimit) ? depthLimit : "∞"}).`;
		ns.tprint(msg);
		return;
	}

	const path: string[] = [];
	let cur: string | undefined = found;
	while (cur !== undefined) {
		path.push(cur);
		if (cur === start) break;
		cur = parent[cur];
	}
	path.reverse();

	const summary = `SUCCESS Found: ${found} (path length ${path.length - 1})`;
	const breadcrumb = path.join(" → ");

	ns.tprint(summary);
	ns.tprint(breadcrumb);

	if (connect) {
		for (const host of path) {
			ns.singularity.connect(host);
		}
	}

	return path;
}

export function autocomplete(data: AutocompleteData, args: string[]): string[] {
	const commands = data.command.split(" ");
	const lastCommand = commands[commands.length - 1];
	const isCompletingFlag = lastCommand.startsWith("-") || lastCommand.startsWith("--");

	if (isCompletingFlag) {
		const flags = Object.keys(new SearchFlags());
		return flags.map(f => "--" + f);
	} else {
		return data.servers.filter(s => !args.includes(s));
	}
}
