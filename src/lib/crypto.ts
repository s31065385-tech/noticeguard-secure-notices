/**
 * Real Web Crypto primitives used by NoticeGuard.
 * Hashing: SHA-256. Signatures: ECDSA over P-256 with SHA-256.
 * These run for real in the browser; in demo mode the *key custody* is what is simulated
 * (the issuer key lives in this browser instead of a protected backend/HSM).
 */

export const SIGNATURE_ALGORITHM = "ECDSA-P256-SHA256";

const KEY_PARAMS: EcKeyGenParams = { name: "ECDSA", namedCurve: "P-256" };
const SIGN_PARAMS: EcdsaParams = { name: "ECDSA", hash: "SHA-256" };

function subtle(): SubtleCrypto {
  const s = globalThis.crypto?.subtle;
  if (!s) {
    throw new Error("Web Crypto is unavailable. Open NoticeGuard over HTTPS or localhost.");
  }
  return s;
}

export function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function bytesToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export function base64ToBytes(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out.buffer;
}

export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  return toHex(await subtle().digest("SHA-256", data));
}

export async function generateSigningKeyPair(): Promise<CryptoKeyPair> {
  // Private key is non-extractable; the public half is always exportable.
  return subtle().generateKey(KEY_PARAMS, false, ["sign", "verify"]);
}

export async function exportPublicKeyJwk(key: CryptoKey): Promise<JsonWebKey> {
  return subtle().exportKey("jwk", key);
}

export async function importPublicKeyJwk(jwk: JsonWebKey): Promise<CryptoKey> {
  return subtle().importKey("jwk", jwk, KEY_PARAMS, true, ["verify"]);
}

export async function publicKeyFingerprint(jwk: JsonWebKey): Promise<string> {
  const material = new TextEncoder().encode(`${jwk.crv}:${jwk.x}:${jwk.y}`);
  const hex = await sha256Hex(material.buffer as ArrayBuffer);
  return hex.slice(0, 32).toUpperCase().match(/.{4}/g)!.join(":");
}

export async function signBytes(privateKey: CryptoKey, data: ArrayBuffer): Promise<string> {
  return bytesToBase64(await subtle().sign(SIGN_PARAMS, privateKey, data));
}

export async function verifyBytes(
  publicKey: CryptoKey,
  data: ArrayBuffer,
  signatureB64: string,
): Promise<boolean> {
  try {
    return await subtle().verify(SIGN_PARAMS, publicKey, base64ToBytes(signatureB64), data);
  } catch {
    return false;
  }
}

/** Returns a copy of the bytes with a single byte flipped — a minimal "modified document". */
export function tamperBytes(data: ArrayBuffer): ArrayBuffer {
  const copy = new Uint8Array(data.slice(0));
  if (copy.length === 0) return new Uint8Array([0x01]).buffer;
  const index = Math.floor(copy.length / 2);
  copy[index] = (copy[index] ?? 0) ^ 0xff;
  return copy.buffer;
}

export interface DocumentEvaluation {
  computedHash: string;
  hashMatch: boolean;
  signatureValid: boolean;
  status: "valid" | "invalid";
}

/** Independent integrity (hash) and authenticity (signature) checks for one document. */
export async function evaluateDocument(params: {
  bytes: ArrayBuffer;
  registeredHash: string;
  signature: string;
  publicKey: CryptoKey;
}): Promise<DocumentEvaluation> {
  const computedHash = await sha256Hex(params.bytes);
  const hashMatch = computedHash === params.registeredHash.toLowerCase();
  const signatureValid = await verifyBytes(params.publicKey, params.bytes, params.signature);
  return {
    computedHash,
    hashMatch,
    signatureValid,
    status: hashMatch && signatureValid ? "valid" : "invalid",
  };
}
