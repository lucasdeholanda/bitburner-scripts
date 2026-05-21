import { NS } from "@ns";

type BaseLoggerFunction = (format: string, ...values: unknown[]) => void;

export function useDebug(ns: NS, isDebug = false): BaseLoggerFunction {
	return function (format: string, ...values: unknown[]): void {
		if (isDebug) ns.tprintf(format, ...values);
	};
}

/* TODO */
export function useLog(ns: NS): BaseLoggerFunction {
	return function (format: string, ...values: unknown[]): void {
		ns.printf(format, ...values);
	};
}

/* TODO */
export function usePrint(ns: NS): BaseLoggerFunction {
	return function (format: string, ...values: unknown[]): void {
		ns.tprintf(format, ...values);
	};
}