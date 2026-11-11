/**
 * FastAPI adapter. Contract documented in docs/fastapi-integration.md.
 * The backend owns the signing key and performs verification server-side.
 */
import type { AdminSession, Notice, NoticeGuardApi, VerificationResult } from "./types";

interface RawNotice {
  id: string;
  title: string;
  department: string;
  notice_date: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  sha256: string;
  signature: string;
  signature_algorithm: string;
  key_fingerprint: string;
  registered_at: string;
  registered_by: string;
}

interface RawVerification {
  notice_id: string;
  status: "valid" | "invalid";
  signature_valid: boolean;
  hash_match: boolean;
  registered_hash: string;
  computed_hash: string;
  algorithm: string;
  key_fingerprint: string;
  candidate_source: VerificationResult["candidateSource"];
  candidate_name: string;
  checked_at: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const mapNotice = (n: RawNotice): Notice => ({
  id: n.id,
  title: n.title,
  department: n.department,
  noticeDate: n.notice_date,
  fileName: n.file_name,
  mimeType: n.mime_type,
  fileSize: n.file_size,
  sha256: n.sha256,
  signature: n.signature,
  signatureAlgorithm: n.signature_algorithm,
  keyFingerprint: n.key_fingerprint,
  registeredAt: n.registered_at,
  registeredBy: n.registered_by,
});

export function createBackendApi(baseUrl: string): NoticeGuardApi {
  const root = baseUrl.replace(/\/+$/, "");

  async function send(path: string, init?: RequestInit): Promise<Response> {
    const res = await fetch(`${root}${path}`, init);
    if (!res.ok) {
      let detail = res.statusText || "Request failed";
      try {
        const body = await res.json();
        if (typeof body?.detail === "string") detail = body.detail;
      } catch {
        /* non-JSON error body */
      }
      throw new ApiError(res.status, detail);
    }
    return res;
  }

  return {
    mode: "backend",

    async login(username, password): Promise<AdminSession> {
      const res = await send("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const body = (await res.json()) as { access_token: string; username: string };
      return {
        username: body.username,
        token: body.access_token,
        mode: "backend",
        issuedAt: new Date().toISOString(),
      };
    },

    async listNotices() {
      const res = await send("/api/notices");
      return ((await res.json()) as RawNotice[]).map(mapNotice);
    },

    async getNotice(id) {
      try {
        const res = await send(`/api/notices/${encodeURIComponent(id)}`);
        return mapNotice((await res.json()) as RawNotice);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },

    async getNoticeFile(id) {
      const res = await send(`/api/notices/${encodeURIComponent(id)}/file`);
      return res.blob();
    },

    async registerNotice(input, session) {
      const form = new FormData();
      form.append("title", input.title);
      form.append("department", input.department);
      form.append("notice_date", input.noticeDate);
      form.append("file", input.file);
      const res = await send("/api/notices", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.token}` },
        body: form,
      });
      return mapNotice((await res.json()) as RawNotice);
    },

    async verifySignature(id, candidate) {
      const form = new FormData();
      form.append("source", candidate.source);
      if (candidate.file) form.append("file", candidate.file, candidate.fileName ?? "document");
      const res = await send(`/api/notices/${encodeURIComponent(id)}/verify`, {
        method: "POST",
        body: form,
      });
      const r = (await res.json()) as RawVerification;
      return {
        noticeId: r.notice_id,
        status: r.status,
        signatureValid: r.signature_valid,
        hashMatch: r.hash_match,
        registeredHash: r.registered_hash,
        computedHash: r.computed_hash,
        algorithm: r.algorithm,
        keyFingerprint: r.key_fingerprint,
        candidateSource: r.candidate_source,
        candidateName: r.candidate_name,
        checkedAt: r.checked_at,
        mode: "backend",
        simulated: false,
      };
    },
  };
}
