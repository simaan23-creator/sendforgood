import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:/Users/Simaan/sendforgood/.env.local", "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const r = await sb.from("stripe_webhook_events").delete().like("id", "evt_test_%").select();
console.log("deleted test rows:", r.error ? r.error.message : r.data?.length);

const cur = await sb.from("stripe_webhook_events").select("*").order("received_at", { ascending: false });
console.log("current rows:", cur.data?.length, JSON.stringify(cur.data, null, 2));
