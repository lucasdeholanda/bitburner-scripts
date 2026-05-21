interface ActionDisplayInfo {
	hackTargetPercent: number;
	moneyMax: number;
	moneyAvailable: number;

	// hack() info
	hackRam: number;
	hackChance: number;
	hackPercentSingle: number;
	hackMoneySingle: number;
	hackThreads: number;
	hackMoney: number,
	hackSec: number;
	hackTime: number;

	// weaken() 1
	weakenRam: number;
	weaken1SecSingle: number;
	weaken1Threads: number;
	weaken1Sec: number;
	weaken1Time: number;

	//grow()
	growRam: number;
	growMult: number;
	growThreads: number;
	growMoney: number;
	growSec: number;
	growTime: number;

	// weaken() 2
	weaken2SecSingle?: number;
	weaken2Threads?: number;
	weaken2Sec?: number;
	weaken2Time?: number;
}

export default ActionDisplayInfo;