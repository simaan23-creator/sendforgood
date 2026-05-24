import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);

const tok = env.VERCEL_TOKEN;
const ids = [
  ["sendforgood", "prj_EPf68Xr52JpAgUFJh5AWtn2V1Qlq"],
  ["sendforgood-v2", "prj_KMb9VA60q3asMirE9jLgN6sPDQhn"],
];

for (const [name, id] of ids) {
  const r = await fetch(`https://api.vercel.com/v9/projects/${id}/domains`, {
    headers: { Authorization: `Bearer ${tok}` },
  });
  const j = await r.json();
  console.log(`\n${name} (${id}) domains:`);
  for (const d of j.domains || []) console.log(`  ${d.name}  verified=${d.verified}`);
}
