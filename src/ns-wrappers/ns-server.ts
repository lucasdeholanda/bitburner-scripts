import { ifset, isdef, isset } from "/utils/checkers";
import { BasicHGWOptions, NS, RunOptions, ScriptArg, Server } from "@ns";

export default class NSServer {
	private readonly server: Server;
	private readonly home: Server;
	public readonly formulas: NSServerFormulas;
	public readonly files: NSServerFiles;

	/**
	 * Represents a wrapper for a Server encapsulating its hostname and providing convenient shorthand methods for
	 * frequently used Netscript (`ns`) operations targeting that host.
	 *
	 * This abstraction helps reduce repetitive calls to methods like {@code ns.hack(host)} or
	 * {@code ns.getServerSecurityLevel(host)} by binding the server's hostname up front and exposing cleaner instance
	 * methods (e.g., {@code server.hack()} or {@code server.getSecurityLevel()}).
	 *
	 * @example```js
	 * const target = new Server(ns, "n00dles");
	 * const security = target.getSecurityLevel();
	 * await target.hack();
	 * ```
	 *
	 * @param ns The NS object provided by the main(NS) function
	 * @param hostname - Hostname of the server
	 */
	constructor(
		private readonly ns: NS,
		public readonly hostname: string = ns.getHostname()
	) {
		this.server = this.ns.getServer(this.hostname);
		this.home = this.ns.getServer("home");
		this.formulas = new NSServerFormulas(ns, this);

		// Utils
		const loggers = new NSServerFile(ns, this, "/utils/loggers.ts");
		const formatters = new NSServerFile(ns, this, "/utils/formatters.ts");
		const parsers = new NSServerFile(ns, this, "/utils/parsers.ts");
		const printers = new NSServerFile(ns, this, "/utils/printers.ts");

		// Scripts
		const hack = new NSServerFile(ns, this, "/hacking/hack.ts", [loggers, parsers, formatters]);
		const grow = new NSServerFile(ns, this, "/hacking/grow.ts", [loggers, parsers, formatters]);
		const weaken = new NSServerFile(ns, this, "/hacking/weaken.ts", [loggers, parsers, formatters]);
		const earlyHack = new NSServerFile(ns, this, "/hacking/early-hack.ts", [printers]);
		const prepareServer = new NSServerFile(ns, this, "/hacking/prepare-server.tsx", [printers, parsers, formatters]);

		this.files = {
			loggers, formatters, parsers, printers,
			hack, grow, weaken, earlyHack, prepareServer
		};
	}

	get isHome(): boolean {
		return this.hostname === "home";
	}

	/**
	 * Gets the maximum amount of money that can be available on the server.
	 *
	 * @remarks RAM cost: 0.1 GB
	 *
	 * @returns Maximum amount of money available on the server.
	 */
	get maxMoney(): number { return this.ns.getServerMaxMoney(this.hostname); }

	/**
	 * Gets the amount of money available on a server.
	 *
	 * @remarks RAM cost: 0.1 GB
	 *
	 * @returns Amount of money available on the server.
	 */
	moneyAvailable(): number { return this.ns.getServerMoneyAvailable(this.hostname); }

	/**
	 * Gets the security level of the server.
	 * <br />
	 *
	 * A server’s security level is denoted by a number, typically between 1 and 100 (but it can go above 100).
	 *
	 * @remarks RAM cost: 0.1 GB
	 *
	 * @returns Security level of the target server.
	 */
	securityLevel(): number { return this.ns.getServerSecurityLevel(this.hostname); }

	/**
	 * Returns the minimum security level of the server.
	 *
	 * @remarks RAM cost: 0.1 GB
	 *
	 * @returns Minimum security level of the server.
	 */
	get minSecurity(): number { return this.ns.getServerMinSecurityLevel(this.hostname); }


	/** How many CPU cores this server has. Affects magnitude of grow and weaken ran from this server. */
	get cpuCores(): number {
		return this.ns.getServer(this.hostname).cpuCores;
	}

	/**
	 * Running NUKE.exe on a target server gives you root access which means you can execute hacking on said server.
	 * NUKE.exe must exist on your home computer.
	 * <br />
	 *
	 * Each server has a different number of required open ports. If that number is greater than 0, you have to open its
	 * ports before nuking it.
	 * You can check the requirement with {@link NS.getServerNumPortsRequired getServerNumPortsRequired} or
	 * {@link Server.numOpenPortsRequired getServer().numOpenPortsRequired}.
	 * <br />
	 *
	 * Note that the server's required hacking level is not a requirement of nuking. You can nuke a server as long as
	 * you open enough ports, regardless of your hacking level.
	 *
	 * @remarks RAM cost: 0.05 GB
	 *
	 * @returns True if the player runs the program successfully, and false otherwise.
	 */
	nuke(): boolean {
		return this.ns.nuke(this.hostname);
	}

	/**
	 * Reduce a server's security level.
	 *
	 * Use your hacking skills to attack a server’s security, lowering the server’s security level.
	 * The runtime for this function depends on your hacking level and the target server’s security
	 * level when this function is called.
	 *
	 * This function usually lowers the security level of the target server by 0.05 per thread, and only in unusual
	 * situations does it do less. Use {@link NS.weakenAnalyze weakenAnalyze} to determine the exact value.
	 *
	 * Like {@link NS.hack hack} and {@link NS.grow grow}, `weaken` can be called on any server, regardless of
	 * where the script is running. This function requires root access to the target server, but
	 * there is no required hacking level to run the function.
	 *
	 * @example```js
	 * const currentSecurity = ns.getServerSecurityLevel("foodnstuff");
	 * currentSecurity -= await ns.weaken("foodnstuff");
	 * ```
	 *
	 * @remarks RAM cost: 0.15 GB
	 *
	 * @param opts - Optional parameters for configuring function behavior.
	 * @returns A promise that resolves to the value by which security was reduced.
	 */
	async weaken(opts?: BasicHGWOptions): Promise<number> { return this.ns.weaken(this.hostname, opts); }

	/**
	 * Use your hacking skills to increase the amount of money available on a server.
	 *
	 * Once the grow is complete, $1 is added to the server's available money for every script thread. This additive
	 * growth allows for rescuing a server even after it is emptied.
	 *
	 * After this addition, the thread count is also used to determine a multiplier, which the server's money is then
	 * multiplied by.
	 *
	 * The multiplier scales exponentially with thread count, and its base depends on the server's security
	 * level and in inherent "growth" statistic that varies between different servers.
	 *
	 * {@link NS.getServerGrowth getServerGrowth} can be used to check the inherent growth statistic of a server.
	 *
	 * {@link NS.growthAnalyze growthAnalyze} can be used to determine the number of threads needed for a specified
	 * multiplicative portion of server growth.
	 *
	 * To determine the effect of a single grow, obtain access to the Formulas API and use
	 * {@link HackingFormulas.growAmount formulas.hacking.growPercent}, or invert
	 * {@link NS.growthAnalyze growthAnalyze}.
	 *
	 * To determine how many threads are needed to return a server to max money, obtain access to the Formulas API and
	 * use
	 * {@link HackingFormulas.growThreads formulas.hacking.growThreads}, or {@link NS.growthAnalyze} *if* the server
	 * will be at the same security in the future.
	 *
	 * Like {@link NS.hack hack}, `grow` can be called on any hackable server, regardless of where the script is
	 * running. Hackable servers are any servers not owned by the player.
	 *
	 * The grow() command requires root access to the target server, but there is no required hacking
	 * level to run the command. It also raises the security level of the target server based on the number of threads.
	 * The security increase can be determined using {@link NS.growthAnalyzeSecurity | growthAnalyzeSecurity}.
	 *
	 * @example```js
	 * let currentMoney = ns.getServerMoneyAvailable("n00dles");
	 * currentMoney *= await ns.grow("n00dles");
	 * ```
	 *
	 * @remarks RAM cost: 0.15 GB
	 *
	 * @param opts - Optional parameters for configuring function behavior.
	 * @returns The total effective multiplier that was applied to the server's money (after both additive and
	 *   multiplicative growth).
	 */
	async grow(opts?: BasicHGWOptions): Promise<number> { return this.ns.grow(this.hostname, opts); }

	/**
	 * Steal a server's money.
	 *
	 * Function that is used to try and hack servers to steal money and gain hacking experience. The runtime for this
	 * command depends on your hacking level and the target server’s security level when this function is called. In
	 * order to hack a server you must first gain root access to that server and also have the required hacking level.
	 *
	 * A script can hack a server from anywhere. It does not need to be running on the same server to hack that server.
	 * For example, you can create a script that hacks the `foodnstuff`  server and run that script on any server in the
	 * game.
	 *
	 * A successful `hack()` on a server will raise that server’s security level by 0.002 per thread. You can use
	 * {@link NS.hackAnalyzeSecurity | hackAnalyzeSecurity} to calculate the security increase for a number of threads.
	 *
	 * @example```js
	 * let earnedMoney = await ns.hack("foodnstuff");
	 * ```
	 *
	 * @remarks RAM cost: 0.1 GB
	 *
	 * @param opts - Optional parameters for configuring function behavior.
	 * @returns A promise that resolves to the amount of money stolen (which is zero if the hack is unsuccessful).
	 */
	async hack(opts?: BasicHGWOptions): Promise<number> {
		return this.ns.hack(this.hostname, opts);
	}

	/**
	 * Runs the BruteSSH.exe program on the server. BruteSSH.exe must exist on your home computer.
	 *
	 * @example```js
	 * ns.brutessh("foodnstuff");
	 * ```
	 *
	 * @remarks RAM cost: 0.05 GB
	 *
	 * @returns True if the player runs the program successfully, and false otherwise.
	 */
	bruteSsh(): boolean {
		return this.ns.brutessh(this.hostname);
	}

	/**
	 * Runs the BruteSSH.exe program on the server. BruteSSH.exe must exist on your home computer.
	 *
	 * @example```js
	 * ns.brutessh("foodnstuff");
	 * ```
	 *
	 * @remarks RAM cost: 0.05 GB
	 *
	 * @returns True if the player runs the program successfully, and false otherwise.
	 */
	ftpCrack(): boolean {
		return this.ns.ftpcrack(this.hostname);
	}

	/**
	 * Runs the BruteSSH.exe program on the server. BruteSSH.exe must exist on your home computer.
	 *
	 * @example```js
	 * ns.brutessh("foodnstuff");
	 * ```
	 *
	 * @remarks RAM cost: 0.05 GB
	 *
	 * @returns True if the player runs the program successfully, and false otherwise.
	 */
	relaySMTP(): boolean {
		return this.ns.relaysmtp(this.hostname);
	}

	/**
	 * Runs the BruteSSH.exe program on the server. BruteSSH.exe must exist on your home computer.
	 *
	 * @example```js
	 * ns.brutessh("foodnstuff");
	 * ```
	 *
	 * @remarks RAM cost: 0.05 GB
	 *
	 * @returns True if the player runs the program successfully, and false otherwise.
	 */
	httpWorm(): boolean {
		return this.ns.httpworm(this.hostname);
	}

	/**
	 * Runs the BruteSSH.exe program on the server. BruteSSH.exe must exist on your home computer.
	 *
	 * @example```js
	 * ns.brutessh("foodnstuff");
	 * ```
	 *
	 * @remarks RAM cost: 0.05 GB
	 *
	 * @returns True if the player runs the program successfully, and false otherwise.
	 */
	sqlInject(): boolean {
		return this.ns.sqlinject(this.hostname);
	}

	/**
	 * Check if a script exists.
	 *
	 * Returns a boolean indicating whether the specified script exists on the target server.
	 * The filename for programs is case-insensitive, other script types are case-sensitive.
	 * For example, fileExists(“brutessh.exe”) will work fine, even though the actual program
	 * is named 'BruteSSH.exe'.
	 *
	 * @example```js
	 * // The function call will return true if the script named foo.js exists on the foodnstuff server, and false
	 *   otherwise. ns.fileExists("foo.js", "foodnstuff");
	 *
	 * // The function call will return true if the current server contains the FTPCrack.exe program, and false
	 *   otherwise.
	 * ns.fileExists("ftpcrack.exe");
	 * ```
	 *
	 * @remarks RAM cost: 0.1 GB
	 *
	 * @param fileName - Filename of script to check.
	 * @returns True if specified script exists, and false otherwise.
	 */
	hasFile(fileName: string): boolean {
		return this.ns.fileExists(fileName, this.hostname);
	}

	/**
	 * Check if {@code BruteSSH.exe} exists in the home server.
	 * <br />
	 * Convenience method for checking whether the player has the {@code BruteSSH.exe} program.
	 * <br />
	 * Equivalent to calling {@link #hasFile} with {@code BruteSSH.exe} and {@code home}.
	 *
	 * @remarks RAM cost: 0.1 GB
	 * @see #hasFile
	 *
	 * @returns True if {@code BruteSSH.exe} exists in home server, and false otherwise.
	 */
	hasBruteSsh(): boolean { return this.ns.fileExists("BruteSSH.exe", "home"); }

	/**
	 * Check if {@code FTPCrack.exe} exists in the home server.
	 * <br />
	 * Convenience method for checking whether the player has the {@code FTPCrack.exe} program.
	 * <br />
	 * Equivalent to calling {@link #hasFile} with {@code FTPCrack} and {@code home}.
	 *
	 * @remarks RAM cost: 0.1 GB
	 * @see #hasFile
	 *
	 * @returns True if {@code FTPCrack} exists in home server, and false otherwise.
	 */

	hasFtpCrack(): boolean { return this.ns.fileExists("FTPCrack.exe", "home"); }

	/**
	 * Check if {@code relaySMTP.exe} exists in home server.
	 * <br />
	 * Convenience method for checking whether the player has the {@code relaySMTP.exe} program.
	 * <br />
	 * Equivalent to calling {@link #hasFile} with {@code relaySMTP.exe} and {@code home}.
	 *
	 * @remarks RAM cost: 0.1 GB
	 * @see #hasFile
	 *
	 * @returns True if {@code relaySMTP.exe} script exists in home server, and false otherwise.
	 */
	hasRelaySmtp(): boolean { return this.ns.fileExists("relaySMTP.exe", "home"); }

	/**
	 * Check if {@code HTTPWorm.exe} exists in home server.
	 * <br />
	 * Convenience method for checking whether the player has the {@code HTTPWorm.exe} program.
	 * <br />
	 * Equivalent to calling {@link #hasFile} with {@code HTTPWorm.exe} and {@code home}.
	 *
	 * @remarks RAM cost: 0.1 GB
	 * @see #hasFile
	 *
	 * @returns True if {@code HTTPWorm.exe} exists in home server, and false otherwise.
	 */
	hasHttpWorm(): boolean { return this.ns.fileExists("HTTPWorm.exe", "home"); }

	/**
	 * Check if {@code SQLInject.exe} exists in home server.
	 * <br />
	 * Convenience method for checking whether the player has the {@code SQLInject.exe} program.
	 * <br />
	 * Equivalent to calling {@link #hasFile} with {@code SQLInject.exe} and {@code home}.
	 *
	 * @remarks RAM cost: 0.1 GB
	 * @see #hasFile
	 *
	 * @returns True if {@code SQLInject.exe} exists in home server, and false otherwise.
	 */
	hasSqlInject(): boolean { return this.ns.fileExists("SQLInject.exe", "home"); }

	/**
	 * Check if {@code Formulas.exe} exists in home server.
	 * <br />
	 * Convenience method for checking whether the player has the {@code Formulas.exe} program.
	 * <br />
	 * Equivalent to calling {@link #hasFile} with {@code Formulas.exe} and {@code home}.
	 *
	 * @remarks RAM cost: 0.1 GB
	 * @see #hasFile
	 *
	 * @returns True if {@code Formulas.exe} exists in home server, and false otherwise.
	 */
	hasFormulas(): boolean { return this.ns.fileExists("Formulas.exe", "home"); }

	/** Flag indicating whether this is a purchased server */
	get isPurchased(): boolean {
		return this.server.purchasedByPlayer;
	}

	/**
	 * Copies a script or literature (.lit) script(s) to another server. The files argument can be either a string
	 * specifying a single script to copy, or an array of strings specifying multiple files to copy.
	 *
	 * @remarks RAM cost: 0.6 GB
	 *
	 * @example```js
	 * // Copies foo.lit from the helios server to the home computer:
	 * ns.scp("foo.lit", "home", "helios" );
	 *
	 * // Tries to copy three files from rothman-uni to home computer:
	 * const files = ["foo1.lit", "foo2.txt", "foo3.js"];
	 * ns.scp(files, "home", "rothman-uni");
	 * ```
	 * @example```js
	 * const server = ns.args[0];
	 * const files = ["hack.js", "weaken.js", "grow.js"];
	 * ns.scp(files, server, "home");
	 * ```
	 * @param files - Filename or an array of filenames of script/literature files to copy. Note that if a script is
	 *   located in a subdirectory, the filename must include the leading `/`.
	 * @param destination - Hostname of the destination server, which is the server to which the script will be copied.
	 * @returns True if the script is successfully copied over and false otherwise. If the files argument is an array then
	 *   this function will return false if any of the operations failed.
	 */
	copyFileTo(files: string | string[], destination: NSServer | string): boolean {
		const destinationHost = typeof destination === "string"
			? destination
			: destination.hostname;

		return this.ns.scp(files, destinationHost, this.hostname);
	}

	/**
	 * Copies a script or literature (.lit) script(s) to another server. The files argument can be either a string
	 * specifying a single script to copy, or an array of strings specifying multiple files to copy.
	 *
	 * @remarks RAM cost: 0.6 GB
	 *
	 * @example```js
	 * // Copies foo.lit from the helios server to the home computer:
	 * ns.scp("foo.lit", "home", "helios" );
	 *
	 * // Tries to copy three files from rothman-uni to home computer:
	 * const files = ["foo1.lit", "foo2.txt", "foo3.js"];
	 * ns.scp(files, "home", "rothman-uni");
	 * ```
	 * @example```js
	 * const server = ns.args[0];
	 * const files = ["hack.js", "weaken.js", "grow.js"];
	 * ns.scp(files, server, "home");
	 * ```
	 * @param files - Filename or an array of filenames of script/literature files to copy. Note that if a script is
	 *   located in a subdirectory, the filename must include the leading `/`.
	 * @param origin - Hostname of the origin server, which is the server to which the script will be copied.
	 * @returns True if the script is successfully copied over and false otherwise. If the files argument is an array then
	 *   this function will return false if any of the operations failed.
	 */
	copyFileFrom(files: string | string[], origin: NSServer | string): boolean {
		const originHost = typeof origin === "string"
			? origin
			: origin.hostname;

		return this.ns.scp(files, this.hostname, originHost);
	}

	get serverGrowth(): number {
		return this.ns.getServerGrowth(this.hostname);
	}

	/**
	 * Returns the required hacking level of the server.
	 *
	 * @remarks RAM cost: 0.1 GB
	 *
	 * @returns The required hacking level of the server.
	 */
	get requiredHackingLevel(): number {
		return this.ns.getServerRequiredHackingLevel(this.hostname);
	}

	get maxRam(): number {
		return this.ns.getServerMaxRam(this.hostname);
	}

	get usedRam(): number {
		return this.ns.getServerUsedRam(this.hostname);
	}

	/**
	 * Returns the amount of time in milliseconds it takes to execute the {@link NS.weaken weaken}
	 * Netscript function on the this server. <br />
	 * The required time is increased by the security level of the target server and decreased by the
	 * player's hacking level.
	 *
	 * @remarks RAM cost: 0.05 GB
	 *
	 * @returns Returns the amount of time in milliseconds it takes to execute the
	 *   {@link NS.weaken weaken} Netscript function.
	 */
	weakenTime(): number {
		return this.ns.getWeakenTime(this.hostname);
	}

	growTime(): number {
		return this.ns.getGrowTime(this.hostname);
	}

	/**
	 * Returns the amount of time in milliseconds it takes to execute the {@link NS.hack hack()} Netscript function on
	 * the target server.
	 * <br />
	 * The required time is increased by the security level of the target server and decreased by the player's hacking
	 * level.
	 *
	 * @remarks RAM cost: 0.05 GB
	 *
	 * @returns Returns the amount of time in milliseconds it takes to execute the {@link NS.hack hack()} Netscript
	 * function.
	 */
	hackTime(): number {
		return this.ns.getHackTime(this.hostname);
	}

	/**
	 * Calculate the number of grow threads needed for a given multiplicative growth factor.
	 * @remarks
	 * RAM cost: 1 GB
	 *
	 * This function returns the total decimal number of {@link NS.grow | grow} threads needed in order to multiply the
	 * money available on the specified server by a given multiplier, if all threads are executed at the server's
	 * current security level, regardless of how many threads are assigned to each call.
	 *
	 * Note that there is also an additive factor that is applied before the multiplier. Each {@link NS.grow | grow}
	 * call will add $1 to the host's money for each thread before applying the multiplier for its thread count. This
	 * means that at extremely low starting money, fewer threads would be needed to apply the same effective multiplier
	 * than what is calculated by growthAnalyze.
	 *
	 * Like other basic hacking analysis functions, this calculation uses the current status of the player and server.
	 * To calculate using hypothetical server or player status, obtain access to the Formulas API and use
	 *   {@link HackingFormulas.growThreads | formulas.hacking.growThreads}.
	 *
	 * @example```js
	 * // calculate number of grow threads to apply 2x growth multiplier on n00dles (does not include the additive
	 *   growth). const growThreads = ns.growthAnalyze("n00dles", 2);
	 *
	 * // When using the thread count to launch a script, it needs to be converted to an integer.
	 * ns.run("noodleGrow.js", Math.ceil(growThreads));
	 * ```
	 *
	 * @param multiplier - Multiplier that will be applied to a server's money after applying additive growth. Decimal
	 *   form.
	 * @param cores - Number of cores on the host running the grow function. Optional, defaults to 1.
	 * @returns Decimal number of grow threads needed for the specified multiplicative growth factor (does not include
	 *   additive growth).
	 */
	growthAnalyze(multiplier: number, cores?: number): number {
		return this.ns.growthAnalyze(this.hostname, multiplier, cores);
	}

	/**
	 * Returns the security increase that would occur if a grow with this many threads happened.
	 *
	 * Security increase is limited by the number of threads needed to reach maximum money
	 *
	 * <strong>No Formula equivalent.</strong>
	 *
	 * @remarks RAM cost: 1 GB
	 *
	 * @param threads - Amount of threads that will be used.
	 * @param cores - Optional. The number of cores of the server that would run grow.
	 * @returns The security increase.
	 */
	growthAnalyzeSecurity(threads: number, cores?: number): number {
		return this.ns.growthAnalyzeSecurity(threads, this.hostname, cores);
	}

	/**
	 *
	 *
	 * @param threads
	 * @param cores
	 */
	growSecurityIncrease(threads = 1): number {
		const baseSecIncrease = .004;

		return baseSecIncrease * threads;
	}

	/**
	 * Returns the part of the specified server’s money you will steal with a single thread hack.
	 * <br />
	 * Like other basic hacking analysis functions, this calculation uses the current status of the player and server.
	 * To calculate using hypothetical server or player status, obtain access to the Formulas API and use
	 * {@link NS.formulas.hackPercent formulas.hacking.hackPercent}.
	 *
	 * @example```js
	 * // For example, assume the following returns 0.01:
	 * const hackAmount = ns.hackAnalyze("foodnstuff");
	 * // This means that if hack the foodnstuff server using a single thread, then you will steal 1%, or 0.01 of its
	 * // total money. If you hack using N threads, then you will steal N*0.01 times its total money.
	 * ```
	 *
	 * @remarks RAM cost: 1 GB
	 *
	 * @returns The part of money you will steal from the target server with a single thread hack.
	 */
	hackAnalyze(): number {
		return this.ns.hackAnalyze(this.hostname);
	}

	/**
	 * Returns the chance you have of successfully hacking the specified server. <br />
	 * This returned value is in the range 0-1.
	 *
	 * Like other basic hacking analysis functions, this calculation uses the current status of the
	 * player and server.
	 * To calculate using hypothetical server or player status, obtain access to the
	 * Formulas API and use {@link HackingFormulas.hackChance formulas.hacking.hackChance}.
	 *
	 * @remarks RAM cost: 1 GB
	 *
	 * @returns The chance you have of successfully hacking the target server.
	 */
	hackAnalyzeChance(): number {
		return this.ns.hackAnalyzeChance(this.hostname);
	}

	/**
	 * Returns the security increase that would occur if a hack with this many threads happened.
	 *
	 * @remarks RAM cost: 1 GB
	 *
	 * @param threads - Amount of threads that will be used.
	 * @returns The security increase.
	 */
	hackAnalyzeSecurity(threads: number): number {
		return this.ns.hackAnalyzeSecurity(threads, this.hostname);
	}

	/**
	 * This function returns the decimal number of script threads you need when running the hack command
	 * to steal the specified amount of money from the target server.
	 * If hackAmount is less than zero, greater than the amount of money available on the server,
	 * or your hacking level is below the required level for the target server,
	 * then this function returns -1.
	 *
	 * @example```js
	 * // Calculate the thread count of a single hack that would take $100k from n00dles
	 * const hackThreads = ns.hackAnalyzeThreads("n00dles", 1e5);
	 *
	 * // Launching a script requires an integer thread count. The below would take less than the targeted $100k.
	 * ns.run("noodleHack.js", Math.floor(hackThreads));
	 * ```
	 * @remarks RAM cost: 1 GB
	 * @param hackAmount - Amount of money you want to hack from the server.
	 * @returns The number of threads needed to hack the server for hackAmount money.
	 */
	hackAnalyzeThreads(hackAmount: number = this.maxMoney): number {
		return this.ns.hackAnalyzeThreads(this.hostname, hackAmount);
	}

	/**
	 * Returns the security decrease that would occur if a weaken with this many threads happened.
	 *
	 * <strong>No Formula equivalent.</strong>
	 *
	 * @remarks RAM cost: 1 GB
	 *
	 * @param threads Amount of threads that will be used.
	 * @param cores The number of cores of the server that would run weaken.
	 * @returns The security decrease.
	 */
	weakenAnalyze(threads: number, cores?: number): number {
		return this.ns.weakenAnalyze(threads, cores);
	}

	/**
	 * Returns the number of open ports required to successfully run NUKE.exe on the server.
	 *
	 * @remarks RAM cost: 0.1 GB
	 *
	 * @returns The number of open ports required to successfully run NUKE.exe on the server.
	 */
	get numPortsRequired(): number {
		return this.ns.getServerNumPortsRequired(this.hostname);
	}

	/**
	 * Gets the number of port-opening programs the player currently owns.
	 *
	 * This is determined by checking the presence of the following programs:
	 * - BruteSSH.exe
	 * - FTPCrack.exe
	 * - relaySMTP.exe
	 * - HTTPWorm.exe
	 * - SQLInject.exe
	 *
	 * @returns The count of available port-opening programs (0 to 5).
	 */
	get numProgramsOwned(): number {
		let scriptCount = 0;

		if (this.hasBruteSsh()) scriptCount++;
		if (this.hasFtpCrack()) scriptCount++;
		if (this.hasRelaySmtp()) scriptCount++;
		if (this.hasHttpWorm()) scriptCount++;
		if (this.hasSqlInject()) scriptCount++;

		return scriptCount;
	}

	/**
	 * Run a script as a separate process on a specified server. This is similar to the function {@link NS.run run}
	 * except that it can be used to run a script that already exists on any server, instead of just the current server.
	 *
	 * If the script was successfully started, then this function returns the PID of that script.
	 * Otherwise, it returns 0.
	 *
	 * PID stands for Process ID. The PID is a unique identifier for each script.
	 * The PID will always be a positive integer.
	 *
	 * Running this function with 0 or fewer threads will cause a runtime error.
	 *
	 * @example```js
	 * // The simplest way to use the exec command is to call it with just the script name
	 * // and the target server. The following example will try to run generic-hack.js
	 * // on the foodnstuff server.
	 * ns.exec("generic-hack.js", "foodnstuff");
	 *
	 * // The following example will try to run the script generic-hack.js on the
	 * // joesguns server with 10 threads.
	 * ns.exec("generic-hack.js", "joesguns", {threads: 10});
	 *
	 * // This last example will try to run the script foo.js on the foodnstuff server
	 * // with 5 threads. It will also pass the number 1 and the string “test” in as
	 * // arguments to the script.
	 * ns.exec("foo.js", "foodnstuff", 5, 1, "test");
	 * ```
	 * @remarks RAM cost: 1.3 GB
	 *
	 * @param script - Filename of script to execute. This script must already exist on the target server.
	 * @param threadOrOptions - Either an integer number of threads for new script, or a {@link RunOptions} object.
	 *   Threads defaults to 1.
	 * @param args - Additional arguments to pass into the new script that is being run. Note that if any arguments are
	 *   being passed into the new script, then the third argument threadOrOptions must be filled in with a value.
	 * @returns Returns the PID of a successfully started script, and 0 otherwise.
	 */
	exec(script: string, threadOrOptions?: number | RunOptions, ...args: ScriptArg[]): number {
		return this.ns.exec(script, this.hostname, threadOrOptions, ...args);
	}

	/**
	 * Kills all running scripts on the server.
	 *
	 * This function returns true if any scripts were killed, and false otherwise.
	 * In other words, it will return true if there are any scripts running on the target server.
	 *
	 * @remarks RAM cost: 0.5 GB
	 *
	 * @param safetyGuard Skips the script that calls this function
	 * @returns True if any hacking were killed, and false otherwise.
	 */
	killAll(safetyGuard?: boolean): boolean {
		return this.ns.killall(this.hostname, safetyGuard);
	}

	/**
	 * Kill all scripts with a filename.
	 * @remarks
	 * RAM cost: 1 GB
	 *
	 * Kills all scripts with the specified filename on the target server specified by hostname,
	 * regardless of arguments.
	 *
	 * @param script - Filename of script to kill. This is case-sensitive.
	 * @returns True if one or more scripts were successfully killed, and false if none were.
	 */
	killScript(script: string): boolean {
		return this.ns.scriptKill(script, this.hostname);
	}

	/**
	 * Returns a Server object for the NSServer.
	 *
	 * @remarks RAM cost: 2 GB
	 *
	 * @returns The requested server object.
	 */
	getRawServer(): Server {
		return this.ns.getServer(this.hostname);
	}

	delete(): boolean {
		return this.ns.deleteServer(this.hostname);
	}

	freeRam(): number {
		return this.maxRam - this.usedRam;
	}
}

interface NSServerFiles {
	loggers: NSServerFile;
	formatters: NSServerFile;
	parsers: NSServerFile;
	printers: NSServerFile;

	hack: NSServerFile;
	grow: NSServerFile;
	weaken: NSServerFile;
	earlyHack: NSServerFile;
	prepareServer: NSServerFile;
}

class NSServerFile {
	readonly hostname: string;

	constructor(
		private readonly ns: NS,
		private readonly server: NSServer,
		public readonly scriptName: string,
		private readonly dependencies: NSServerFile[] = [],
	) {
		this.hostname = server.hostname;
	}

	/**
	 * Copy script between servers.
	 * @remarks
	 * RAM cost: 0.6 GB
	 *
	 * Copies a script or literature (.lit) script(s) to another server. The files argument can be either a string
	 * specifying a single script to copy, or an array of strings specifying multiple files to copy.
	 *
	 * @example
	 * ```js
	 * //Copies foo.lit from the helios server to the home computer:
	 * ns.scp("foo.lit", "home", "helios" );
	 *
	 * //Tries to copy three files from rothman-uni to home computer:
	 * const files = ["foo1.lit", "foo2.txt", "foo3.js"];
	 * ns.scp(files, "home", "rothman-uni");
	 * ```
	 * @example
	 * ```js
	 * const server = ns.args[0];
	 * const files = ["hack.js", "weaken.js", "grow.js"];
	 * ns.scp(files, server, "home");
	 * ```
	 * @returns True if the script is successfully copied over and false otherwise. If the files argument is an array then
	 *   this function will return false if any of the operations failed.
	 */
	pull(): boolean {
		for (const dependency of this.dependencies) {
			dependency.pull();
		}

		return this.ns.scp(this.scriptName, this.server.hostname, "home");
	}

	/**
	 * Get the ram cost of a script.
	 * @remarks
	 * RAM cost: 0.1 GB
	 *
	 * Returns the amount of RAM required to run the specified script on the target server.
	 * Returns 0 if the script does not exist.
	 *
	 * @returns Amount of RAM (in GB) required to run the specified script on the target server, and 0 if the script does
	 *   not exist.
	 */
	ram(): number {
		return this.ns.getScriptRam(this.scriptName, this.server.hostname);
	}

	/**
	 * Kill all scripts with a filename.
	 * @remarks
	 * RAM cost: 1 GB
	 *
	 * Kills all scripts with the specified filename on the target server specified by hostname,
	 * regardless of arguments.
	 *
	 * @returns True if one or more scripts were successfully killed, and false if none were.
	 */
	killAll(): boolean {
		return this.ns.scriptKill(this.scriptName, this.server.hostname);
	}

	isRunning(args?: ScriptArg[]): boolean {
		this.ns.tprintf("isRunning(): args<%j>", args);
		if (isdef(args)) {
			return this.ns.isRunning(this.scriptName, this.server.hostname, ...args);
		} else {
			return this.ns.scriptRunning(this.scriptName, this.server.hostname);
		}
	}

	/**
	 * Start another script on any server.
	 *
	 * @remarks
	 * RAM cost: 1.3 GB
	 *
	 * Run a script as a separate process on a specified server. This is similar to the function {@link NS.run | run}
	 * except that it can be used to run a script that already exists on any server, instead of just the current server.
	 *
	 * If the script was successfully started, then this function returns the PID of that script.
	 * Otherwise, it returns 0.
	 *
	 * PID stands for Process ID. The PID is a unique identifier for each script.
	 * The PID will always be a positive integer.
	 *
	 * Running this function with 0 or fewer threads will cause a runtime error.
	 *
	 * @example
	 * ```js
	 * // The simplest way to use the exec command is to call it with just the script name
	 * // and the target server. The following example will try to run generic-hack.js
	 * // on the foodnstuff server.
	 * ns.exec("generic-hack.js", "foodnstuff");
	 *
	 * // The following example will try to run the script generic-hack.js on the
	 * // joesguns server with 10 threads.
	 * ns.exec("generic-hack.js", "joesguns", {threads: 10});
	 *
	 * // This last example will try to run the script foo.js on the foodnstuff server
	 * // with 5 threads. It will also pass the number 1 and the string “test” in as
	 * // arguments to the script.
	 * ns.exec("foo.js", "foodnstuff", 5, 1, "test");
	 * ```
	 * @param script - Filename of script to execute. This file must already exist on the target server.
	 * @param hostname - Hostname of the `target server` on which to execute the script.
	 * @param threadOrOptions - Either an integer number of threads for new script, or a {@link RunOptions} object.
	 *   Threads defaults to 1.
	 * @param args - Additional arguments to pass into the new script that is being run. Note that if any arguments are
	 *   being passed into the new script, then the third argument threadOrOptions must be filled in with a value.
	 * @returns Returns the PID of a successfully started script, and 0 otherwise.
	 */
	exec(threadOrOptions?: number | RunOptions, ...args: ScriptArg[]): number {
		return this.ns.exec(this.scriptName, this.hostname, threadOrOptions, ...args);
	}
}

class NSServerFormulas {
	constructor(
		private readonly ns: NS,
		public readonly server: NSServer
	) {}

	hackChance(mockMoney?: number, mockSecurity?: number): number {
		const mockServer = this.server.getRawServer();

		mockServer.moneyAvailable = isdef(mockMoney) ? mockMoney : this.server.maxMoney;
		mockServer.hackDifficulty = isdef(mockSecurity) ? mockSecurity : this.server.minSecurity;

		return this.ns.formulas.hacking.hackChance(mockServer, this.ns.getPlayer());
	}

	/**
	 * Calculate hack percent for one thread.
	 * (Ex: 0.25 would steal 25% of the server's current value.)<br />
	 * Multiply by thread to get total percent hacked.
	 *
	 * @remarks Requires <code>Formulas.exe</code>.
	 *
	 * @returns The calculated hack percent.
	 */
	hackPercent(moneyAvailable?: number, securityLevel?: number): number {
		const mockServer = this.server.getRawServer();

		mockServer.moneyAvailable = isdef(moneyAvailable) ? moneyAvailable : mockServer.moneyMax;
		mockServer.hackDifficulty = isdef(securityLevel) ? securityLevel : mockServer.minDifficulty;

		return this.ns.formulas.hacking.hackPercent(mockServer, this.ns.getPlayer());
	}

	hackTime(securityLevel?: number): number {
		const mockServer = this.server.getRawServer();
		const mockPlayer = this.ns.getPlayer();

		mockServer.hackDifficulty = isset(securityLevel) ? securityLevel : mockServer.minDifficulty;

		return this.ns.formulas.hacking.hackTime(mockServer, mockPlayer);
	}

	/**
	 * Calculate how many threads it will take to grow server to targetMoney. Starting money is server.fromMoney.
	 * Note that when simulating the effect of {@link NS.grow | grow}, what matters is the state of the server and
	 * player when the grow *finishes*, not when it is started.
	 *
	 * The growth amount depends both linearly *and* exponentially on threads; see {@link NS.grow | grow} for more
	 * details.
	 *
	 * The inverse of this function is {@link HackingFormulas.growAmount | formulas.hacking.growAmount},
	 * although it can work with fractional threads.
	 *
	 * @param fromMoney
	 * @param toMoney - Desired final money, capped to server's moneyMax
	 * @param securityLevel
	 * @param cores - Number of cores on the computer that will execute grow.
	 * @returns The calculated grow threads as an integer, rounded up.
	 */
	growThreads(
		fromMoney: number,
		toMoney: number,
		cores?: number
	): number {
		const mockServer = this.server.getRawServer();
		const mockPlayer = this.ns.getPlayer();

		mockServer.moneyAvailable = fromMoney;
		// mockServer.hackDifficulty = ifset(securityLevel, mockServer.minDifficulty);

		return this.ns.formulas.hacking.growThreads(mockServer, mockPlayer, toMoney, cores);
	}

	/**
	 * Calculate the growth multiplier constant for a given server and threads.
	 *
	 * The actual amount of money grown depends both linearly *and* exponentially on threads;
	 * this is only giving the exponential part that is used for the multiplier.
	 * See {@link NS.grow grow()} for more details.
	 *
	 * As a result of the above, this multiplier does *not* depend on the amount of money on the server.
	 * Changing server.moneyAvailable and server.moneyMax will have no effect.
	 *
	 * For the most common use-cases, you probably want
	 * either {@link HackingFormulas.growThreads formulas.hacking.growThreads()}
	 * or {@link HackingFormulas.growAmount formulas.hacking.growAmount()} instead.
	 *
	 * @param threads - Amount of threads. Can be fractional.
	 * @param fromMoney
	 * @param cores - Number of cores on the computer that will execute grow.
	 * @returns The calculated grow percent.
	 */
	growPercent(threads: number, fromMoney: number, cores?: number): number {
		const mockServer = this.server.getRawServer();
		const mockPlayer = this.ns.getPlayer();

		mockServer.moneyAvailable = fromMoney;
		mockServer.hackDifficulty = mockServer.minDifficulty;

		return this.ns.formulas.hacking.growPercent(mockServer, threads, mockPlayer, cores);
	}

	/**
	 * Calculate the amount of money a grow action will leave a server with. Starting money is server.moneyAvailable.
	 * Note that when simulating the effect of {@link NS.grow | grow}, what matters is the state of the server and
	 * player when the grow *finishes*, not when it is started.
	 *
	 * The growth amount depends both linearly *and* exponentially on threads; see {@link NS.grow | grow} for more
	 * details.
	 *
	 * The inverse of this function is {@link HackingFormulas.growThreads | formulas.hacking.growThreads},
	 * although it rounds up to integer threads.
	 * @param threads Number of threads to grow with. Can be fractional.
	 * @param fromMoney
	 * @param cores Number of cores on the computer that will execute grow.
	 * @returns The amount of money after the calculated grow.
	 */
	growAmount(fromMoney: number, threads: number, cores?: number): number {
		const mockServer = this.server.getRawServer();
		const mockPlayer = this.ns.getPlayer();

		mockServer.moneyAvailable = fromMoney;
		mockServer.hackDifficulty = mockServer.minDifficulty;

		return this.ns.formulas.hacking.growAmount(mockServer, mockPlayer, threads, cores);
	}

	growTime(securityLevel?: number): number {
		const mockServer = this.server.getRawServer();
		const mockPlayer = this.ns.getPlayer();

		mockServer.hackDifficulty = ifset(securityLevel, mockServer.minDifficulty);

		return this.ns.formulas.hacking.growTime(mockServer, mockPlayer);
	}

	weakenTime(securityLevel?: number): number {
		const mockServer = this.server.getRawServer();
		const mockPlayer = this.ns.getPlayer();

		mockServer.hackDifficulty = ifset(securityLevel, mockServer.minDifficulty);

		return this.ns.formulas.hacking.weakenTime(mockServer, mockPlayer);
	}
}
