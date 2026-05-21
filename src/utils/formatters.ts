export const fint = formatInteger;
export const fnum = formatNumber;
export const fram = formatRam;
export const fper = formatPercent;
export const ftime = formatTime;

export const locale = "de";
export const numSuffixes = ["", "k", "m", "b", "t", "q", "Q", "s", "S", "o", "n", "d"];
export const ramSuffixes = ["GB", "TB", "PB", "EB", "ZB", "YB"];

function toLocaleFixed(num: number, fractionalDigits?: number, padFractionalDigits = true): string {
	const minimumFractionDigits = padFractionalDigits ? fractionalDigits : undefined;
	const maximumFractionDigits = fractionalDigits;

	return num.toLocaleString(locale, { minimumFractionDigits, maximumFractionDigits });
}

function formatNumber(num: number | null | undefined, fractionalDigits = 3): string {
	if (num === undefined) return "<undefined>";
	if (num === null) return "<null>";
	if (isNaN(num)) return "<NaN>";
	if (!Number.isFinite(num)) return num.toString();

	const numDivider = 1000;

	let convertedNum = Math.abs(num);
	let suffixIndex = 0;

	while (suffixIndex < numSuffixes.length - 1) {
		if (convertedNum >= numDivider) {
			convertedNum /= numDivider;
			suffixIndex++;
		} else {
			break;
		}
	}
	const suffix = numSuffixes[suffixIndex];

	return toLocaleFixed(convertedNum, fractionalDigits) + suffix;
}

function formatInteger(num: number): string {
	return formatNumber(num, num >= 1000 ? 3 : 0);
}

function formatPercent(num: number, fractionalDigits = 2): string {
	return formatNumber(num * 100, fractionalDigits) + "%";
}

function formatRam(ram: number, fractionalDigits = 0): string {
	const ramDivider = 1024;

	let convertedRam = ram;
	let suffixIndex = 0;

	while (suffixIndex < ramSuffixes.length - 1) {
		if (convertedRam >= ramDivider) {
			convertedRam /= ramDivider;
			suffixIndex++;
		} else {
			break;
		}
	}
	const suffix = ramSuffixes[suffixIndex];

	return toLocaleFixed(convertedRam, fractionalDigits) + suffix;
}

function formatTime(ms: number | null | undefined, showMillis = false): string {
	if (ms === undefined) return "<undefined>";
	if (ms === null) return "<null>";
	if (isNaN(ms)) return "<NaN>";
	if (!Number.isFinite(ms)) return ms.toString();
	const prefix = ms < 0 ? "-" : "";
	ms = Math.abs(ms);

	const msPerSecond = 1000;
	const msPerMinute = msPerSecond * 60;
	const msPerHour = msPerMinute * 60;
	const msPerDay = msPerHour * 24;

	const days = Math.floor(ms / msPerDay);
	ms %= msPerDay;

	const hours = Math.floor(ms / msPerHour);
	ms %= msPerHour;

	const minutes = Math.floor(ms / msPerMinute);
	ms %= msPerMinute;

	const seconds = Math.floor(ms / msPerSecond);
	ms = ms % msPerSecond;

	const padding = 3;
	const millis = Math.round(ms).toString()
		.padStart(padding, "0")
		.slice(0, padding);

	const timeParts: string[] = [];
	if (days) timeParts.push(`${days} ${pluralize(days, "day")}`);
	if (hours) timeParts.push(`${hours} ${pluralize(hours, "hour")}`);
	if (minutes) timeParts.push(`${minutes} ${pluralize(minutes, "minute")}`);

	if (seconds || (!days && !hours && !minutes)) {
		let millisString = "";
		if (showMillis) millisString = `.${millis}`;

		timeParts.push(`${seconds}${millisString} ${pluralize(seconds, "second")}`);
	}

	return prefix + timeParts.join(" ");
}

function pluralize(value: number, unit: string, plural = "s"): string {
	return value === 1 ? unit : unit + plural;
}