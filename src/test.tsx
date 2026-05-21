import { parseArgs } from "/utils/parsers";
import { AutocompleteData, NS } from "@ns";

export function autocomplete(data: AutocompleteData, args: string[]): string[] {
  return data.servers;
}

class TestFlags {
  arr: string[] = [];
}

export async function main(ns: NS): Promise<void> {
  const parsedFlags = parseArgs<TestFlags, string[]>(ns, TestFlags);

  ns.tprintf("INFO [%s] 🔒🛠️WEAKENED!", "pserv-00");
}