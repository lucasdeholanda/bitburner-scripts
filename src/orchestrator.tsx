import NSServer from "/ns-wrappers/ns-server";
import { OrchestratorUI, OrchestratorUIProps } from "/react/orchestrator/OrchestratorUI";
import { fnum } from "/utils/formatters";
import { scanHome } from "/utils/scanners";
import { ScriptsHelper } from "/utils/lists/scripts";
import { AutocompleteData, NS } from "@ns";
import { parseArgs } from "./utils/parsers";
import { printError } from "./utils/printers";

export function autocomplete(data: AutocompleteData, args: string[]): string[] {
  return data.servers.filter(s => !args.includes(s));
}

class OrchestratorFlags {
  run = false;
}

export async function main(ns: NS): Promise<void> {
  try {
    const {
      _: args,
      run: shouldRun
    } = parseArgs<OrchestratorFlags, string[]>(ns, OrchestratorFlags);

    validateArgs(ns, args);

    const [targetHost] = args;

    const home = new NSServer(ns);
    const target = new NSServer(ns, targetHost);

    if (!home.hasFormulas()) throw new Error ("No Formulas.exe");

    const runnerHosts = scanHome(ns);
    const numPortProgramsOwned = home.numProgramsOwned;
    const targetNumPortsRequired = target.numPortsRequired;

    // [Target] Server Ports
    if (targetNumPortsRequired > numPortProgramsOwned) {
      throw new Error(
        `ERROR: You don't have enough programs (${numPortProgramsOwned}) for this server (${targetNumPortsRequired}).`
      );
    }

    // Runner Servers Loop
    for (const runnerHost of runnerHosts) {
      const runner = new NSServer(ns, runnerHost);

      // [Runner] Server Ports
      // Not Enough Programs (except Purchased)
      if (!runner.isPurchased && runner.numPortsRequired > numPortProgramsOwned) continue;

      // Opening Doors and Nuking
      if (home.hasBruteSsh()) runner.bruteSsh();
      if (home.hasFtpCrack()) runner.ftpCrack();
      if (home.hasRelaySmtp()) runner.relaySMTP();
      if (home.hasHttpWorm()) runner.httpWorm();
      if (home.hasSqlInject()) runner.sqlInject();
      runner.nuke();

      // RAM Counting
      const maxRamRunner = runner.maxRam;
      const freeRamRunner = maxRamRunner - runner.usedRam;

      // Max 90% ram for home, 100% everything else
      let availableRamRunner;
      if (runnerHost === "home") {
        availableRamRunner = maxRamRunner * 0.9;

        if (availableRamRunner < freeRamRunner) {
          availableRamRunner = 0;
        }
      } else {
        availableRamRunner = freeRamRunner;
      }

      // 0 Free RAM
      if (availableRamRunner <= 0) {
        // ns.tprintf("ERROR: [%s] Not enough free ram [%s].", runnerHost, fram(availableRamRunner));
        continue;
      }

      const earlyHackScript = ScriptsHelper.EARLY_HACK;
      const earlyHackScriptRam = ns.getScriptRam(earlyHackScript, "home");
      const threads = Math.floor(availableRamRunner / earlyHackScriptRam);

      // 0 Threads
      if (threads <= 0) {
        // ns.tprintf("ERROR: [%s] [%s] threads.", runnerHost, fnum(threads));
        continue;
      }

      // Copying & Running
      const hackScript = ScriptsHelper.HACK;
      const growScript = ScriptsHelper.GROW;
      const weakenScript = ScriptsHelper.WEAKEN;

      // TODO: Use server
      const hackRam = ns.getScriptRam(hackScript);
      const growRam = ns.getScriptRam(growScript);
      const weakenRam = ns.getScriptRam(weakenScript);

      // Future amount of Times to run the 4-thread setup in a Row
      const batchMax = 1;
      for (let i = 0; i < batchMax; i++) {
        const targetHackPercent = .5;

        const moneyMax = target.maxMoney;
        const securityMin = target.minSecurity;

        // hack()
        const hackPercent = target.formulas.hackPercent();
        const hackThreads = Math.ceil(targetHackPercent / hackPercent);
        const hackMoney = moneyMax * hackPercent * hackThreads;
        const hackSec = ns.hackAnalyzeSecurity(hackThreads);
        const hackTime = target.formulas.hackTime();
        const moneyAfterHack = moneyMax - hackMoney;
        const secAfterHack = securityMin + hackSec;

        // weak() 1
        const weakenSecSingle = target.weakenAnalyze(1);
        const weaken1Threads = Math.ceil(hackSec / weakenSecSingle);
        const weaken1Sec = weakenSecSingle * weaken1Threads;
        const weaken1Time = target.formulas.weakenTime(secAfterHack);

        // grow()
        const growThreads = target.formulas.growThreads(moneyAfterHack, moneyMax);
        const growMoney = target.formulas.growAmount(moneyAfterHack, growThreads);
        const growSec = target.growSecurityIncrease(growThreads);
        const growTime = target.formulas.growTime();
        const secAfterGrow = securityMin + growSec;

        // weak() 2
        const weaken2Threads = Math.ceil(growSec / weakenSecSingle);
        const weaken2Sec = weakenSecSingle * weaken2Threads;
        const weaken2Time = target.formulas.weakenTime(secAfterGrow);

        const longestTime = Math.max(hackTime, weaken1Time, growTime, weaken2Time);

        const hackTimeDiff = longestTime - hackTime;
        const weak1TimeDiff = longestTime - weaken1Time;
        const growTimeDiff = longestTime - growTime;
        const weak2TimeDiff = longestTime - weaken2Time;

        const paddingMs = 500;

        const props: OrchestratorUIProps = {
          hackRam,
          growRam,
          weakenRam,

          hackTime,
          weaken1Time,
          growTime,
          weaken2Time,
          longestTime,

          hackTimeDiff: hackTimeDiff,
          weaken1TimeDiff: weak1TimeDiff,
          growTimeDiff: growTimeDiff,
          weaken2TimeDiff: weak2TimeDiff,

          hackTimeTotal: hackTimeDiff + hackTime,
          weaken1TimeTotal: weak1TimeDiff + weaken1Time,
          growTimeTotal: growTimeDiff + growTime,
          weaken2TimeTotal: weak2TimeDiff + weaken2Time,

          paddingMs
        };

        ns.tprintRaw(<OrchestratorUI {...props} />);

        if (!shouldRun) continue;

        // Copying & Running
        runner.files.loggers.pull();
        runner.files.formatters.pull();

        // Copying Files
        home.copyFileTo(hackScript, runner);
        home.copyFileTo(growScript, runner);
        home.copyFileTo(weakenScript, runner);

        const wereScriptsKilled = runner.killScript(hackScript);
        if (wereScriptsKilled) ns.tprintf("INFO: Hack Scripts Killed in [%s]", runnerHost);

        // TODO: Duplicated Batch Runner
        for (let j = 0; j < 3; j++) {
          // Loop Padding
          await ns.sleep(paddingMs * j);

          const pid = runner.exec(hackScript, 1, targetHost, "--debug");
          if (pid === 0) ns.tprintf("ERROR: Couldn't run 'hack.ts'[%s] in %s", j, runnerHost);

          runner.exec(hackScript, threads, targetHost, "--debug");
          ns.sleep(paddingMs);
          runner.exec(growScript, threads, targetHost, "--debug");
          runner.exec(weakenScript, threads, targetHost, "--debug");
        }

        await ns.sleep(paddingMs * i);
      }
    }
  } catch (e) {
    printError(ns, e);
  }
}

function validateArgs(ns: NS, args: string[]): void {
  const [targetHost] = args;
  if (!targetHost) return ns.tprintf("ERROR: Missing 'targetHost' argument (args[0]).");
}