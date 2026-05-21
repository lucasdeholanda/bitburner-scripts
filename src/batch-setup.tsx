import NSServer from "/ns-wrappers/ns-server";
import { fram, ftime } from "/utils/formatters";
import { parseArgs } from "/utils/parsers";
import { logError } from "/utils/printers";
import { AutocompleteData, NS } from "@ns";

class BatchSetupFlags {
  hack = .001;
  delay = 100;
  debug = false;
}

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");

  try {
    const {
      _: args,
      hack: hackGoal,
      delay,
      debug: isDebug
    } = parseArgs<BatchSetupFlags, string[]>(ns, BatchSetupFlags);

    // Validation
    validateArgs(args);

    let runnerHost: string;
    let targetHost: string;

    // Run in "home" unless otherwise specified
    if (args.length === 1) {
      runnerHost = "home";
      targetHost = args[0];
    } else {
      [runnerHost, targetHost] = args;
    }

    const home = new NSServer(ns);
    const runner = new NSServer(ns, runnerHost);
    const target = new NSServer(ns, targetHost);

    /* **************
     **** Target ****
     ****************/
    const maxMoney = target.maxMoney;
    const moneyAvailable = target.moneyAvailable();

    /* **************
     **** Runner ****
     ****************/
    const cores = runner.cpuCores;

    /* ************
     **** Hack ****
     **************/
    const hackPercentSingle = target.formulas.hackPercent();
    const hackThreads = Math.ceil(hackGoal / hackPercentSingle);
    const hackMoney = maxMoney * hackPercentSingle * hackThreads;
    const hackSecurity = target.hackAnalyzeSecurity(hackThreads);
    const hackTime = target.formulas.hackTime();
    const moneyAfterHack = maxMoney - hackMoney;

    /* ********************
     **** Weaken 1 & 2 ****
     **********************/
    const weakenSecuritySingle = target.weakenAnalyze(1, cores);

    /* ****************
     **** Weaken 1 ****
     ******************/
    const weaken1Threads = Math.ceil(hackSecurity / weakenSecuritySingle);
    const weaken1Time = target.formulas.weakenTime();

    /* ************
     **** Grow ****
     **************/
    const growThreads = target.formulas.growThreads(moneyAfterHack, maxMoney, cores);
    const moneyAfterGrow = target.formulas.growAmount(moneyAvailable, growThreads, cores);
    const growSecurity = target.growSecurityIncrease(growThreads);
    const growTime = target.formulas.growTime();

    /* ****************
     **** Weaken 2 ****
     ******************/
    const weaken2Threads = Math.ceil(growSecurity / weakenSecuritySingle);
    const weaken2Time = target.formulas.weakenTime();

    // Time Diffs
    const longestTime = Math.max(hackTime, weaken1Time, growTime, weaken2Time);
    const hackTimeDiff = longestTime - hackTime;
    const weaken1TimeDiff = longestTime - weaken1Time;
    const growTimeDiff = longestTime - growTime;
    const weaken2TimeDiff = longestTime - weaken2Time;

    // Scripts RAM
    const hackRam = home.files.hack.ram();
    const weakenRam = home.files.weaken.ram();
    const growRam = home.files.grow.ram();

    const hackRamThreaded = hackRam * hackThreads;
    const weaken1RamThreaded = weakenRam * weaken1Threads;
    const growRamThreaded = growRam * growThreads;
    const weaken2RamThreaded = weakenRam * weaken2Threads;

    const batchRam = hackRamThreaded + weaken1RamThreaded + growRamThreaded + weaken2RamThreaded;

    runner.files.hack.pull();
    runner.files.grow.pull();
    runner.files.weaken.pull();

    /* ******************
     **** Batch Loop ****
     ********************/
    ns.ui.setTailTitle(`[📦 Batch] [${runnerHost} -> ${targetHost}]`);
    ns.ui.openTail();

    const maxBatches = Infinity;
    const ramCheckInterval = 1_000;
    for (let i = 0; i < maxBatches; i++) {
      let freeRam: number = runner.freeRam();
      if (runner.isHome) freeRam = Math.min(freeRam, runner.maxRam * .9);

      if (freeRam < batchRam) {
        ns.printf("Not enough RAM, waiting until %s is free.", fram(batchRam, 2));

        let notEnoughRamWait = 0;
        while (runner.freeRam() < batchRam) {
          notEnoughRamWait += ramCheckInterval;
          await ns.asleep(ramCheckInterval);
        }

        ns.printf("Waited %s", ftime(notEnoughRamWait));
      }

      const hackDelay = hackTimeDiff;
      const weaken1Delay = weaken1TimeDiff + delay;
      const growDelay = growTimeDiff + delay * 2;
      const weaken2Delay = weaken2TimeDiff + delay * 3;
      const batchDelay = delay * 4;

      execHack(ns, runner, hackThreads, targetHost, hackDelay, isDebug);
      execWeaken1(ns, runner, weaken1Threads, targetHost, weaken1Delay, isDebug);
      execGrow(ns, runner, growThreads, targetHost, growDelay, isDebug);
      execWeaken2(ns, runner, weaken2Threads, targetHost, weaken2Delay, isDebug);

      // Batch Padding
      await ns.asleep(batchDelay);
    }
  } catch (e) {
    logError(ns, e);
  }
}

function validateArgs(args: string[]): void {
  const [targetHost] = args;
  if (!targetHost) throw new Error("Missing 'targetHost' argument (args[0]).");
}

function execHack(
  ns: NS,
  runner: NSServer,
  threads: number,
  targetHost: string,
  delay: number,
  isDebug: boolean
): void {
  const args = [
    targetHost,
    "--delay", delay,
    // "--debug", isDebug
  ];

  const pid = runner.files.hack.exec(threads, ...args);
  // const pid = ns.exec(ScriptsHelper.HACK, runnerHost, threads, ...hackArgs);
  if (pid === 0) throw new Error("Error executing Hack");
}

function execWeaken1(
  ns: NS,
  runner: NSServer,
  threads: number,
  targetHost: string,
  delay: number,
  isDebug: boolean
): void {
  const args = [
    targetHost,
    "--delay", delay,
    // "--debug", isDebug
  ];

  const pid = runner.files.weaken.exec(threads, ...args);
  if (pid === 0) throw new Error("Error executing Weaken #1");
}

function execGrow(
  ns: NS,
  runner: NSServer,
  threads: number,
  targetHost: string,
  delay: number,
  isDebug: boolean
): void {
  const args = [
    targetHost,
    "--delay", delay,
    // "--debug", isDebug
  ];

  const pid = runner.files.grow.exec(threads, ...args);
  if (pid === 0) throw new Error("Error executing Grow");
}

function execWeaken2(
  ns: NS,
  runner: NSServer,
  threads: number,
  targetHost: string,
  delay: number,
  isDebug: boolean
): void {
  const args = [
    targetHost,
    "--delay", delay,
    // "--debug", isDebug
  ];

  const pid = runner.files.weaken.exec(threads, ...args);
  if (pid === 0) throw new Error("Error executing Weaken #2");
}

export function autocomplete(data: AutocompleteData, args: string[]): string[] {
  const commands = data.command.split(" ");
  const lastCommand = commands[commands.length - 1];
  const isCompletingFlag = lastCommand.startsWith("-") || lastCommand.startsWith("--");

  if (isCompletingFlag) {
    const flags = Object.keys(new BatchSetupFlags());
    return flags.map(f => "--" + f);
  } else {
    return data.servers.filter(s => !args.includes(s));
  }
}
