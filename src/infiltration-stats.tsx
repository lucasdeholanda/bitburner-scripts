import { fint, fnum } from "/utils/formatters";
import { parseArgs } from "/utils/parsers";
import { printError } from "/utils/printers";
import { AutocompleteData, NS } from "@ns";

class InfiltrationStatsFlags {
	order: "difficulty" | "soa" | "rep" = "difficulty";
}

export async function main(ns: NS): Promise<void> {
	try {
		const { order } = parseArgs(ns, InfiltrationStatsFlags);

		const allInfiltrations = ns.infiltration
			.getPossibleLocations()
			.flatMap(l => ns.infiltration.getInfiltration(l.name))
			.filter(i => i.difficulty <= .25)
			.sort((l1, l2) => {
				const l2MaxCL = l2.maxClearanceLevel;
				const l1MaxCL = l1.maxClearanceLevel;

				const difficultyAsc = l1.difficulty - l2.difficulty;
				const maxClearanceAsc = l1MaxCL - l2MaxCL;
				const soaRepPerCL = (l2.reward.SoARep / l2MaxCL) - (l1.reward.SoARep / l1MaxCL);
				const tradeRepPerCLDesc = (l2.reward.tradeRep / l2MaxCL) - (l1.reward.tradeRep / l1MaxCL);

				switch (order) {
					case "soa":
						return soaRepPerCL || difficultyAsc || maxClearanceAsc;
					case "rep":
						return tradeRepPerCLDesc || difficultyAsc || maxClearanceAsc;
					default:
						return difficultyAsc || maxClearanceAsc;
				}
			});

		const tdClass = { border: "1px solid white", padding: "3px 5px" };
		ns.printRaw(
			<div>
				<table style={{ borderCollapse: "collapse" }}>
					<thead>
						<th>Company (City)</th>
						<th>Difficulty</th>
						<th>Max CL</th>
						<th>SoA Rep/CL</th>
						<th>Trade Rep/CL</th>
						<th>SoA Rep</th>
						<th>Trade Rep</th>
						<th>Sell Cash</th>
					</thead>
					<tbody>
						{allInfiltrations.reverse().map(infiltration =>
							<tr>
								<td style={tdClass}>{infiltration.location.name} ({infiltration.location.city})</td>
								<td style={tdClass}>{fnum(infiltration.difficulty)}</td>
								<td style={tdClass}>{fint(infiltration.maxClearanceLevel)}</td>
								<td style={tdClass}>{fnum(infiltration.reward.SoARep / infiltration.maxClearanceLevel)}</td>
								<td style={tdClass}>{fnum(infiltration.reward.tradeRep / infiltration.maxClearanceLevel)}</td>
								<td style={tdClass}>{fnum(infiltration.reward.SoARep)}</td>
								<td style={tdClass}>{fnum(infiltration.reward.tradeRep)}</td>
								<td style={tdClass}>{fnum(infiltration.reward.sellCash)}</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		);

		ns.ui.openTail();
		ns.ui.resizeTail(800, 500);
	} catch (e) {
		printError(ns, e);
	}
}

export function autocomplete(data: AutocompleteData, args: string[]): string[] {
	const commands = data.command.split(" ");
	const lastCommand = commands[commands.length - 1];
	const isCompletingFlag = lastCommand.startsWith("-") || lastCommand.startsWith("--");

	if (isCompletingFlag) {
		const flags = Object.keys(new InfiltrationStatsFlags());
		return flags.map(f => "--" + f);
	} else {
		return [];
	}
}
