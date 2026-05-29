import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);

const tok = env.VERCEL_TOKEN;
const PROJECT_ID = "prj_EPf68Xr52JpAgUFJh5AWtn2V1Qlq";

const r = await fetch(
  `https://api.vercel.com/v6/deployments?projectId=${PROJECT_ID}&target=production&limit=1`,
  { headers: { Authorization: `Bearer ${tok}` } }
);
const j = await r.json();
const dep = j.deployments[0];
console.log("Deploy:", dep.uid, dep.state);

const logsRes = await fetch(
  `https://api.vercel.com/v2/deployments/${dep.uid}/events?builds=1&direction=backward&limit=200`,
  { headers: { Authorization: `Bearer ${tok}` } }
);
const logs = await logsRes.json();
for (const e of logs) {
  if (e.type === "stderr" || e.type === "stdout" || e.text) {
    console.log(e.text || JSON.stringify(e).slice(0, 300));
  }
}
