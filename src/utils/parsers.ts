import { NS, ScriptArg } from "@ns";

type FlagKey = string;
type FlagValue = ScriptArg | string[];
type FlagEntry = [FlagKey, FlagValue];

/**
 * Base interface added to every parsed flag object.
 * Contains positional arguments not matched to a named flag.
 */
interface BaseFlags<A extends ScriptArg[] = ScriptArg[]> {
  _: A;
}

/**
 * Parses command-line arguments for a Netscript script using a class definition.
 *
 * - Ensures at the type level that all class fields are compatible with `ns.flags`.
 * - Returns a strongly typed object with both named flags and positional arguments.
 * - Uses defaults defined in the class constructor.
 *
 * @template T - A class whose fields are valid `ns.flags` defaults.
 * @template A - Type of positional arguments (default `ScriptArg[]`).
 *
 * @param ns - The Bitburner Netscript API.
 * @param FlagsClass - A class whose fields represent expected flags and their default values.
 * @returns
 * An object containing:
 *   - All flag fields (from `FlagsClass`).
 *   - A `_` property with positional arguments.
 *
 * @example
 * class MyFlags {
 *   threads: number = 1;
 *   target: string = "n00dles";
 *   hackOnly: boolean = false;
 *   servers: string[] = [];
 * }
 *
 * const flags = parseArgs<MyFlags>(ns, MyFlags);
 * ns.tprint(flags.threads); // number
 * ns.tprint(flags.target);  // string
 * ns.tprint(flags.hackOnly); // boolean
 * ns.tprint(flags.servers); // string[]
 * ns.tprint(flags._);       // ScriptArg[]
 */
export function parseArgs<T extends object, A extends ScriptArg[] = ScriptArg[]>(
  ns: NS,
  FlagsClass: new () => T
): T & BaseFlags<A> {
  const defaults = new FlagsClass();
  const flagEntries = Object.entries(defaults) as FlagEntry[];
  const rawFlags = ns.flags(flagEntries);
  const flags = rawFlags as T & BaseFlags<A>;

  return flags;
}
