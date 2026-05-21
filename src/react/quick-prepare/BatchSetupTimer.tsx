import { ftime } from "/utils/formatters";

interface BatchSetupTimerProps {
  title: string,

  methodPaddingMax: number,
  methodExecMax: number,
  paddingMs: number,
  paddingLevel: number,
  paddingLevelMax: number,
  batchIndex: number,
  batchTotal: number,

  refreshIntervalRaw?: number
}

function BatchSetupTimer({
  title, methodPaddingMax, methodExecMax, paddingLevelMax, refreshIntervalRaw, batchIndex, paddingMs, paddingLevel
}: BatchSetupTimerProps): JSX.Element {
  const refreshInterval = refreshIntervalRaw || 250;

  // @ts-ignore
  const [currentTime, setCurrentTime] = React.useState(0); // Min: 0

  // Batch Padding (Front)
  const batchPaddingMax = batchIndex * paddingMs;
  const batchPaddingCurrent = currentTime;
  const batchPaddingValue = Math.min(batchPaddingCurrent, batchPaddingMax); // Max: Mid Max
  // Mid
  const methodPaddingCurrent = batchPaddingCurrent - batchPaddingMax;
  const methodPaddingMax2 = methodPaddingMax - batchPaddingMax;
  let methodPaddingValue = Math.max(0, methodPaddingCurrent); // Min: 0
  methodPaddingValue = Math.min(methodPaddingMax, methodPaddingValue); // Max: Mid Max
  // End
  const endCurrent = methodPaddingCurrent - methodPaddingMax;
  const endMax = methodExecMax - methodPaddingMax;
  let endValue = Math.max(0, endCurrent); // Min: 0
  endValue = Math.min(endMax, endValue); // Max: End Max
  // Padding
  const paddingMax = paddingMs * paddingLevelMax;
  const paddingMaxForLevel = paddingMs * paddingLevel;
  const paddingCurrent = Math.min(endCurrent - endMax, paddingMaxForLevel);
  let paddingValue = Math.max(0, paddingCurrent); // Min: 0
  paddingValue = Math.min(paddingMax, paddingValue); // Max: Padding Max

  // % Percentages %
  // Bar Share of 100%
  const totalMax = batchPaddingMax * 0 + methodPaddingMax + endMax + paddingMax;

  const frontBarShare = batchPaddingMax * 0 / totalMax;
  const midBarShare = methodPaddingMax / totalMax;
  const endBarShare = endMax / totalMax;
  const paddingBarShare = 1 - frontBarShare - midBarShare - endBarShare;

  // % of Front
  const frontBlocked = paddingMs * batchIndex;
  const frontBlockedPerc = frontBlocked / batchPaddingMax;
  const frontValuePerc = batchPaddingValue / batchPaddingMax;
  const frontLeftPerc = 1 - frontValuePerc;

  // % of Mid
  const midValuePerc = methodPaddingValue / methodPaddingMax;
  const midLeftPerc = 1 - midValuePerc;

  // % of Max
  const endValuePerc = endValue / endMax;
  const endLeftPerc = 1 - endValuePerc;

  // % of Max
  const paddingValuePerc = paddingValue / paddingMax;
  const paddingMaxForLevelPerc = (paddingMaxForLevel - paddingValue) / paddingMax;
  const paddingLeftPerc = 1 - paddingValuePerc - paddingMaxForLevelPerc;

  // @ts-ignore
  React.useEffect(() => {
    let interval = -1;

    const refreshFunction = (): void => {
      setCurrentTime(currentRaw => {
        const newCurrent = Math.min(methodExecMax + paddingMs * 4, currentRaw + refreshInterval);
        // ns.tprintf("UPDATE: " + JSON.stringify({ currentTime, newCurrent }));

        return newCurrent;
      });

      if (currentTime === methodExecMax) {
        clearInterval(interval);
        // ns.tprintf("ENDING: " + JSON.stringify({ currentTime }));
      }
    };

    interval = setInterval(refreshFunction, refreshInterval);

    return () => clearInterval(interval);
  }, []);

  const barWidth = 400;
  const barProportion = barWidth / totalMax;

  return (
    <div style={{ border: "2px solid white" }}>
      <h4 style={{ margin: "0" }}>{title} | Time {ftime(currentTime)} | Time
        Max {ftime(endMax + paddingMs * paddingLevel)}</h4>

      <div style={{ display: "flex" }}>
        <div style={{
          display: "inline-flex",
          boxSizing: "border-box",
          height: "10px",
          backgroundColor: "cyan",
          width: frontBlocked * barProportion
        }}></div>
        <div style={{ display: "inline-flex", position: "relative", height: 20, padding: "10px 20px", width: barWidth }}>
          {/* White Bar */}
          {/*<div style={{ display: "flex", width: `${frontBarShare * 100}%` }}>*/}
          {/*  <div style={{*/}
          {/*    boxSizing: "border-box",*/}
          {/*    height: "100%",*/}
          {/*    backgroundColor: "white",*/}
          {/*    width: `${frontValuePerc * 100}%`*/}
          {/*  }}></div>*/}
          {/*  <div style={{*/}
          {/*    boxSizing: "border-box",*/}
          {/*    height: "100%",*/}
          {/*    border: "1px solid white",*/}
          {/*    width: `${frontLeftPerc * 100}%`*/}
          {/*  }}></div>*/}
          {/*</div>*/}
          {/* Gray Bar */}
          <div style={{ display: "flex", width: `${midBarShare * 100}%` }}>
            <div style={{
              boxSizing: "border-box",
              height: "100%",
              backgroundColor: "grey",
              width: `${midValuePerc * 100}%`
            }}></div>
            <div style={{
              boxSizing: "border-box",
              height: "100%",
              border: "1px solid gray",
              width: `${midLeftPerc * 100}%`
            }}></div>
          </div>
          {/* Green Bar */}
          <div style={{ display: "flex", width: `${endBarShare * 100}%` }}>
            <div style={{
              boxSizing: "border-box",
              height: "100%",
              backgroundColor: "green",
              width: `${endValuePerc * 100}%`
            }}></div>
            <div style={{
              boxSizing: "border-box",
              height: "100%",
              border: "1px solid green",
              width: `${endLeftPerc * 100}%`
            }}></div>
          </div>
          {/* Red Bar */}
          <div style={{ display: "flex", width: `${paddingBarShare * 100}%` }}>
            <div
              style={{
                boxSizing: "border-box",
                height: "100%",
                backgroundColor: "red",
                width: `${paddingValuePerc * 100}%`
              }}></div>
            <div
              style={{
                boxSizing: "border-box",
                height: "100%",
                border: "1px solid red",
                width: `${paddingMaxForLevelPerc * 100}%`
              }}></div>
            <div
              style={{
                boxSizing: "border-box",
                height: "100%",
                backgroundColor: "transparent",
                width: `${paddingLeftPerc * 100}%`
              }}></div>
          </div>
        </div>
      </div>

      {/*<div>*/}
      {/*  <h3>MID</h3>*/}
      {/*  <div>midBarShare: [{fper(midBarShare)}] | methodPaddingMax: [{(methodPaddingMax)}]</div>*/}
      {/*  <div>midValuePerc: [{fper(midValuePerc)}] | methodPaddingValue: [{(methodPaddingValue)}]</div>*/}
      {/*  <div>midLeftPerc: [{fper(midLeftPerc)}]</div>*/}
      {/*  <h3>END</h3>*/}
      {/*  <div>endBarShare: [{fper(endBarShare)}] | endMax: [{endMax}]</div>*/}
      {/*  <div>endValuePerc: [{fper(endValuePerc)}] | endValue: [{endValue}]</div>*/}
      {/*  <div>endLeftPerc: [{fper(endLeftPerc)}]</div>*/}
      {/*  <h3></h3>*/}
      {/*</div>*/}
      {/*<div style={{ fontSize: 8 }}>*/}
      {/*<div>Current: [{currentTime}]</div>*/}
      {/*<div>Mid: [{midRaw}]</div>*/}
      {/*<div>End: [{endRaw}]</div>*/}
      {/*<div>Refresh Interval: [{refreshInterval}]</div>*/}
      {/*</div>*/}
      {/* Bars */}
    </div>
  );
}

export default BatchSetupTimer;
export { BatchSetupTimerProps };