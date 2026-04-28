import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Sweep orphaned storage objects. An object is "orphaned" if its path is not
 * referenced by any URL/path column in the owning table(s).
 *
 * Safety rules:
 *   - Skip objects newer than MIN_AGE_HOURS so in-flight uploads (signed URL
 *     issued, upload in progress, DB row not yet written) aren't nuked.
 *   - Hard cap deletions per bucket per run (DELETE_LIMIT) — easier to recover
 *     from a logic bug.
 *   - Run idempotently: re-running deletes the same orphans (no DB state).
 */

const MIN_AGE_HOURS = 24;
const DELETE_LIMIT = 200;
const LIST_LIMIT = 1000;

type BucketSpec = {
  bucket: string;
  // Tables/columns whose values may reference this bucket. The check is a
  // substring match against the stored value (URL or path).
  references: { table: string; column: string }[];
};

const BUCKETS: BucketSpec[] = [
  {
    bucket: "voice-messages",
    references: [
      { table: "voice_messages", column: "audio_url" },
      { table: "message_uses", column: "content_url" },
    ],
  },
  {
    bucket: "memory-recordings",
    references: [{ table: "memory_recordings", column: "audio_url" }],
  },
  {
    bucket: "shipment-photos",
    references: [{ table: "shipments", column: "photo_url" }],
  },
  {
    bucket: "letter-photos",
    references: [{ table: "letters", column: "photo_url" }],
  },
  {
    bucket: "recipient-photos",
    references: [{ table: "recipients", column: "photo_url" }],
  },
];

async function loadReferencedPaths(
  references: BucketSpec["references"]
): Promise<Set<string>> {
  const referenced = new Set<string>();
  for (const ref of references) {
    // Pull all non-null values. Storage object counts are bounded by upload
    // volume; we accept loading them all rather than per-object DB lookups.
    const { data, error } = await supabaseAdmin
      .from(ref.table)
      .select(ref.column)
      .not(ref.column, "is", null);
    if (error) {
      throw new Error(`Failed to load ${ref.table}.${ref.column}: ${error.message}`);
    }
    for (const row of data || []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = (row as any)[ref.column];
      if (typeof value === "string" && value.length > 0) {
        referenced.add(value);
      }
    }
  }
  return referenced;
}

function isReferenced(path: string, referenced: Set<string>): boolean {
  // Stored values may be the path itself, or a public/signed URL containing
  // the path as a suffix. A trailing-substring match against the path covers
  // both shapes without false positives between buckets (paths are unique
  // within a bucket).
  for (const value of referenced) {
    if (value === path) return true;
    if (value.endsWith("/" + path) || value.endsWith(path)) return true;
  }
  return false;
}

async function listAllObjects(bucket: string): Promise<{ name: string; created_at?: string }[]> {
  // Recursively walk the bucket. Supabase storage list() is per-prefix.
  const all: { name: string; created_at?: string }[] = [];
  const queue: string[] = [""];

  while (queue.length > 0) {
    const prefix = queue.shift()!;
    let offset = 0;
    while (true) {
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .list(prefix, { limit: LIST_LIMIT, offset });
      if (error) throw new Error(`list(${bucket}, ${prefix}): ${error.message}`);
      if (!data || data.length === 0) break;

      for (const entry of data) {
        // A "folder" has no id (Supabase storage convention).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isFolder = (entry as any).id === null || (entry as any).id === undefined;
        const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (isFolder) {
          queue.push(fullPath);
        } else {
          all.push({ name: fullPath, created_at: entry.created_at ?? undefined });
        }
      }

      if (data.length < LIST_LIMIT) break;
      offset += LIST_LIMIT;
    }
  }

  return all;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = Date.now() - MIN_AGE_HOURS * 60 * 60 * 1000;
  const report: Record<
    string,
    { scanned: number; orphaned: number; deleted: number; skippedYoung: number; error?: string }
  > = {};

  for (const spec of BUCKETS) {
    const result = { scanned: 0, orphaned: 0, deleted: 0, skippedYoung: 0 };
    try {
      const referenced = await loadReferencedPaths(spec.references);
      const objects = await listAllObjects(spec.bucket);
      result.scanned = objects.length;

      const toDelete: string[] = [];
      for (const obj of objects) {
        if (isReferenced(obj.name, referenced)) continue;

        const createdAt = obj.created_at ? Date.parse(obj.created_at) : NaN;
        if (Number.isFinite(createdAt) && createdAt > cutoff) {
          result.skippedYoung++;
          continue;
        }

        result.orphaned++;
        if (toDelete.length < DELETE_LIMIT) {
          toDelete.push(obj.name);
        }
      }

      if (toDelete.length > 0) {
        const { error: removeError } = await supabaseAdmin.storage
          .from(spec.bucket)
          .remove(toDelete);
        if (removeError) {
          throw new Error(`remove(${spec.bucket}): ${removeError.message}`);
        }
        result.deleted = toDelete.length;
      }

      report[spec.bucket] = result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Sweep failed for bucket ${spec.bucket}:`, err);
      report[spec.bucket] = { ...result, error: msg };
    }
  }

  return NextResponse.json({ ok: true, report });
}
