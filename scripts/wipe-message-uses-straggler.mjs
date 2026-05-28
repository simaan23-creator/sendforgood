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

const { data: stragglers } = await supabase.from("message_uses").select("*");
console.log("Remaining rows:", JSON.stringify(stragglers, null, 2));

// Find a column with a non-null value to use as the delete predicate
for (const row of stragglers || []) {
  const cols = Object.entries(row).filter(([_, v]) => v !== null);
  console.log("Using cols for delete:", cols.map(([k]) => k));
}

// Delete by user_id (typically present)
const { error: e1 } = await supabase
  .from("message_uses")
  .delete()
  .not("user_id", "is", null);
if (e1) console.error("user_id delete failed:", e1);

// Or by created_at as fallback
const { error: e2 } = await supabase
  .from("message_uses")
  .delete()
  .not("created_at", "is", null);
if (e2) console.error("created_at delete failed:", e2);

const { count } = await supabase
  .from("message_uses")
  .select("*", { count: "exact", head: true });
console.log("Final count:", count);
