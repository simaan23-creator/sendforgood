import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:/Users/Simaan/sendforgood/.env.local", "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Binary-search the project's per-bucket size cap
const candidates = [50, 100, 200, 300, 500, 1000, 2000, 5000];
for (const mb of candidates) {
  const bytes = mb * 1024 * 1024;
  const { error } = await supabase.storage.updateBucket("voice-messages", {
    public: true,
    fileSizeLimit: bytes,
  });
  if (error) console.log(`${mb} MB: REJECTED (${error.message})`);
  else console.log(`${mb} MB: OK`);
}

// Reset to 50 MB at end so we don't leave it at the highest accepted value yet
await supabase.storage.updateBucket("voice-messages", { public: true, fileSizeLimit: 50 * 1024 * 1024 });
