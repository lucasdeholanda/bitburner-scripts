import { NS } from "@ns";

export function printError(ns: NS, e: unknown, prefix = ""): void {
	const error = e as Error;

	if (error.stack) {
		ns.tprintf(`ERROR: ${prefix ? prefix + " " : ""}%s`, error.stack);
	} else {
		ns.tprintf(`ERROR: ${prefix ? prefix + " " : ""}%s`, error);
	}
}

export function logError(ns: NS, e: unknown, prefix = ""): void {
	const error = e as Error;

	if (error.stack) {
		ns.printf(`ERROR: ${prefix ? prefix + " " : ""}%s`, error.stack);
	} else {
		ns.printf(`ERROR: ${prefix ? prefix + " " : ""}%s`, error);
	}
}