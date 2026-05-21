import NSServer from "/ns-wrappers/ns-server";
import PrepareServerUI from "/react/quick-prepare/PrepareServerUI";
import { fint, fnum, ftime } from "/utils/formatters";
import { ScriptsMain } from "/utils/lists/scripts";
import { parseArgs } from "/utils/parsers";
import { logError } from "/utils/printers";
import { AutocompleteData, NS } from "@ns";

class PrepareServerFlags {
  setup = false;
  hack = 0.001;
  runner = "home";
  bought = false;
}

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");

  try {
    const {
      _: args,
      hack,
      setup: shouldSetup,
      runner: runnerHost
    } = parseArgs<PrepareServerFlags, string[]>(ns, PrepareServerFlags);

    const [targetHost] = args;

    // Servers
    const runner = new NSServer(ns, runnerHost);
    const target = new NSServer(ns, targetHost);

    // Copying Files
    runner.files.grow.pull();
    runner.files.weaken.pull();

    ns.ui.setTailTitle(`[🛠️Prepare] [${runnerHost} -> ${targetHost}]`);
    ns.ui.openTail();

    // Target Info
    const maxMoney = target.maxMoney;
    const minSecurity = target.minSecurity;

    while (true) {
      const securityLevel = target.securityLevel();
      const moneyAvailable = target.moneyAvailable();

      // Server State UI
      ns.printRaw(
        <PrepareServerUI
          securityLevel={securityLevel}
          minSecurity={minSecurity}
          moneyAvailable={moneyAvailable}
          maxMoney={maxMoney}
        />
      );

      if (securityLevel > minSecurity) {
        await execWeaken(ns, runner, target);
      } else if (moneyAvailable < maxMoney) {
        await execGrow(ns, runner, target);
      } else {
        ns.printf("SUCCESS [✅️🛠️%s] READY!", targetHost);

        if (shouldSetup) {
          const hackParam = [
            "--hack", hack
          ];
          ns.spawn(ScriptsMain.BATCH_SETUP, 1, runnerHost, targetHost, ...hackParam);
        } else {
          break;
        }
      }

      await ns.asleep(2000);
    }

  } catch (e) {
    logError(ns, e);
  }
}

async function execWeaken(ns: NS, runner: NSServer, target: NSServer): Promise<void> {
  let freeRam: number = runner.freeRam();
  if (runner.isHome) freeRam = Math.min(freeRam, runner.maxRam * .9);

  const securityLevel = target.securityLevel();
  const securityMin = target.minSecurity;

  const securityDiff = securityLevel - securityMin;
  const weakenSecuritySingle = target.weakenAnalyze(1);
  const weakenTime = target.weakenTime();

  const weakenRam = runner.files.weaken.ram();
  const weakenThreadsFull = Math.ceil(securityDiff / weakenSecuritySingle);
  const weakenThreadsAvailable = Math.floor(freeRam / weakenRam);
  const weakenThreads = Math.min(weakenThreadsAvailable, weakenThreadsFull);

  const weakenSecurity = weakenThreads * weakenSecuritySingle;
  const weakenSecurityFull = weakenThreadsFull * weakenSecuritySingle;
  const securityAfterWeaken = Math.max(securityLevel - weakenSecurity, securityMin);

  ns.printf(
    "INFO 👨🏻‍💻🔒 weaken()ing | [🧵%s(%s) 🔒%s(%s)🔻] 🔼🔒%s -> 🔒%s (%s) | ⌛ %s",
    fint(weakenThreads),
    fint(weakenThreadsFull),
    fnum(weakenSecurity),
    fnum(weakenSecurityFull),
    fnum(securityLevel),
    fnum(securityAfterWeaken),
    fnum(securityMin),
    ftime(weakenTime)
  );

  const targetHost = target.hostname;
  const pid = runner.files.weaken.exec(weakenThreads, targetHost);
  if (pid === 0) throw new Error("Error executing weaken.ts");

  await ns.asleep(weakenTime);
  ns.printf("INFO [%s] 🔒🛠️WEAKENED!", targetHost);
}

async function execGrow(ns: NS, runner: NSServer, target: NSServer): Promise<void> {
  let freeRam: number = runner.freeRam();
  if (runner.isHome) freeRam = Math.min(freeRam, runner.maxRam * .9);

  const maxMoney = target.maxMoney;
  const moneyAvailable = target.moneyAvailable();
  const cores = runner.cpuCores;

  const growThreadsFull = Math.ceil(target.formulas.growThreads(moneyAvailable, maxMoney, cores));
  // const growMultiplier = maxMoney / moneyAvailable;
  // ns.formulas.hacking.growThreads()
  // const growThreadsFull = Math.ceil(target.growthAnalyze(growMultiplier));
  const growRam = runner.files.grow.ram();
  const growThreadsAvailable = Math.floor(freeRam / growRam);
  const growThreads = Math.min(growThreadsAvailable, growThreadsFull);
  const growSec = target.growSecurityIncrease(growThreads);
  const growTime = target.growTime();
  const secAfterGrow = target.minSecurity + growSec;

  const moneyAfterGrow = target.formulas.growAmount(moneyAvailable, growThreads, cores);

  ns.printf(
    "INFO 👨🏻‍💻💹 grow()ing 🧵%s(%s) | 💲%s -> 💲%s | ⌛ %s",
    fint(growThreads),
    fint(growThreadsFull),
    fnum(moneyAvailable),
    fnum(moneyAfterGrow),
    ftime(growTime)
  );

  const targetHost = target.hostname;
  const pid = runner.files.grow.exec(growThreads, targetHost);
  if (pid === 0) throw new Error("Error executing grow.ts");

  await ns.asleep(growTime);
  ns.printf("INFO [%s] 💹🛠️GROWN!", targetHost);
}

export function autocomplete(data: AutocompleteData, args: string[]): string[] {
  const commands = data.command.split(" ");
  const lastCommand = commands[commands.length - 1];
  const isCompletingFlag = lastCommand.startsWith("-") || lastCommand.startsWith("--");

  if (isCompletingFlag) {
    const flags = Object.keys(new PrepareServerFlags());
    return flags.map(f => "--" + f);
  } else {
    return data.servers.filter(s => !args.includes(s));
  }
}
