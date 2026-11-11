/** IndexedDB persistence for demo mode only. Data stays in this browser. */
import type { Notice } from "@/lib/api/types";
import { exportPublicKeyJwk, generateSigningKeyPair, publicKeyFingerprint } from "@/lib/crypto";

export interface StoredNotice extends Notice {
  file: ArrayBuffer;
  publicKeyJwk: JsonWebKey;
}

interface StoredIssuerKey {
  id: "issuer";
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  publicKeyJwk: JsonWebKey;
  fingerprint: string;
}

const DB_NAME = "noticeguard-demo";
const DB_VERSION = 1;
let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("Browser storage is unavailable in this context."));
  }
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("notices")) db.createObjectStore("notices", { keyPath: "id" });
      if (!db.objectStoreNames.contains("keys")) db.createObjectStore("keys", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error ?? new Error("Could not open browser storage."));
    };
  });
  return dbPromise;
}

async function run<T>(
  store: "notices" | "keys",
  mode: IDBTransactionMode,
  op: (s: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = op(tx.objectStore(store));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

export const putNotice = (n: StoredNotice) => run<IDBValidKey>("notices", "readwrite", (s) => s.put(n));
export const getStoredNotice = async (id: string) =>
  (await run<StoredNotice | undefined>("notices", "readonly", (s) => s.get(id))) ?? null;
export const listStoredNotices = () => run<StoredNotice[]>("notices", "readonly", (s) => s.getAll());

let keyPromise: Promise<StoredIssuerKey> | null = null;

export function getOrCreateIssuerKey(): Promise<StoredIssuerKey> {
  keyPromise ??= (async () => {
    const existing = await run<StoredIssuerKey | undefined>("keys", "readonly", (s) => s.get("issuer"));
    if (existing) return existing;
    const pair = await generateSigningKeyPair();
    const publicKeyJwk = await exportPublicKeyJwk(pair.publicKey);
    const record: StoredIssuerKey = {
      id: "issuer",
      privateKey: pair.privateKey,
      publicKey: pair.publicKey,
      publicKeyJwk,
      fingerprint: await publicKeyFingerprint(publicKeyJwk),
    };
    await run("keys", "readwrite", (s) => s.put(record));
    return record;
  })().catch((e) => {
    keyPromise = null;
    throw e;
  });
  return keyPromise;
}
