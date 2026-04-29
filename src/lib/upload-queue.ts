"use client";

// IndexedDB-backed offline upload queue for guest recordings.
//
// Why this exists: wedding venues often have spotty cell service. We never
// want to lose a guest's recording because the upload happened to fail. The
// fix is to persist the raw blob locally the moment recording stops, attempt
// the upload, and keep retrying when the device comes back online.
//
// Works on iOS Safari + Android Chrome — both fully support storing Blob
// objects in IndexedDB. The companion hook in `use-upload-queue.ts` drives
// retry on `online` / visibility / interval.

const DB_NAME = "sfg-upload-queue";
const DB_VERSION = 1;
const STORE = "items";

export type MessageFormat = "audio" | "video" | "photo";

export interface QueueItemMetadata {
  recorder_name: string | null;
  message_format: MessageFormat;
}

export interface QueueItem {
  id: string;
  code: string;
  blob: Blob;
  contentType: string;
  metadata: QueueItemMetadata;
  status: "pending" | "uploading" | "failed" | "fatal";
  attempts: number;
  lastError: string | null;
  createdAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB not available"));
  }
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("code", "code", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    });
  }
  return dbPromise;
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function enqueueUpload(input: {
  code: string;
  blob: Blob;
  contentType: string;
  metadata: QueueItemMetadata;
}): Promise<QueueItem> {
  const item: QueueItem = {
    id: newId(),
    code: input.code,
    blob: input.blob,
    contentType: input.contentType,
    metadata: input.metadata,
    status: "pending",
    attempts: 0,
    lastError: null,
    createdAt: Date.now(),
  };
  const db = await getDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
    tx.objectStore(STORE).add(item);
  });
  return item;
}

export async function listQueueByCode(code: string): Promise<QueueItem[]> {
  const db = await getDb();
  return new Promise<QueueItem[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const idx = tx.objectStore(STORE).index("code");
    const req = idx.getAll(IDBKeyRange.only(code));
    req.onsuccess = () => {
      const items = (req.result as QueueItem[]) || [];
      items.sort((a, b) => a.createdAt - b.createdAt);
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function updateQueueItem(
  id: string,
  patch: Partial<Omit<QueueItem, "id">>
): Promise<void> {
  const db = await getDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result as QueueItem | undefined;
      if (!existing) return;
      store.put({ ...existing, ...patch });
    };
  });
}

export async function deleteQueueItem(id: string): Promise<void> {
  const db = await getDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
    tx.objectStore(STORE).delete(id);
  });
}
