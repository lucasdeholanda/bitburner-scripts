import {NS} from "@ns";

export class NSReference {
	private static _instance: NSReference;

	private _ns?: NS;

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor() {}

	public static get instance(): NSReference {
		if (!NSReference._instance) {
			NSReference._instance = new NSReference();
		}

		return NSReference._instance;
	}

	get(): NS {
		if (!this._ns) throw new Error("No NS reference found.");

		return this._ns;
	}

	set(ns: NS): void {
		this._ns = ns;
	}
}

export const nsRef: NSReference = NSReference.instance;