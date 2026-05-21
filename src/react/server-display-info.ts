interface ServerDisplayInfo {
	hasArgs: boolean;
	name: string;

	ram: number;
	portsRequired: number;

	requiredHacking: number;
	playerHacking: number;

	moneyAvailable: number;
	moneyMax: number;
	moneyPercent: number;

	securityMin: number;
	securityLevel: number;
	securityDiffPer: number;
}

export default ServerDisplayInfo;