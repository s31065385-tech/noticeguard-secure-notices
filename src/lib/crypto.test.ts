// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  evaluateDocument,
  exportPublicKeyJwk,
  generateSigningKeyPair,
  importPublicKeyJwk,
  sha256Hex,
  signBytes,
  tamperBytes,
} from "./crypto";

const original = new TextEncoder().encode("Official Notice: exams begin 1 December.").buffer as ArrayBuffer;

async function register() {
  const pair = await generateSigningKeyPair();
  const publicKey = await importPublicKeyJwk(await exportPublicKeyJwk(pair.publicKey));
  return {
    publicKey,
    registeredHash: await sha256Hex(original),
    signature: await signBytes(pair.privateKey, original),
  };
}

describe("digital signature verification", () => {
  it("reports the original document as Signature Valid", async () => {
    const reg = await register();
    const result = await evaluateDocument({ ...reg, bytes: original });
    expect(result.status).toBe("valid");
    expect(result.hashMatch).toBe(true);
    expect(result.signatureValid).toBe(true);
  });

  it("reports a modified document as Signature Invalid with a different SHA-256", async () => {
    const reg = await register();
    const result = await evaluateDocument({ ...reg, bytes: tamperBytes(original) });
    expect(result.status).toBe("invalid");
    expect(result.signatureValid).toBe(false);
    expect(result.hashMatch).toBe(false);
    expect(result.computedHash).not.toBe(reg.registeredHash);
  });

  it("rejects a document signed by a different key", async () => {
    const reg = await register();
    const other = await generateSigningKeyPair();
    const forged = await signBytes(other.privateKey, original);
    const result = await evaluateDocument({ ...reg, signature: forged, bytes: original });
    expect(result.status).toBe("invalid");
    expect(result.signatureValid).toBe(false);
  });

  it("computes the standard SHA-256 hex digest", async () => {
    const abc = new TextEncoder().encode("abc").buffer as ArrayBuffer;
    expect(await sha256Hex(abc)).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});
