import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Load .env.local manually
const env = readFileSync(".env.local", "utf8");
for (const line of env.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data, error } = await sb
  .from("letters")
  .select("id, title, delivery_type, status, recipient_name, address_line1, city, state, postal_code, created_at")
  .order("created_at", { ascending: false })
  .limit(20);

if (error) {
  console.error("ERR:", error);
  process.exit(1);
}

console.log("Recent letters:", data.length);
console.log("---");
for (const l of data) {
  const hasAddr = !!(l.address_line1 || l.city);
  console.log(
    l.delivery_type.padEnd(15),
    "|",
    l.status.padEnd(18),
    "|",
    (l.recipient_name || "-").padEnd(20),
    "|",
    hasAddr ? "ADDR" : "NO_ADDR",
    "|",
    (l.title || "(no title)").slice(0, 40)
  );
}

const physical = data.filter(l => l.delivery_type === "physical" || l.delivery_type === "physical_photo");
const inQueue = physical.filter(l => !["draft", "delivered"].includes(l.status));
const queueWithAddr = inQueue.filter(l => !!(l.address_line1 || l.city));
console.log("---");
console.log("Physical letters:", physical.length);
console.log("In mailing queue (not draft/delivered):", inQueue.length);
console.log("Of those, with address:", queueWithAddr.length);
