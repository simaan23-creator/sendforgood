import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:/Users/Simaan/sendforgood/.env.local", "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);

const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data, error } = await supa
  .from("voice_messages")
  .select("id, title, message_format, status, letter_type, scheduled_date, milestone_label, recipient_name, recipient_email, audio_url")
  .order("created_at", { ascending: false });

if (error) { console.log("ERR:", error.message); process.exit(1); }

console.log(`${data.length} voice_messages rows`);
for (const r of data) {
  const hasRecording = !!r.audio_url;
  const hasEmail = !!r.recipient_email;
  const isDateBased = r.letter_type === "annual" && !!r.scheduled_date;
  const isMilestone = r.letter_type === "milestone" && !!r.milestone_label;
  const expected = !hasRecording
    ? "draft"
    : (isDateBased && hasEmail) ? "scheduled"
    : (isMilestone && hasEmail) ? "pending_release"
    : "recorded";
  const stuck = r.status !== expected && r.status !== "delivered";
  console.log(
    `  ${r.id.slice(0,8)}  fmt=${r.message_format}  status=${r.status}  type=${r.letter_type ?? "(null)"}  rec=${hasRecording?"Y":"N"}  email=${hasEmail?"Y":"N"}  ${isDateBased ? `date=${r.scheduled_date}` : isMilestone ? `mile="${r.milestone_label}"` : ""}  expected=${expected}  ${stuck ? "  <-- STUCK" : ""}`
  );
}
