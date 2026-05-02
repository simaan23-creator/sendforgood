import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:/Users/Simaan/sendforgood/.env.local", "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data, error } = await supabase.storage.listBuckets();
if (error) { console.error(error); process.exit(1); }
for (const b of data) {
  console.log(`${b.name.padEnd(24)} public=${b.public}  size_limit=${b.file_size_limit ?? "null"}  mimes=${JSON.stringify(b.allowed_mime_types)}`);
}
