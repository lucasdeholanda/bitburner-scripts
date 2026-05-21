import NSServer from "/ns-wrappers/ns-server";
import { parseArgs } from "/utils/parsers";
import { logError } from "/utils/printers";
import { scanHome } from "/utils/scanners";
import { AutocompleteData, NS, ScriptArg } from "@ns";

class PrepareServerFlags {
  setup = false;
  hack = 0.001;
  runner = "home";
  bought = false;
  all = false;
}

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");

  try {
    const {
      _: args,
      hack,
      setup: shouldSetup,
      runner: runnerHost,
      bought: runOnBoughtOnly,
      all: prepareAllAvailable
    } = parseArgs<PrepareServerFlags, string[]>(ns, PrepareServerFlags);

    const home = new NSServer(ns, "home");

    let targets: Array<NSServer>;
    const boughtServers = ns.getPurchasedServers();

    if (runOnBoughtOnly) {
      const boughtServerCount = boughtServers.length;

      const servers = scanHome(ns)
        .filter(server => !ns.getServer(server).purchasedByPlayer)
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
          }

          return server;
        })
        .filter(s =>
          home.numProgramsOwned >= s.numPortsRequired
          && s.requiredHackingLevel <= ns.getPlayer().skills.hacking / 2
          && s.maxMoney > 0
        )
        .sort((s1, s2) => s1.maxMoney - s2.maxMoney);

      targets = servers.slice(-boughtServerCount);
    } else if (prepareAllAvailable) {
      targets = scanHome(ns)
        .filter(server => !ns.getServer(server).purchasedByPlayer)
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
          }

          return server;
        })
        .filter(s =>
          home.numProgramsOwned >= s.numPortsRequired
          && s.requiredHackingLevel <= ns.getPlayer().skills.hacking / 2
          && s.maxMoney > 0
        )
        .sort((s1, s2) => s1.maxMoney - s2.maxMoney);
    } else {
      targets = args.map(h => new NSServer(ns, h));
    }

    let boughtServerIndex = 0;

    for (const target of targets) {
      // ns.getServer().sc
      // if (
      //   ns.isRunning("/hacking/prepare-server.tsx", ns.getHostname(), ...args)
      //   || ns.isRunning("/hacking/prepare-server.tsx", ns.getHostname(), ...args)
      // ) {
      //   continue;
      // }

      // Servers
      const server = new NSServer(ns);

      let runner;
      if (runOnBoughtOnly) {
        const boughtServer = boughtServers[boughtServerIndex++];
        runner = new NSServer(ns, boughtServer);
      } else {
        runner = new NSServer(ns, runnerHost);
      }

      // Copying Files
      runner.files.grow.pull();
      runner.files.weaken.pull();

      const args: ScriptArg[] = [
        "--hack", hack,
        shouldSetup ? "--setup" : "",
        "--runner", runner.hostname,
        target.hostname
      ];

      server.files.prepareServer.exec(1, ...args);
    }
  } catch (e) {
    logError(ns, e);
  }
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
