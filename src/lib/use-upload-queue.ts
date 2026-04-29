"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type QueueItem,
  type QueueItemMetadata,
  enqueueUpload as enqueueIdb,
  listQueueByCode,
  updateQueueItem,
  deleteQueueItem,
} from "./upload-queue";

const RETRY_INTERVAL_MS = 15_000;

// Distinguish errors that should stop retrying (e.g. vault full, request not
// active, recorder permission denied) from transient errors that should keep
// retrying (timeouts, 5xx, network drops).
function isFatalStatus(status: number): boolean {
  if (status >= 500) return false;
  if (status === 408 || status === 429) return false;
  if (status >= 400) return true;
  return false;
}

interface ProcessorErrorWithStatus extends Error {
  fatal?: boolean;
}

async function processItem(code: string, item: QueueItem): Promise<void> {
  // Step 1: get a signed upload URL
  const urlRes = await fetch(`/api/memory-requests/${code}/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: item.contentType }),
  });
  if (!urlRes.ok) {
    const data = await urlRes.json().catch(() => ({}));
    const err: ProcessorErrorWithStatus = new Error(
      data.error || `Failed to prepare upload (${urlRes.status})`
    );
    err.fatal = isFatalStatus(urlRes.status);
    throw err;
  }
  const urlData = await urlRes.json();

  // Step 2: PUT the blob directly to Supabase storage. This is where slow /
  // dropped cellular connections most often fail.
  const putRes = await fetch(urlData.signedUrl, {
    method: "PUT",
    headers: { "Content-Type": urlData.contentType },
    body: item.blob,
  });
  if (!putRes.ok) {
    const sizeMB = (item.blob.size / (1024 * 1024)).toFixed(1);
    const err: ProcessorErrorWithStatus = new Error(
      `Upload failed (${sizeMB} MB, status ${putRes.status})`
    );
    // Storage upload errors are almost always transient (network, signed URL
    // expiry). Keep retrying.
    err.fatal = false;
    throw err;
  }

  // Step 3: tell our API a recording row should be created.
  const metaRes = await fetch(`/api/memory-requests/${code}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recorder_name: item.metadata.recorder_name,
      audio_url: urlData.publicUrl,
      message_format: item.metadata.message_format,
    }),
  });
  if (!metaRes.ok) {
    const data = await metaRes.json().catch(() => ({}));
    const err: ProcessorErrorWithStatus = new Error(
      data.error || `Failed to save (${metaRes.status})`
    );
    err.fatal = isFatalStatus(metaRes.status);
    throw err;
  }
}

export interface UseUploadQueueResult {
  queue: QueueItem[];
  online: boolean;
  processing: boolean;
  enqueue: (input: {
    blob: Blob;
    contentType: string;
    metadata: QueueItemMetadata;
  }) => Promise<QueueItem>;
  processOnce: () => Promise<void>;
  refresh: () => Promise<void>;
  discard: (id: string) => Promise<void>;
}

export function useUploadQueue(code: string): UseUploadQueueResult {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [processing, setProcessing] = useState(false);
  const processingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!code) return;
    try {
      const items = await listQueueByCode(code);
      setQueue(items);
    } catch {
      // IndexedDB unavailable (private mode, etc.) — fall back to no queue.
      setQueue([]);
    }
  }, [code]);

  const processOnce = useCallback(async () => {
    if (processingRef.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    if (!code) return;

    processingRef.current = true;
    setProcessing(true);
    try {
      const items = await listQueueByCode(code);
      // Skip items already classified as fatal — they need user action.
      const work = items.filter((i) => i.status !== "fatal");
      for (const item of work) {
        try {
          await updateQueueItem(item.id, {
            status: "uploading",
            lastError: null,
          });
          await processItem(code, item);
          await deleteQueueItem(item.id);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Upload failed";
          const fatal =
            err instanceof Error &&
            (err as ProcessorErrorWithStatus).fatal === true;
          await updateQueueItem(item.id, {
            status: fatal ? "fatal" : "failed",
            attempts: item.attempts + 1,
            lastError: msg,
          });
          // For fatal errors, stop the loop — likely affects the next items
          // too (e.g. vault closed). Transient: continue with the rest.
          if (fatal) break;
        }
        await refresh();
      }
    } finally {
      processingRef.current = false;
      setProcessing(false);
      await refresh();
    }
  }, [code, refresh]);

  // Kick off an initial load + retry on mount.
  useEffect(() => {
    refresh().then(() => {
      // If the page is opened with items already queued from a previous
      // session, try to resume immediately.
      processOnce();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Wire connectivity + visibility + periodic retry.
  useEffect(() => {
    function handleOnline() {
      setOnline(true);
      processOnce();
    }
    function handleOffline() {
      setOnline(false);
    }
    function handleVisibility() {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        processOnce();
      }
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibility);
    const interval = window.setInterval(processOnce, RETRY_INTERVAL_MS);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearInterval(interval);
    };
  }, [processOnce]);

  // Warn the user before they close the tab if there are unsent items.
  useEffect(() => {
    if (queue.length === 0) return;
    function beforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      // Modern browsers ignore the custom string but require returnValue set.
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [queue.length]);

  const enqueue = useCallback(
    async (input: {
      blob: Blob;
      contentType: string;
      metadata: QueueItemMetadata;
    }) => {
      const item = await enqueueIdb({ code, ...input });
      await refresh();
      return item;
    },
    [code, refresh]
  );

  const discard = useCallback(
    async (id: string) => {
      await deleteQueueItem(id);
      await refresh();
    },
    [refresh]
  );

  return { queue, online, processing, enqueue, processOnce, refresh, discard };
}
