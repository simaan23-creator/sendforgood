import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync("C:/Users/Simaan/sendforgood/.env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const userId = "6101f3b6-57b2-4f5b-9bd2-36c10ee8af3d";
const { data: letters } = await sb.from("letters").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(3);
console.log("sample letter row keys:", letters && letters[0] ? Object.keys(letters[0]).join(", ") : "(none)");
console.log("\nfull rows:");
for (const l of letters || []) console.log(JSON.stringify(l, null, 2));
