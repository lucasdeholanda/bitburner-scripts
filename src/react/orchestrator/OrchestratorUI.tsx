import NSServer from "/ns-wrappers/ns-server";
import ActionDisplayInfo from "/react/action-display-info";
import { ServerFormulaDisplayProps } from "/react/stats/StatusUIAction";
import { fint, fnum, fper, fram, ftime } from "/utils/formatters";
import { scanHome } from "/utils/scanners";
import { ScriptsHelper } from "/utils/lists/scripts";
import { AutocompleteData, NS } from "@ns";

export interface OrchestratorUIProps {
  hackRam: number;
  growRam: number;
  weakenRam: number;

  hackTime: number;
  weaken1Time: number;
  growTime: number;
  weaken2Time: number;
  longestTime: number;

  hackTimeDiff: number,
  weaken1TimeDiff: number,
  growTimeDiff: number,
  weaken2TimeDiff: number,

  hackTimeTotal: number,
  weaken1TimeTotal: number,
  growTimeTotal: number,
  weaken2TimeTotal: number

  paddingMs: number
}

export function OrchestratorUI(props: OrchestratorUIProps): JSX.Element {
  const {
    hackRam,
    growRam,
    weakenRam,
    hackTime,
    weaken1Time,
    growTime,
    weaken2Time,
    longestTime,

    hackTimeDiff,
    weaken1TimeDiff,
    growTimeDiff,
    weaken2TimeDiff,

    hackTimeTotal,
    weaken1TimeTotal,
    growTimeTotal,
    weaken2TimeTotal,

    paddingMs
  } = props;

  const tableHeaderCellStyle = {
    border: "1px solid gray",
    padding: "5px 10px"
  };
  const tableCellStyle = {
    border: "1px solid white",
    padding: "5px 10px"
  };

  const paddingMs3 = paddingMs * 3;
  const paddingMs2 = paddingMs * 2;

  const fractionator = 100 / 10;
  return (
    <div>
      <h1>Longest Time {ftime(longestTime)}</h1>

      {[0, 1, 2].map(i => (
          <div style={{ border: "1px solid white", padding: "10px 20px" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span>Hack: 0 </span>
              <div style={{ display: "inline-flex" }}>
                <div
                  style={{
                    width: (paddingMs * i + paddingMs3 * i) / fractionator,
                    height: 10,
                    border: "1px solid red"
                  }}></div>
                <div style={{ width: hackTimeDiff / fractionator, height: 10, border: "1px solid gray" }}></div>
                <div style={{ width: hackTime / fractionator, height: 10, backgroundColor: "green" }}></div>
              </div>
              <div> {ftime((paddingMs * i + paddingMs3 * i) + hackTimeDiff + hackTime, true)}</div>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              <span>Wek1: 0 </span>
              <div style={{ display: "inline-flex" }}>
                <div
                  style={{
                    width: (paddingMs * i + paddingMs3 * i) / fractionator,
                    height: 10,
                    border: "1px solid red"
                  }}></div>
                <div style={{ width: weaken1TimeDiff / fractionator, height: 10, border: "1px solid gray" }}></div>
                <div style={{ width: weaken1Time / fractionator, height: 10, backgroundColor: "green" }}></div>
                <div style={{ backgroundColor: "red", width: paddingMs / fractionator }}></div>
              </div>
              <div> {ftime((paddingMs * i + paddingMs3 * i) + weaken1TimeDiff + weaken1Time + paddingMs, true)}</div>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              <span>Grow: 0 </span>
              <div style={{ display: "inline-flex" }}>
                <div
                  style={{
                    width: (paddingMs * i + paddingMs3 * i) / fractionator,
                    height: 10,
                    border: "1px solid red"
                  }}></div>
                <div style={{ width: growTimeDiff / fractionator, height: 10, border: "1px solid gray" }}></div>
                <div style={{ width: growTime / fractionator, height: 10, backgroundColor: "green" }}></div>
                <div style={{ backgroundColor: "red", width: paddingMs2 / fractionator }}></div>
              </div>
              <div> {ftime((paddingMs * i + paddingMs3 * i) + growTimeDiff + growTime + paddingMs2, true)}</div>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              <span>Wek2: 0 </span>
              <div style={{ display: "inline-flex" }}>
                <div
                  style={{
                    width: (paddingMs * i + paddingMs3 * i) / fractionator,
                    height: 10,
                    border: "1px solid red"
                  }}></div>
                <div style={{ width: weaken2TimeDiff / fractionator, height: 10, border: "1px solid gray" }}></div>
                <div style={{ width: weaken2Time / fractionator, height: 10, backgroundColor: "green" }}></div>
                <div style={{ backgroundColor: "red", width: paddingMs3 / fractionator }}></div>
              </div>
              <div> {ftime((paddingMs * i + paddingMs3 * i) + weaken2TimeDiff + weaken2Time + paddingMs3, true)}</div>
            </div>
          </div>
        ))}

      <table>
        <thead>
          <tr>
            <td style={tableHeaderCellStyle}>Script</td>
            <td style={tableHeaderCellStyle}>RAM</td>
            <td style={tableHeaderCellStyle}>Time (Human)</td>
            <td style={tableHeaderCellStyle}>Start Time</td>
            <td style={tableHeaderCellStyle}>End Time</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tableCellStyle}>hack.exe</td>
            <td style={tableCellStyle}>{fram(hackRam, 2)}</td>
            <td style={tableCellStyle}>{ftime(hackTime)}</td>
            <td style={tableCellStyle}>{ftime(hackTimeDiff, true)}</td>
            <td style={tableCellStyle}>{ftime(hackTimeTotal, true)}</td>
          </tr>
          <tr>
            <td style={tableCellStyle}>weaken.exe 1</td>
            <td style={tableCellStyle}>{fram(weakenRam, 2)}</td>
            <td style={tableCellStyle}>{ftime(weaken1Time)}</td>
            <td style={tableCellStyle}>{ftime(weaken1TimeDiff, true)}</td>
            <td style={tableCellStyle}>{ftime(weaken1TimeTotal + paddingMs, true)}</td>
          </tr>
          <tr>
            <td style={tableCellStyle}>grow.exe</td>
            <td style={tableCellStyle}>{fram(growRam, 2)}</td>
            <td style={tableCellStyle}>{ftime(growTime)}</td>
            <td style={tableCellStyle}>{ftime(growTimeDiff, true)}</td>
            <td style={tableCellStyle}>{ftime(growTimeTotal + paddingMs2, true)}</td>
          </tr>
          <tr>
            <td style={tableCellStyle}>weaken.exe 2</td>
            <td style={tableCellStyle}>{fram(weakenRam, 2)}</td>
            <td style={tableCellStyle}>{ftime(weaken2Time)}</td>
            <td style={tableCellStyle}>{ftime(weaken2TimeDiff, true)}</td>
            <td style={tableCellStyle}>{ftime(weaken2TimeTotal + paddingMs3, true)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}