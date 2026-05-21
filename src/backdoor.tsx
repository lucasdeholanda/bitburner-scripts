// noinspection InfiniteLoopJS

import "/utils/formatters";
import { parseArgs } from "/utils/parsers";
import { AutocompleteData, NS } from "@ns";

class StatsFlags {
  hacks: number[] = [];
  actions = false;
  bought = false;
  verbose = false;
  all = false;
  backdoor = false;
}

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");

  const {
    _: args,
    hacks: hackPercents,
    actions: showActions,
    bought: onlyBought,
    verbose: isVerbose,
    all: showAll,
    backdoor: installBackdoor
  } = parseArgs<StatsFlags, string[]>(ns, StatsFlags);


  depthScan(ns, "home", 100, 1, new Set());
}

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


export function autocomplete(data: AutocompleteData, args: string[]): string[] {
  const commands = data.command.split(" ");
  const lastCommand = commands[commands.length - 1];
  const isCompletingFlag = lastCommand.startsWith("-") || lastCommand.startsWith("--");

  if (isCompletingFlag) {
    const flags = Object.keys(new StatsFlags());
    return flags.map(f => "--" + f);
  } else {
    return data.servers.filter(s => !args.includes(s));
  }
}