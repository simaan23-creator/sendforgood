// Fetch first 256KB of each video/audio recording and look for codec boxes
// (avc1 = H.264, hvc1/hev1 = HEVC/H.265, vp8/vp9 = VP, mp4a = AAC, opus = Opus).
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:/Users/Simaan/sendforgood/.env.local", "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: recs } = await supabase
  .from("memory_recordings")
  .select("id, message_format, audio_url, created_at")
  .in("message_format", ["video", "audio"])
  .order("created_at", { ascending: false })
  .limit(5);

const codecMarkers = ["avc1", "hvc1", "hev1", "vp08", "vp09", "mp4a", "Opus", "ftyp", "moov", "mdat"];

for (const r of recs) {
  console.log(`\n=== [${r.message_format}] ${r.audio_url.split("/").pop()} ===`);
  try {
    // Range fetch first 256KB
    const res = await fetch(r.audio_url, {
      headers: { Range: "bytes=0-262143" },
    });
    const buf = Buffer.from(await res.arrayBuffer());
    console.log(`  fetched ${buf.length} bytes (status ${res.status})`);

    // Print first ftyp box brand + compatible brands
    if (buf.length >= 16 && buf.slice(4, 8).toString() === "ftyp") {
      const major = buf.slice(8, 12).toString();
      const minor = buf.readUInt32BE(12);
      console.log(`  ftyp major brand: "${major}"  minor_version: ${minor}`);
      // Compatible brands list — variable length, until end of box
      const boxLen = buf.readUInt32BE(0);
      const compat = [];
      for (let i = 16; i + 4 <= boxLen; i += 4) {
        compat.push(buf.slice(i, i + 4).toString());
      }
      console.log(`  compatible_brands: [${compat.join(", ")}]`);
    }

    // Scan for codec FOURCCs anywhere in the buffer
    const found = new Set();
    for (const m of codecMarkers) {
      let idx = 0;
      while ((idx = buf.indexOf(m, idx)) !== -1) {
        found.add(m);
        idx += m.length;
      }
    }
    console.log(`  codec markers seen: [${[...found].join(", ")}]`);
  } catch (e) {
    console.log(`  ERR: ${e.message}`);
  }
}
