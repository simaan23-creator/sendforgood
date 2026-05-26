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
  `https://api.vercel.com/v6/deployments?projectId=${PROJECT_ID}&target=production&limit=3`,
  { headers: { Authorization: `Bearer ${tok}` } }
);
const j = await r.json();
for (const d of j.deployments || []) {
  const ts = new Date(d.createdAt).toLocaleString();
  console.log(`${d.state.padEnd(10)} ${ts}  ${d.url}`);
  console.log(`           commit: ${d.meta?.githubCommitMessage?.split("\n")[0] || "(no msg)"}`);
}
