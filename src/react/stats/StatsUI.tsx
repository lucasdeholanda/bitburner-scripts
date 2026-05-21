import ActionDisplayInfo from "/react/action-display-info";
import ServerDisplayInfo from "/react/server-display-info";
import { fint, fnum, fper, fram } from "/utils/formatters";

export interface ServerDisplayProps {
	info: ServerDisplayInfo,
	formulaInfos?: ActionDisplayInfo[]
}

export function StatsUI(props: ServerDisplayProps): JSX.Element {
	const {
		hasArgs,
		name,
		ram,
		portsRequired,

		requiredHacking,
		playerHacking,

		moneyMax,
		moneyAvailable,
		moneyPercent,

		securityMin,
		securityLevel,
		securityDiffPer
	} = props.info;

	return (
		<div style={{
			display: "inline-block",
			padding: "10px 20px",
			border: "1px solid white",
			alignItems: "center"
		}}>
			<h1 style={{ textAlign: "center", padding: "3px 6px", border: "1px solid cyan",  margin: 0 }}>
				{!hasArgs ? "🥇 " : ""}🖥️[{name}]🖥️ 📀{fram(ram)}
			</h1>
			<ul style={{ listStyle: "none", margin: 0, padding: "5px 10px" }}>
				<li>💰 💲{fnum(moneyAvailable)} / 💲{fnum(moneyMax)} {moneyAvailable === moneyMax ? "✅" : "🔄"} ({fper(moneyPercent, moneyPercent > .05 ? 0 : 2)})</li>
				<li>🔒 {fnum(securityMin)} / {fnum(securityLevel)} {securityLevel === securityMin ? "✅" : "🔄"} (+{fper(securityDiffPer, securityDiffPer > .05 ? 0 : 2)})</li>
				<li>👨‍💻{fint(requiredHacking)} / 🧑{fint(playerHacking)} (🚪{fint(portsRequired)})</li>
			</ul>
		</div>
	);
}
