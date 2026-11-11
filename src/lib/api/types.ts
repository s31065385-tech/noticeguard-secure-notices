export type ApiMode = "demo" | "backend";

export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export interface Notice {
  id: string;
  title: string;
  department: string;
  /** ISO date (YYYY-MM-DD) printed on the notice. */
  noticeDate: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  /** Lowercase hex SHA-256 of the registered file bytes. */
  sha256: string;
  /** Base64 issuer signature over the file bytes. */
  signature: string;
  signatureAlgorithm: string;
  keyFingerprint: string;
  registeredAt: string;
  registeredBy: string;
}

export interface RegisterNoticeInput {
  title: string;
  department: string;
  noticeDate: string;
  file: File;
}

export interface AdminSession {
  username: string;
  token: string;
  mode: ApiMode;
  issuedAt: string;
}

export type CandidateSource = "registered-file" | "uploaded-copy" | "tamper-test";

export interface VerifyCandidate {
  source: CandidateSource;
  /** Omit to verify the registered file held by the server/store. */
  file?: Blob;
  fileName?: string;
}

export interface VerificationResult {
  noticeId: string;
  status: "valid" | "invalid";
  signatureValid: boolean;
  hashMatch: boolean;
  registeredHash: string;
  computedHash: string;
  algorithm: string;
  keyFingerprint: string;
  candidateSource: CandidateSource;
  candidateName: string;
  checkedAt: string;
  mode: ApiMode;
  /** True when the result comes from the in-browser demo, not a trusted backend. */
  simulated: boolean;
}

export interface NoticeGuardApi {
  mode: ApiMode;
  login(username: string, password: string): Promise<AdminSession>;
  listNotices(): Promise<Notice[]>;
  getNotice(id: string): Promise<Notice | null>;
  getNoticeFile(id: string): Promise<Blob>;
  registerNotice(input: RegisterNoticeInput, session: AdminSession): Promise<Notice>;
  verifySignature(id: string, candidate: VerifyCandidate): Promise<VerificationResult>;
}
