import ActionDisplayInfo from "/react/action-display-info";
import { fint, fnum, fper, fram, ftime } from "/utils/formatters";

export interface ServerFormulaDisplayProps {
	info: ActionDisplayInfo;
}

export function StatusUIAction(props: ServerFormulaDisplayProps): JSX.Element {
	const {
		hackTargetPercent,
		moneyMax,
		moneyAvailable,

		hackRam,
		hackChance,
		hackMoneySingle,
		hackPercentSingle,
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
	}: ActionDisplayInfo = props.info;

	const tableCellStyle = {
		border: "1px solid white",
		padding: "5px 10px"
	};

	const shouldShowWeaken2 = weaken2Threads !== undefined;
	const hackTargetDescription = hackTargetPercent > 0
		? fper(hackTargetPercent, hackTargetPercent >= .05 ? 0 : 2)
		: "Current";

	return (
		<div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
			<h2 style={{ margin: 0 }}>{hackTargetDescription}</h2>
			<table cellSpacing={0}>
				<thead>
					<tr>
						<th>Action</th>
						<th>Threaded Info</th>
						<th>Time</th>
						<th>Info</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td style={tableCellStyle}>
							👨🏻‍💻👾 hack() 🎲{fper(hackChance, hackChance >= .05 ? 0 : 2)}
						</td>
						<td style={tableCellStyle}>
							🧵{fint(hackThreads)} ({fram(hackRam * hackThreads, 2)})&nbsp;
							🔒{fnum(hackSec)}{hackSec > 0 ? "🔺": "➖"}&nbsp;
							💲{fnum(hackMoney)}{hackMoney > 0 ? "🔻": "➖"}&nbsp;
							({fper(moneyMax && hackMoney / moneyMax)})
						</td>
						<td style={tableCellStyle}>
							⌛ {ftime(hackTime)}
						</td>
						<td style={tableCellStyle}>
							💲{fper(hackPercentSingle)}{hackPercentSingle > 0 ? "🔻": "➖"}&nbsp;
							💲{fnum(hackMoneySingle)}{hackMoneySingle > 0 ? "🔻": "➖"}
						</td>
					</tr>

					<tr>
						<td style={tableCellStyle}>
							👨🏻‍💻🔒 weaken(){shouldShowWeaken2 ? " 1" : ""}
						</td>
						<td style={tableCellStyle}>
							🧵{fint(weaken1Threads)} ({fram(weakenRam * weaken1Threads, 2)})&nbsp;
							🔒{fnum(weaken1Sec)}{hackMoneySingle > 0 ? "🔻": "➖"}
						</td>
						<td style={tableCellStyle}>
							⌛ {ftime(weaken1Time)}
						</td>
						<td style={tableCellStyle}>
							🔒{fnum(weaken1SecSingle)}{hackMoneySingle > 0 ? "🔻": "➖"}
						</td>
					</tr>

					<tr>
						<td style={tableCellStyle}>
							👨🏻‍💻💹 grow()
						</td>
						<td style={tableCellStyle}>
							🧵{fint(growThreads)} ({fram(growRam * growThreads, 2)})&nbsp;
							🔒{fnum(growSec)}{hackMoneySingle > 0 ? "🔺": "➖"}
							💲{fnum(moneyAvailable)} ▶️ 💲{fnum(moneyMax)} (💲+{fnum(growMoney)}) &nbsp;
							❎{fnum(growMult)}&nbsp;
						</td>
						<td style={tableCellStyle}>
							⌛ {ftime(growTime)}
						</td>
						<td style={tableCellStyle}></td>
					</tr>

					{shouldShowWeaken2 &&
						<>
							<tr>
								<td style={tableCellStyle}>
									👨🏻‍💻🔒 weaken() 2
								</td>
								<td style={tableCellStyle}>
									🧵{fint(weaken2Threads)} ({fram(weakenRam * weaken2Threads, 2)})&nbsp;
									🔒{fnum(weaken2Sec)}🔻
								</td>
								<td style={tableCellStyle}>
									⌛ {ftime(weaken2Time)}
								</td>
								<td style={tableCellStyle}>
									🔒{fnum(weaken2SecSingle)}🔻
								</td>
							</tr>
						</>
					}
				</tbody>
			</table>
		</div>
	);
}
