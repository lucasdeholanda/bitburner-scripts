import { NS } from "@ns";

function Timer(): JSX.Element {
  // @ts-ignore
  const [seconds, setSeconds] = React.useState(0);

  // @ts-ignore
  React.useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return <div>Seconds: {seconds}</div>;
}

export async function main(ns: NS): Promise<void> {
  ns.tail();

  ns.printRaw(<Timer />);
  await ns.asleep(10000);
}