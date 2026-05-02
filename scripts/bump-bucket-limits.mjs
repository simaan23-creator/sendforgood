// Raise the per-file size limit on voice-messages and memory-recordings
// buckets from 50 MB → 500 MB. A 5-minute 1080p webm easily breaches 50 MB
// and was returning 400 from the signed-upload endpoint.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:/Users/Simaan/sendforgood/.env.local", "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const NEW_LIMIT = 500 * 1024 * 1024; // 500 MB

for (const name of ["voice-messages", "memory-recordings"]) {
  const { data, error } = await supabase.storage.updateBucket(name, {
    public: true,
    fileSizeLimit: NEW_LIMIT,
  });
  if (error) console.error(`${name}: ERR`, error);
  else console.log(`${name}: OK`, data);
}

// Verify
const { data: buckets } = await supabase.storage.listBuckets();
console.log("\nAfter:");
for (const b of buckets) {
  if (b.name === "voice-messages" || b.name === "memory-recordings") {
    console.log(`  ${b.name}: size_limit=${b.file_size_limit} (${(b.file_size_limit / 1024 / 1024).toFixed(0)} MB)`);
  }
}
