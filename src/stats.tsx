// noinspection InfiniteLoopJS

import NSServer from "/ns-wrappers/ns-server";
import { StatsUI } from "/react/stats/StatsUI";
import { StatusUIAction } from "/react/stats/StatusUIAction";
import "/utils/formatters";
import { parseArgs } from "/utils/parsers";
import { scanHome } from "/utils/scanners";
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

  const hasArgs = args.length > 0;

  // Deciding which servers to get stats
  let hosts: string[];
  if (onlyBought) {
    hosts = ns.getPurchasedServers();
  } else {
    if (hasArgs) {
      hosts = args;
    } else {
      hosts = scanHome(ns).filter(server => !ns.getServer(server).purchasedByPlayer);
    }
  }

  const home = new NSServer(ns, "home");

  const hackRam = home.files.hack.ram();
  const weakenRam = home.files.weaken.ram();
  const growRam = home.files.grow.ram();

  let sortedServers = hosts
    .map(h => {
      const server = new NSServer(ns, h);

      // Opening Doors and Nuking
      if (home.hasBruteSsh()) server.bruteSsh();
      if (home.hasFtpCrack()) server.ftpCrack();
      if (home.hasRelaySmtp()) server.relaySMTP();
      if (home.hasHttpWorm()) server.httpWorm();
      if (home.hasSqlInject()) server.sqlInject();

      if (home.numProgramsOwned >= server.numPortsRequired) {
        server.nuke();

        if (installBackdoor) {
          ns.singularity.connect(server.hostname);
          ns.singularity.installBackdoor();
        }
      }

      ns.singularity.connect("home");

      return server;
    })
    .filter(s => home.numProgramsOwned >= s.numPortsRequired);

  if (showAll) {
    sortedServers = sortedServers
      .filter(s =>
        s.requiredHackingLevel <= ns.getPlayer().skills.hacking
        && s.maxRam > 0
      )
      .sort((s1, s2) => s2.maxRam - s1.maxRam);
  } else {
    sortedServers = sortedServers
      .filter(s =>
        s.requiredHackingLevel <= ns.getPlayer().skills.hacking / 2
        && s.maxMoney > 0
      )
      .sort((s1, s2) => s2.maxMoney - s1.maxMoney);
  }

  ns.ui.openTail();

  for (const server of sortedServers.reverse()) {
    printServerInfo(server);
  }

  /* ***************
   **** Methods ****
   *****************/
  function printServerInfo(server: NSServer): void {
    const player = ns.getPlayer();

    // Server Name + RAM
    const host = server.hostname;
    const numPortsRequired = server.numPortsRequired;

    // Hacking Skill Info
    const requiredHacking = server.requiredHackingLevel;

    // Money Info
    const moneyAvailable = server.moneyAvailable();
    const moneyMax = server.maxMoney;
    const moneyPercent = moneyMax > 0 ? moneyAvailable / moneyMax : 1;

    // Security Info
    const securityLevel = server.securityLevel();
    const securityMin = server.minSecurity;
    const securityDiffPer = (securityLevel / securityMin) - 1;

    ns.printRaw(
      <StatsUI
        info={{
          hasArgs: hasArgs,
          name: host,
          ram: server.maxRam,
          portsRequired: numPortsRequired,

          playerHacking: player.skills.hacking,
          requiredHacking,

          moneyMax,
          moneyAvailable,
          moneyPercent,

          securityMin,
          securityLevel,
          securityDiffPer
        }}
      />
    );

    /* ***************
     **** Current ****
     *****************/

    // hack()
    const hackChance = server.hackAnalyzeChance();
    const hackPercentSingle = server.hackAnalyze();
    const hackMoneySingle = moneyMax * hackPercentSingle;
    const hackThreads = ns.hackAnalyzeThreads(host, moneyAvailable);
    const hackMoney = hackMoneySingle * hackThreads;
    const hackSec = ns.hackAnalyzeSecurity(hackThreads, host);
    const hackTime = server.hackTime();

    // weaken()
    const weaken1Value = server.weakenAnalyze(1);
    const weaken1HackThreads = Math.ceil(hackSec / weaken1Value);
    const weaken1ValueThreaded = weaken1Value * weaken1HackThreads;
    const weaken1Time = server.weakenTime();

    // growth()
    const growMult = moneyMax > 0
      ? moneyAvailable > 0
        ? moneyMax / moneyAvailable
        : moneyMax
      : 1;
    const growThreads = Math.ceil(server.growthAnalyze(growMult));
    const growMoney = moneyMax - moneyAvailable;
    const growSec = server.growthAnalyzeSecurity(growThreads);
    const growTime = server.growTime();

    // Terminal Printing
    showActions && hackPercents.length === 0 && ns.printRaw(
      <StatusUIAction
        info={{
          hackTargetPercent: 0, // Current
          moneyMax,
          moneyAvailable,

          hackRam,
          hackChance,
          hackPercentSingle,
          hackMoneySingle,
          hackThreads,
          hackMoney,
          hackSec,
          hackTime,

          growRam,
          growMult,
          growMoney,
          growSec,
          growThreads,
          growTime,

          weakenRam,
          weaken1SecSingle: weaken1Value,
          weaken1Threads: weaken1HackThreads,
          weaken1Sec: weaken1ValueThreaded,
          weaken1Time
        }} />
    );

    // 🧪 Formulas
    if (server.hasFormulas()) {
      printActionDisplay(server);
    }
  }

  function printActionDisplay(server: NSServer): void {
    const host = server.hostname;
    const moneyMax = server.maxMoney;

    // 🧪 Formula Exclusive
    for (const targetHackPercent of hackPercents) {
      const targetHackMoney = moneyMax * targetHackPercent;
      const targetMoneyAvailable = moneyMax - targetHackMoney;

      // hack()
      const hackChance = server.formulas.hackChance();
      const hackPercentSingle = server.formulas.hackPercent();
      const hackMoneySingle = moneyMax * hackPercentSingle;

      const hackThreads = Math.ceil(targetHackPercent / hackPercentSingle);
      const hackPercent = hackPercentSingle * hackThreads;
      const hackMoney = Math.min(moneyMax * hackPercent, moneyMax);
      const hackSec = ns.hackAnalyzeSecurity(hackThreads, host);
      const hackTime = server.formulas.hackTime();

      // weaken() 1
      const weaken1SecSingle = ns.weakenAnalyze(1);

      const weaken1Threads = Math.ceil(hackSec / weaken1SecSingle);
      const weaken1Sec = weaken1SecSingle * weaken1Threads;
      const weaken1Time = server.formulas.weakenTime(server.minSecurity + hackSec);

      // grow()
      const actualMoneyAvailable = moneyMax - hackMoney;

      const growThreads = server.formulas.growThreads(actualMoneyAvailable, moneyMax);
      const growMult = server.formulas.growPercent(growThreads, actualMoneyAvailable);
      const growMoneyEnd = server.formulas.growAmount(actualMoneyAvailable, growThreads);
      const growMoney = growMoneyEnd - actualMoneyAvailable;
      const growSec = server.growSecurityIncrease(growThreads);
      const growTime = server.formulas.growTime();

      const weaken2SecSingle = ns.weakenAnalyze(1);
      const weaken2Threads = Math.ceil(growSec / weaken2SecSingle);
      const weaken2Time = server.formulas.weakenTime(server.minSecurity + hackSec);
      const weaken2Sec = weaken2Threads * weaken2SecSingle;

      // Printing
      showActions && ns.printRaw(
        <StatusUIAction
          info={{
            hackTargetPercent: targetHackPercent,
            moneyMax,
            moneyAvailable: targetMoneyAvailable,

            hackRam,
            hackChance,
            hackPercentSingle,
            hackMoneySingle,
            hackThreads,
            hackMoney,
            hackSec,
            hackTime,

            weakenRam,
            weaken1SecSingle,
            weaken1Threads,
            weaken1Sec,
            weaken1Time,

            growRam,
            growMult,
            growThreads,
            growMoney,
            growSec,
            growTime,

            weaken2SecSingle,
            weaken2Threads,
            weaken2Sec,
            weaken2Time
          }} />
      );
    }
  }
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