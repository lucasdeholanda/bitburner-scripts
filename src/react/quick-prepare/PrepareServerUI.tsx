import { fnum } from "/utils/formatters";

interface PrepareUIProps {
  securityLevel: number;
  minSecurity: number;
  moneyAvailable: number;
  maxMoney: number;
}

function PrepareServerUI({
  securityLevel,
  minSecurity,
  moneyAvailable,
  maxMoney
}: PrepareUIProps): JSX.Element {
  const maxBarWidth = 200;
  const securityWidth = Math.floor(minSecurity / securityLevel * maxBarWidth);
  const moneyWidth = Math.floor(moneyAvailable / maxMoney * maxBarWidth);

  const isNotAtMinSecurity = securityLevel > minSecurity;
  const isNotAtMaxMoney = moneyAvailable < maxMoney;

  const tdStyle = { padding: "3px 6px", border: "1px solid white" };
  return (
    <div>
      <table style={{ width: "100%" }}>
        <tbody>
          <tr>
            <td style={tdStyle}>
              💲 {fnum(moneyAvailable)}/{fnum(maxMoney)} {!isNotAtMaxMoney ? "✅" : "🔄"}
            </td>
            <td style={tdStyle}>
              <div style={{ display: "flex" }}>
                <div style={{ height: 10, width: moneyWidth, backgroundColor: "green" }}></div>
                <div style={{ height: 10, width: maxBarWidth - moneyWidth, backgroundColor: "red" }}></div>
              </div>
            </td>
          </tr>
          <tr>
            <td style={tdStyle}>
              🔒 {fnum(minSecurity)}/{fnum(securityLevel)} {!isNotAtMinSecurity ? "✅" : "🔄"}
            </td>
            <td style={tdStyle}>
              <div style={{ display: "flex" }}>
                <div style={{ height: 10, width: securityWidth, backgroundColor: "green" }}></div>
                <div style={{ height: 10, width: maxBarWidth - securityWidth, backgroundColor: "red" }}></div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default PrepareServerUI;
export { PrepareUIProps };