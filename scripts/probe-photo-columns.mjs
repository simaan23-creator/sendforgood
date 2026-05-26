/**
 * Probe whether the photo_credits + max_photo_uploads columns exist
 * in the production Supabase. Confirms the schema bug surfaced by
 * the Starter Package audit.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync("C:/Users/Simaan/sendforgood/.env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

console.log("Probing memory_credits.photo_credits ...");
const r1 = await supabase.from("memory_credits").select("photo_credits").limit(1);
console.log(
  "  ",
  r1.error
    ? `MISSING: ${r1.error.message} (code ${r1.error.code})`
    : "EXISTS"
);

console.log("\nProbing memory_requests.max_photo_uploads ...");
const r2 = await supabase
  .from("memory_requests")
  .select("max_photo_uploads")
  .limit(1);
console.log(
  "  ",
  r2.error
    ? `MISSING: ${r2.error.message} (code ${r2.error.code})`
    : "EXISTS"
);
