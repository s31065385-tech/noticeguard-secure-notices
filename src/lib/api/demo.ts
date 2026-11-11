import { evaluateDocument, importPublicKeyJwk, sha256Hex, signBytes, SIGNATURE_ALGORITHM } from "@/lib/crypto";
import { getOrCreateIssuerKey, getStoredNotice, listStoredNotices, putNotice, type StoredNotice } from "@/lib/demo-store";
import type { Notice, NoticeGuardApi } from "./types";

/** Demo-only credentials. Replace with FastAPI /api/auth/login in production. */
export const DEMO_CREDENTIALS = { username: "admin", password: "noticeguard-demo" } as const;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function toNotice(record: StoredNotice): Notice {
  const { file: _file, publicKeyJwk: _jwk, ...notice } = record;
  return notice;
}

function makeNoticeId(date = new Date()): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = crypto.getRandomValues(new Uint8Array(6));
  const suffix = Array.from(rand, (b) => alphabet[b % alphabet.length]).join("");
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, "");
  return `NG-${stamp}-${suffix}`;
}

export function createDemoApi(): NoticeGuardApi {
  return {
    mode: "demo",

    async login(username, password) {
      await wait(450);
      if (username.trim() !== DEMO_CREDENTIALS.username || password !== DEMO_CREDENTIALS.password) {
        throw new Error("Invalid username or password.");
      }
      return {
        username: DEMO_CREDENTIALS.username,
        token: `demo-${crypto.randomUUID()}`,
        mode: "demo",
        issuedAt: new Date().toISOString(),
      };
    },

    async listNotices() {
      const all = await listStoredNotices();
      return all.map(toNotice).sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
    },

    async getNotice(id) {
      const record = await getStoredNotice(id);
      return record ? toNotice(record) : null;
    },

    async getNoticeFile(id) {
      const record = await getStoredNotice(id);
      if (!record) throw new Error("Notice not found.");
      return new Blob([record.file], { type: record.mimeType });
    },

    async registerNotice(input, session) {
      const bytes = await input.file.arrayBuffer();
      const key = await getOrCreateIssuerKey();
      const record: StoredNotice = {
        id: makeNoticeId(),
        title: input.title.trim(),
        department: input.department.trim(),
        noticeDate: input.noticeDate,
        fileName: input.file.name,
        mimeType: input.file.type,
        fileSize: input.file.size,
        sha256: await sha256Hex(bytes),
        signature: await signBytes(key.privateKey, bytes),
        signatureAlgorithm: SIGNATURE_ALGORITHM,
        keyFingerprint: key.fingerprint,
        registeredAt: new Date().toISOString(),
        registeredBy: session.username,
        file: bytes,
        publicKeyJwk: key.publicKeyJwk,
      };
      await putNotice(record);
      return toNotice(record);
    },

    async verifySignature(id, candidate) {
      const record = await getStoredNotice(id);
      if (!record) throw new Error("Notice not found.");
      const bytes = candidate.file ? await candidate.file.arrayBuffer() : record.file;
      const publicKey = await importPublicKeyJwk(record.publicKeyJwk);
      const outcome = await evaluateDocument({
        bytes,
        registeredHash: record.sha256,
        signature: record.signature,
        publicKey,
      });
      await wait(650); // lets the verification animation read clearly
      return {
        noticeId: id,
        status: outcome.status,
        signatureValid: outcome.signatureValid,
        hashMatch: outcome.hashMatch,
        registeredHash: record.sha256,
        computedHash: outcome.computedHash,
        algorithm: record.signatureAlgorithm,
        keyFingerprint: record.keyFingerprint,
        candidateSource: candidate.source,
        candidateName: candidate.fileName ?? record.fileName,
        checkedAt: new Date().toISOString(),
        mode: "demo",
        simulated: true,
      };
    },
  };
}
